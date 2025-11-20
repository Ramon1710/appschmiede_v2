import type { Timestamp } from 'firebase/firestore';

export const ADMIN_EMAIL = 'Ramon.meyer@hotmail.de' as const;

export type AppPlanId = 'free' | 'starter' | 'pro' | 'business';
export type AppUserRole = 'admin' | 'user';

export interface AppUserProfile {
  email: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  phone?: string | null;
  plan: AppPlanId;
  planSince?: Timestamp | null;
  planExpiresAt?: Timestamp | null;
  coinsBalance: number;
  role: AppUserRole;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export const DEFAULT_FREE_PLAN = 'free';
export const DEFAULT_FREE_COINS = 20;
