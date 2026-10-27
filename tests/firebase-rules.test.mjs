import { readFile } from 'node:fs/promises';
import test, { after, before } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { getBytes, ref, uploadBytes } from 'firebase/storage';

const projectId = 'demo-appschmiede-v2';
const adminUid = 'approved-admin';
const invitedUid = 'invited-member';
const otherUid = 'other-member';
const unknownUid = 'unknown-user';
const adminEmail = 'admin@example.test';
const invitedEmail = 'member@example.test';
const otherEmail = 'other@example.test';
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile('firestore.rules', 'utf8') },
    storage: { rules: await readFile('storage.rules', 'utf8') },
  });

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'users', adminUid), { email: adminEmail, role: 'admin', plan: 'business', coinsBalance: 1000 }),
      setDoc(doc(db, 'users', invitedUid), { email: invitedEmail, role: 'user', plan: 'free', coinsBalance: 30 }),
      setDoc(doc(db, 'users', otherUid), { email: otherEmail, role: 'user', plan: 'free', coinsBalance: 30 }),
      setDoc(doc(db, 'accessGrants', invitedUid), { email: invitedEmail, status: 'active' }),
      setDoc(doc(db, 'accessGrants', otherUid), { email: otherEmail, status: 'active' }),
      setDoc(doc(db, 'projects', 'invited-project'), {
        ownerId: invitedUid,
        ownerUid: invitedUid,
        members: [invitedUid],
        name: 'Invited project',
      }),
    ]);
  });
});

after(async () => {
  await testEnv?.cleanup();
});

function firestoreFor(uid, email) {
  return testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();
}

function storageFor(uid, email) {
  return testEnv.authenticatedContext(uid, { email, email_verified: true }).storage();
}

test('approved admin role grants administration without an email allowlist', async () => {
  const adminDb = firestoreFor(adminUid, adminEmail);
  await assertSucceeds(getDoc(doc(adminDb, 'users', invitedUid)));
  await assertSucceeds(setDoc(doc(adminDb, 'templates', 'admin-template'), { name: 'Admin template' }));
});

test('invited member can read own profile and project but not another profile', async () => {
  const memberDb = firestoreFor(invitedUid, invitedEmail);
  await assertSucceeds(getDoc(doc(memberDb, 'users', invitedUid)));
  await assertFails(getDoc(doc(memberDb, 'users', otherUid)));
  await assertSucceeds(getDoc(doc(memberDb, 'projects', 'invited-project')));
});

test('active grant does not allow access to another member project', async () => {
  const otherDb = firestoreFor(otherUid, otherEmail);
  await assertFails(getDoc(doc(otherDb, 'projects', 'invited-project')));
});

test('user cannot self-assign admin role or change protected billing fields', async () => {
  const memberDb = firestoreFor(invitedUid, invitedEmail);
  await assertFails(updateDoc(doc(memberDb, 'users', invitedUid), { role: 'admin' }));
  await assertFails(updateDoc(doc(memberDb, 'users', invitedUid), { coinsBalance: 100000 }));
});

test('client cannot create user profiles, grants, or invitations', async () => {
  const memberDb = firestoreFor(invitedUid, invitedEmail);
  const unknownDb = firestoreFor(unknownUid, 'unknown@example.test');
  await assertFails(setDoc(doc(unknownDb, 'users', unknownUid), { email: 'unknown@example.test', role: 'admin' }));
  await assertFails(setDoc(doc(memberDb, 'accessGrants', unknownUid), { email: 'unknown@example.test', status: 'active' }));
  await assertFails(setDoc(doc(memberDb, 'invitations', 'attacker-invite'), { email: 'victim@example.test', status: 'pending' }));
  await assertFails(setDoc(doc(memberDb, 'invitationEmailLocks', 'attacker-lock'), { invitationId: 'attacker-invite' }));
});

test('non-invited authenticated user has no access to protected Firestore data', async () => {
  const unknownDb = firestoreFor(unknownUid, 'unknown@example.test');
  await assertFails(getDoc(doc(unknownDb, 'projects', 'invited-project')));
  await assertFails(getDoc(doc(unknownDb, 'users', invitedUid)));
  await assertFails(getDocs(collection(unknownDb, 'templates')));
});

test('unauthenticated visitor has no access to protected data', async () => {
  const anonymousDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(anonymousDb, 'projects', 'invited-project')));
  await assertFails(getDocs(collection(anonymousDb, 'templates')));
});

test('chat storage is restricted by grant and project membership', async () => {
  const memberStorage = storageFor(invitedUid, invitedEmail);
  const otherStorage = storageFor(otherUid, otherEmail);
  const invitedFile = ref(memberStorage, `chat/invited-project/${invitedUid}/note.txt`);
  await assertSucceeds(uploadBytes(invitedFile, new Uint8Array([1, 2, 3]), { contentType: 'text/plain' }));
  await assertSucceeds(getBytes(invitedFile));
  await assertFails(getBytes(ref(otherStorage, `chat/invited-project/${invitedUid}/note.txt`)));
  await assertFails(uploadBytes(ref(otherStorage, `chat/invited-project/${otherUid}/foreign.txt`), new Uint8Array([4])));
});
