import { serverTimestamp } from 'firebase/firestore';
import type { AppPlanId, AppUserProfile, BillingMethodInfo } from '@/types/user';
import { ADMIN_EMAIL, DEFAULT_FREE_COINS } from '@/types/user';

export const isAdminEmail = (email?: string | null) =>
  (email ?? '').trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

export const defaultPlanForEmail = (email?: string | null): AppPlanId =>
  isAdminEmail(email) ? 'business' : 'free';

export const defaultCoinsForEmail = (email?: string | null) =>
  isAdminEmail(email) ? Number.MAX_SAFE_INTEGER : DEFAULT_FREE_COINS;

export const defaultRoleForEmail = (email?: string | null): AppUserProfile['role'] =>
  isAdminEmail(email) ? 'admin' : 'user';

export function buildInitialUserDoc(
  email: string,
  displayName?: string | null,
  company?: string | null,
  billingMethod?: BillingMethodInfo | null
): AppUserProfile {
  return {
    email,
    displayName: displayName ?? null,
    company: company ?? null,
    plan: defaultPlanForEmail(email),
    planStatus: 'trialing',
    coinsBalance: defaultCoinsForEmail(email),
    role: defaultRoleForEmail(email),
    subscriptionRenewsAt: null,
    billingMethod: billingMethod ?? null,
    planSince: serverTimestamp() as unknown as AppUserProfile['planSince'],
    createdAt: serverTimestamp() as unknown as AppUserProfile['createdAt'],
    updatedAt: serverTimestamp() as unknown as AppUserProfile['updatedAt'],
  };
}
