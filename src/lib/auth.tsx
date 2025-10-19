'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged, signOut, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

type Role = 'user' | 'master' | 'admin';

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: Role;
};

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<Pick<AppUser, 'displayName'>>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      const ref = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          email: fbUser.email ?? null,
          displayName: fbUser.displayName ?? null,
          role: 'user',
          createdAt: serverTimestamp(),
        }, { merge: true });
      }
      const role = (snap.data()?.role as Role) ?? 'user';
      setUser({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
        role,
      });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    loading,
    logout: async () => {
      await signOut(auth);
      router.push('/login');
    },
    updateUserProfile: async (data) => {
      if (!auth.currentUser) return;
      if (data.displayName) {
        await updateProfile(auth.currentUser, { displayName: data.displayName });
      }
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName: data.displayName ?? user?.displayName ?? null,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    },
    resetPassword: (email) => sendPasswordResetEmail(auth, email),
  }), [user, loading, router]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
