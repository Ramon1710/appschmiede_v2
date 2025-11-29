import { auth, db } from '@/lib/firebase';
import { buildInitialUserDoc } from '@/lib/user-utils';
import type { BillingMethodInfo } from '@/types/user';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export async function registerWithEmail(
  email: string,
  password: string,
  displayName?: string,
  company?: string,
  billingMethod?: BillingMethodInfo | null
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(cred.user, { displayName });
  await setDoc(
    doc(db, 'users', cred.user.uid),
    buildInitialUserDoc(email, displayName ?? null, company ?? null, billingMethod ?? null)
  );
  return cred.user;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function sendResetEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}
