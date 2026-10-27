import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const approvedByUid = process.env.ACCESS_MIGRATION_APPROVED_BY_UID?.trim();
const uids = [...new Set((process.env.AUTHORIZED_LEGACY_USER_UIDS ?? '').split(',').map((uid) => uid.trim()).filter(Boolean))];
const applyChanges = process.argv.includes('--apply');

if (!approvedByUid || !/^[A-Za-z0-9_-]{1,128}$/.test(approvedByUid)) {
  throw new Error('Set ACCESS_MIGRATION_APPROVED_BY_UID to the reviewing administrator Firebase UID.');
}
if (uids.length === 0 || uids.some((uid) => !/^[A-Za-z0-9_-]{1,128}$/.test(uid))) {
  throw new Error('AUTHORIZED_LEGACY_USER_UIDS must contain an explicit comma-separated list of Firebase UIDs.');
}
if (uids.length > 450) {
  throw new Error('Migrate at most 450 approved UIDs per run.');
}

const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? '').trim().replace(/\\n/g, '\n');
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
if (!projectId || !clientEmail || !privateKey) {
  throw new Error('Firebase Admin credentials are required.');
}

const app = getApps()[0] ?? initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
});
const auth = getAuth(app);
const db = getFirestore(app);
const approverProfile = await db.collection('users').doc(approvedByUid).get();
if (!approverProfile.exists || approverProfile.get('role') !== 'admin') {
  throw new Error('Migration approver must have the server-managed admin role.');
}

const approvedUsers = await Promise.all(uids.map(async (uid) => {
  const user = await auth.getUser(uid);
  if (user.disabled || !user.email) {
    throw new Error(`UID ${uid} is disabled or has no email; no grants were written.`);
  }
  return { uid, email: user.email };
}));

const existingGrants = await Promise.all(approvedUsers.map(async ({ uid, email }) => {
  const snapshot = await db.collection('accessGrants').doc(uid).get();
  return {
    uid,
    email,
    exists: snapshot.exists,
    status: snapshot.exists ? snapshot.get('status') : null,
    existingEmail: snapshot.exists ? snapshot.get('email') : null,
  };
}));

const eligible = existingGrants.filter((grant) => !grant.exists);
const blocked = existingGrants.filter((grant) => grant.exists && !(grant.status === 'active' && grant.existingEmail === grant.email));
if (blocked.length) {
  throw new Error(`Existing non-matching grants require manual review; no grants were written: ${blocked.map(({ uid }) => uid).join(', ')}`);
}

console.log(`Validated ${approvedUsers.length} explicitly approved Firebase UIDs; ${eligible.length} new grants would be created.`);
if (!applyChanges) {
  console.log('Dry run only. Add --apply to write these approved grants.');
  process.exit(0);
}

const grantRefs = approvedUsers.map(({ uid }) => db.collection('accessGrants').doc(uid));
await db.runTransaction(async (transaction) => {
  const snapshots = await Promise.all(grantRefs.map((ref) => transaction.get(ref)));
  snapshots.forEach((snapshot, index) => {
    const { uid, email } = approvedUsers[index];
    if (snapshot.exists) {
      if (snapshot.get('status') === 'active' && snapshot.get('email') === email) return;
      throw new Error(`Grant for UID ${uid} changed during migration; stopping for manual review.`);
    }
  });

  snapshots.forEach((snapshot, index) => {
    if (snapshot.exists) return;
    const { uid, email } = approvedUsers[index];
    transaction.create(grantRefs[index], {
      uid,
      email,
      status: 'active',
      source: 'legacy_migration',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      approvedByUid,
    });
  });
});

console.log(`Created ${eligible.length} access grants for the explicitly approved UID allowlist.`);
