import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const adminUid = process.env.BOOTSTRAP_ADMIN_UID?.trim();
const confirmedUid = process.env.BOOTSTRAP_ADMIN_CONFIRM_UID?.trim();
const confirmedEmail = process.env.BOOTSTRAP_ADMIN_CONFIRM_EMAIL?.trim().toLowerCase();
const applyChanges = process.argv.includes('--apply');
const rollback = process.argv.includes('--rollback');

if (!adminUid || !/^[A-Za-z0-9_-]{1,128}$/.test(adminUid) || confirmedUid !== adminUid) {
  throw new Error('Set BOOTSTRAP_ADMIN_UID and BOOTSTRAP_ADMIN_CONFIRM_UID to the same reviewed Firebase UID.');
}
if (!confirmedEmail) {
  throw new Error('Set BOOTSTRAP_ADMIN_CONFIRM_EMAIL to the reviewed Firebase Auth email.');
}
if (applyChanges && !rollback && process.env.BOOTSTRAP_ADMIN_ACK !== 'I_APPROVE_ADMIN_ROLE') {
  throw new Error('Set BOOTSTRAP_ADMIN_ACK=I_APPROVE_ADMIN_ROLE before --apply.');
}
if (rollback && applyChanges && process.env.BOOTSTRAP_ADMIN_ACK !== 'I_APPROVE_ADMIN_ROLLBACK') {
  throw new Error('Set BOOTSTRAP_ADMIN_ACK=I_APPROVE_ADMIN_ROLLBACK before --rollback --apply.');
}

const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? '').trim().replace(/\\n/g, '\n');
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
if (!projectId || !clientEmail || !privateKey) throw new Error('Firebase Admin credentials are required.');

const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const authUser = await getAuth(app).getUser(adminUid);
if (authUser.disabled || !authUser.emailVerified || !authUser.email || authUser.email.trim().toLowerCase() !== confirmedEmail) {
  throw new Error('Target must be enabled, email-verified, and match the explicitly confirmed Firebase Auth email.');
}

const db = getFirestore(app);
const profileRef = db.collection('users').doc(adminUid);
const profileSnapshot = await profileRef.get();
if (profileSnapshot.exists && (typeof profileSnapshot.get('email') !== 'string' || profileSnapshot.get('email').trim().toLowerCase() !== confirmedEmail)) {
  throw new Error('Existing profile email does not match the confirmed Firebase Auth user.');
}

const currentRole = profileSnapshot.exists ? profileSnapshot.get('role') : 'missing';
if (rollback && currentRole !== 'admin') {
  throw new Error('Rollback refused because the selected profile is not currently an admin.');
}
if (!rollback && currentRole !== 'missing' && currentRole !== 'user' && currentRole !== 'admin') {
  throw new Error(`Unexpected profile role '${String(currentRole)}'; refusing to overwrite it.`);
}

const nextRole = rollback ? 'user' : 'admin';
console.log(`${applyChanges ? 'Apply' : 'Dry run'}: set users/${adminUid}.role from '${String(currentRole)}' to '${nextRole}'.`);
console.log(`Target Firebase Auth email: ${authUser.email}`);
if (currentRole === 'missing') console.log('The apply operation will create one minimal admin profile.');
if (!applyChanges) {
  console.log(rollback ? 'No data changed. Add --apply and BOOTSTRAP_ADMIN_ACK=I_APPROVE_ADMIN_ROLLBACK to demote this role.' : 'No data changed. Add --apply and BOOTSTRAP_ADMIN_ACK=I_APPROVE_ADMIN_ROLE to promote this role.');
  process.exit(0);
}

await db.runTransaction(async (transaction) => {
  const latestProfile = await transaction.get(profileRef);
  if (currentRole === 'missing') {
    if (latestProfile.exists) throw new Error('A user profile appeared after review; rerun the dry run and inspect the target.');
    transaction.create(profileRef, {
      email: authUser.email,
      displayName: authUser.displayName ?? null,
      company: null,
      plan: 'business',
      planStatus: 'active',
      coinsBalance: Number.MAX_SAFE_INTEGER,
      role: nextRole,
      subscriptionRenewsAt: null,
      billingMethod: null,
      planSince: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      onboarding: { welcomeTourPending: true },
      adminBootstrapCreatedProfile: true,
    });
    return;
  }

  if (!latestProfile.exists || latestProfile.get('role') !== currentRole || latestProfile.get('email')?.trim().toLowerCase() !== confirmedEmail) {
    throw new Error('Profile changed after review; rerun the dry run and inspect the target.');
  }
  transaction.update(profileRef, {
    role: nextRole,
    updatedAt: FieldValue.serverTimestamp(),
  });
});

console.log(`Updated users/${adminUid}.role to '${nextRole}'. Firebase Auth account and project data were not changed.`);
