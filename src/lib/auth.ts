import { auth, db } from '@/lib/firebase';
import { buildInitialUserDoc } from '@/lib/user-utils';
import type { BillingMethodInfo } from '@/types/user';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

async function writeInitialUserProfile(user: User, profile: ReturnType<typeof buildInitialUserDoc>) {
  await setDoc(doc(db, 'users', user.uid), profile);
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName?: string,
  company?: string,
  billingMethod?: BillingMethodInfo | null
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await cred.user.getIdToken(true);

    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }

    const initialProfile = buildInitialUserDoc(
      cred.user.email ?? email,
      displayName ?? null,
      company ?? null,
      billingMethod ?? null
    );

    try {
      await writeInitialUserProfile(cred.user, initialProfile);
    } catch (error) {
      const code = typeof (error as { code?: unknown })?.code === 'string' ? (error as { code: string }).code : null;
      if (code === 'permission-denied') {
        await cred.user.getIdToken(true);
        await writeInitialUserProfile(cred.user, initialProfile);
      } else {
        throw error;
      }
    }

    return cred.user;
  } catch (error) {
    try {
      await deleteUser(cred.user);
    } catch (cleanupError) {
      console.warn('Konnte fehlgeschlagenen Registrierungs-Account nicht bereinigen', cleanupError);
    }
    throw error;
  }
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
