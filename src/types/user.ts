import type { Timestamp } from 'firebase/firestore';

export const ADMIN_EMAIL = 'Ramon.meyer@hotmail.de' as const;

export type AppPlanId = 'free' | 'starter' | 'pro' | 'business';
export type AppUserRole = 'admin' | 'user';
export type PlanStatus = 'trialing' | 'active' | 'canceled';

export type BillingMethodType = 'credit-card' | 'sepa';

export interface BillingMethodInfo {
  type: BillingMethodType;
  label: string;
  last4?: string | null;
  expiresAt?: string | null;
}

export interface EditorLayoutPreferences {
  leftPanelWidth?: number;
  rightPanelWidth?: number;
  canvasZoom?: number;
}

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
  planStatus?: PlanStatus;
  subscriptionRenewsAt?: Timestamp | null;
  coinsBalance: number;
  role: AppUserRole;
  billingMethod?: BillingMethodInfo | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  editorLayout?: EditorLayoutPreferences | null;
}

export const DEFAULT_FREE_PLAN = 'free';
export const DEFAULT_FREE_COINS = 30;
