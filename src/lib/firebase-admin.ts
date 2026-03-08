import 'server-only';

import { getApps, initializeApp, cert, getApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function requiredEnv(name: string, fallback?: string): string {
  const value = (process.env[name] ?? fallback ?? '').trim();
  if (!value) {
    throw new Error(`${name} missing`);
  }
  return value;
}

function getFirebaseAdminApp(): App {
  if (getApps().length) {
    return getApp();
  }

  const projectId = requiredEnv('FIREBASE_ADMIN_PROJECT_ID', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const clientEmail = requiredEnv('FIREBASE_ADMIN_CLIENT_EMAIL');
  const privateKey = requiredEnv('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}