// path: src/lib/firebase.ts
// Einheitliche Firebase-Initialisierung (Client & Server kompatibel)

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const _app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Exporte bereitstellen (wichtig für db-projects.ts)
export const app: FirebaseApp = _app;
export const auth: Auth = getAuth(_app);
export const db: Firestore = getFirestore(_app);
export const storage: FirebaseStorage = getStorage(_app);
