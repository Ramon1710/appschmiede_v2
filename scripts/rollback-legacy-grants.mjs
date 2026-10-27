import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const adminUid = process.env.ACCESS_MIGRATION_APPROVED_BY_UID?.trim();
const uids = [...new Set((process.env.AUTHORIZED_LEGACY_USER_UIDS ?? '').split(',').map((uid) => uid.trim()).filter(Boolean))];
const applyChanges = process.argv.includes('--apply');

if (!adminUid || !/^[A-Za-z0-9_-]{1,128}$/.test(adminUid)) {
  throw new Error('ACCESS_MIGRATION_APPROVED_BY_UID must be the reviewing administrator Firebase UID.');
}
if (uids.length === 0 || uids.some((uid) => !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) || uids.length > 450) {
  throw new Error('AUTHORIZED_LEGACY_USER_UIDS must contain 1 to 450 explicit Firebase UIDs.');
}
if (applyChanges && process.env.ACCESS_ROLLBACK_ACK !== 'I_APPROVE_LEGACY_ACCESS_ROLLBACK') {
  throw new Error('Set ACCESS_ROLLBACK_ACK=I_APPROVE_LEGACY_ACCESS_ROLLBACK before --apply.');
}

const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? '').trim().replace(/\\n/g, '\n');
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
if (!projectId || !clientEmail || !privateKey) throw new Error('Firebase Admin credentials are required.');

const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const auth = getAuth(app);
const db = getFirestore(app);
const adminAuthUser = await auth.getUser(adminUid);
const adminProfile = await db.collection('users').doc(adminUid).get();
if (adminAuthUser.disabled || !adminAuthUser.emailVerified || !adminProfile.exists || adminProfile.get('role') !== 'admin') {
  throw new Error('Reviewer must be enabled, email-verified, and have the server-managed admin role.');
}

const targets = await Promise.all(uids.map(async (uid) => {
  const user = await auth.getUser(uid);
  const grant = await db.collection('accessGrants').doc(uid).get();
  if (!grant.exists || grant.get('source') !== 'legacy_migration') {
    throw new Error(`UID ${uid} does not have a legacy_migration grant; no grants were changed.`);
  }
  if (grant.get('status') !== 'active' && grant.get('status') !== 'revoked') {
    throw new Error(`UID ${uid} has an unexpected grant status; no grants were changed.`);
  }
  return { uid, email: user.email ?? null, status: grant.get('status') };
}));

const activeTargets = targets.filter((target) => target.status === 'active');
console.log(`${applyChanges ? 'Apply' : 'Dry run'}: ${activeTargets.length} legacy grants would be revoked.`);
console.log('Only accessGrants documents will be updated. Auth users, profiles, and projects are not deleted.');
if (!applyChanges) {
  console.log('No data changed. Add --apply and ACCESS_ROLLBACK_ACK after review.');
  process.exit(0);
}

const refs = targets.map(({ uid }) => db.collection('accessGrants').doc(uid));
await db.runTransaction(async (transaction) => {
  const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
  snapshots.forEach((snapshot, index) => {
    if (!snapshot.exists || snapshot.get('source') !== 'legacy_migration' || !['active', 'revoked'].includes(snapshot.get('status'))) {
      throw new Error(`Grant for UID ${targets[index].uid} changed after review; no rollback writes were made.`);
    }
  });
  snapshots.forEach((snapshot, index) => {
    if (snapshot.get('status') === 'revoked') return;
    transaction.update(refs[index], {
      status: 'revoked',
      updatedAt: FieldValue.serverTimestamp(),
      rolledBackAt: FieldValue.serverTimestamp(),
      rolledBackByUid: adminUid,
    });
  });
});

console.log(`Revoked ${activeTargets.length} explicitly listed legacy grants.`);
