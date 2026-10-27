import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const approvedEmail = 'ramon.meyer@hotmail.de';
const targetEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const confirmEmail = process.env.BOOTSTRAP_ADMIN_CONFIRM_EMAIL?.trim().toLowerCase();
const confirmedUid = process.env.BOOTSTRAP_ADMIN_CONFIRM_UID?.trim();
const applyChanges = process.argv.includes('--apply');
const rollback = process.argv.includes('--rollback');

if (targetEmail !== approvedEmail || confirmEmail !== approvedEmail) {
  throw new Error('BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_CONFIRM_EMAIL must both match the approved existing account.');
}
if (applyChanges && !confirmedUid) {
  throw new Error('Set BOOTSTRAP_ADMIN_CONFIRM_UID to the UID printed by the dry run before applying.');
}
if (applyChanges && !rollback && process.env.BOOTSTRAP_ADMIN_ACK !== 'I_APPROVE_ADMIN_ROLE') {
  throw new Error('Set BOOTSTRAP_ADMIN_ACK=I_APPROVE_ADMIN_ROLE before --apply.');
}
if (rollback && applyChanges && process.env.BOOTSTRAP_ADMIN_ACK !== 'I_APPROVE_ADMIN_ROLLBACK') {
  throw new Error('Set BOOTSTRAP_ADMIN_ACK=I_APPROVE_ADMIN_ROLLBACK before --rollback --apply.');
}

const privateKeyRaw = (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? '').trim();
const privateKey = ((privateKeyRaw.startsWith('"') && privateKeyRaw.endsWith('"')) ||
  (privateKeyRaw.startsWith("'") && privateKeyRaw.endsWith("'"))
  ? privateKeyRaw.slice(1, -1)
  : privateKeyRaw).replace(/\\n/g, '\n');
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
if (!projectId || !clientEmail || !privateKey) throw new Error('Firebase Admin credentials are required.');

const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const auth = getAuth(app);
const db = getFirestore(app);
const authUser = await auth.getUserByEmail(approvedEmail);
if (authUser.disabled || !authUser.emailVerified || !authUser.email || authUser.email.trim().toLowerCase() !== approvedEmail) {
  throw new Error('The existing Firebase Auth account must be enabled, verified, and match the approved email.');
}
if (confirmedUid && confirmedUid !== authUser.uid) {
  throw new Error('BOOTSTRAP_ADMIN_CONFIRM_UID does not match the UID returned by Firebase Authentication.');
}

const uid = authUser.uid;
const profileRef = db.collection('users').doc(uid);
const grantRef = db.collection('accessGrants').doc(uid);
const migrationRef = db.collection('adminRoleMigrations').doc(uid);
const [profileSnapshot, grantSnapshot, migrationSnapshot, projectsByOwnerId, projectsByOwnerUid] = await Promise.all([
  profileRef.get(),
  grantRef.get(),
  migrationRef.get(),
  db.collection('projects').where('ownerId', '==', uid).count().get(),
  db.collection('projects').where('ownerUid', '==', uid).count().get(),
]);

if (!profileSnapshot.exists || typeof profileSnapshot.get('email') !== 'string' ||
  profileSnapshot.get('email').trim().toLowerCase() !== approvedEmail) {
  throw new Error('A matching existing user profile is required; the script never creates a new profile.');
}
const previousRole = profileSnapshot.get('role');
if (previousRole !== 'admin' && previousRole !== 'user') {
  throw new Error(`Unexpected existing profile role '${String(previousRole)}'; refusing to overwrite it.`);
}
if (grantSnapshot.exists && (grantSnapshot.get('status') !== 'active' ||
  typeof grantSnapshot.get('email') !== 'string' || grantSnapshot.get('email').trim().toLowerCase() !== approvedEmail)) {
  throw new Error('An existing non-active or mismatched access grant requires manual review.');
}

if (rollback) {
  if (!migrationSnapshot.exists || migrationSnapshot.get('status') !== 'applied') {
    throw new Error('No applied admin-role migration record exists for rollback.');
  }
  if (previousRole !== 'admin') {
    throw new Error('The profile role has changed since migration; refusing to overwrite it during rollback.');
  }
}

const grantWillBeCreated = !grantSnapshot.exists;
console.log(JSON.stringify({
  mode: applyChanges ? (rollback ? 'rollback' : 'apply') : (rollback ? 'rollback-dry-run' : 'dry-run'),
  projectId,
  authAccountFound: true,
  uid,
  emailVerified: authUser.emailVerified,
  profileExists: true,
  previousRole,
  nextRole: rollback ? migrationSnapshot.get('previousRole') : 'admin',
  grantStatus: grantSnapshot.exists ? grantSnapshot.get('status') : 'missing',
  grantWillBeCreated: !rollback && grantWillBeCreated,
  ownedByOwnerIdCount: projectsByOwnerId.data().count,
  ownedByLegacyOwnerUidCount: projectsByOwnerUid.data().count,
  projectDataWillChange: false,
  authAccountWillChange: false,
}, null, 2));

if (!applyChanges) {
  console.log(rollback
    ? 'No data changed. Add --apply and BOOTSTRAP_ADMIN_ACK=I_APPROVE_ADMIN_ROLLBACK after review.'
    : 'No data changed. Confirm the printed UID, then add --apply and BOOTSTRAP_ADMIN_ACK=I_APPROVE_ADMIN_ROLE after review.');
  process.exit(0);
}

if (migrationSnapshot.exists && !rollback) {
  throw new Error('An admin-role migration record already exists; this script is one-time.');
}

await db.runTransaction(async (transaction) => {
  const [latestProfile, latestGrant, latestMigration] = await Promise.all([
    transaction.get(profileRef),
    transaction.get(grantRef),
    transaction.get(migrationRef),
  ]);
  if (!latestProfile.exists || latestProfile.get('email')?.trim().toLowerCase() !== approvedEmail) {
    throw new Error('The existing profile changed after review; no migration writes were made.');
  }

  if (rollback) {
    const record = latestMigration.data();
    if (!latestMigration.exists || record?.status !== 'applied' || latestProfile.get('role') !== 'admin') {
      throw new Error('Migration state changed after review; no rollback writes were made.');
    }
    if (record.grantCreated) {
      if (!latestGrant.exists || latestGrant.get('source') !== 'admin_bootstrap' || latestGrant.get('status') !== 'active') {
        throw new Error('Bootstrap-created grant changed after review; refusing to overwrite it.');
      }
      transaction.update(grantRef, {
        status: 'revoked',
        updatedAt: FieldValue.serverTimestamp(),
        revokedAt: FieldValue.serverTimestamp(),
        revokedByUid: uid,
      });
    }
    transaction.update(profileRef, { role: record.previousRole, updatedAt: FieldValue.serverTimestamp() });
    transaction.update(migrationRef, { status: 'rolled_back', rolledBackAt: FieldValue.serverTimestamp() });
    return;
  }

  if (latestMigration.exists || (latestProfile.get('role') !== 'admin' && latestProfile.get('role') !== 'user')) {
    throw new Error('Target profile or migration record changed after review; no writes were made.');
  }
  if (latestGrant.exists && (latestGrant.get('status') !== 'active' ||
    typeof latestGrant.get('email') !== 'string' || latestGrant.get('email').trim().toLowerCase() !== approvedEmail)) {
    throw new Error('Access grant changed after review; no writes were made.');
  }

  transaction.update(profileRef, { role: 'admin', updatedAt: FieldValue.serverTimestamp() });
  const grantCreated = !latestGrant.exists;
  if (grantCreated) {
    transaction.create(grantRef, {
      uid,
      email: authUser.email,
      status: 'active',
      source: 'admin_bootstrap',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      approvedByUid: uid,
    });
  }
  transaction.create(migrationRef, {
    uid,
    email: approvedEmail,
    status: 'applied',
    previousRole: latestProfile.get('role'),
    grantCreated,
    projectCountAtMigration: {
      ownerId: projectsByOwnerId.data().count,
      ownerUid: projectsByOwnerUid.data().count,
    },
    createdAt: FieldValue.serverTimestamp(),
  });
});

console.log(rollback
  ? 'Rollback complete. Existing Auth account and projects remain unchanged.'
  : `Admin role and required access grant set for existing Firebase UID ${uid}. Auth account and projects remain unchanged.`);
