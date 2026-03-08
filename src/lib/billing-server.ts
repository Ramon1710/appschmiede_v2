import 'server-only';

import { getPlanConfig } from '@/config/billing';
import { COIN_COSTS, type CoinActionKey } from '@/config/coins';
import { getFirebaseAdminDb } from '@/lib/firebase-admin';
import { isAdminEmail } from '@/lib/user-utils';
import type { AppPlanId, AppUserProfile, PlanStatus } from '@/types/user';
import { FieldValue } from 'firebase-admin/firestore';

const STRIPE_EVENT_COLLECTION = 'stripe_events';

function adminDb() {
  return getFirebaseAdminDb();
}

type StripeEventStatus = 'processing' | 'completed' | 'failed';
export type BillingErrorCode = 'insufficient_coins' | 'project_limit' | 'subscription_missing';

type UserDocData = AppUserProfile & Record<string, unknown>;

export class BillingError extends Error {
  code: BillingErrorCode;

  constructor(code: BillingErrorCode, message: string) {
    super(message);
    this.name = 'BillingError';
    this.code = code;
  }
}

export function isBillingError(error: unknown): error is BillingError {
  return error instanceof BillingError;
}

function normalizePlanId(plan: unknown): AppPlanId {
  return plan === 'starter' || plan === 'pro' || plan === 'business' ? plan : 'free';
}

function buildInsufficientCoinsMessage(actionLabel: string, requiredCoins: number, currentCoins: number): string {
  return `${actionLabel} benötigt ${requiredCoins} Coin${requiredCoins === 1 ? '' : 's'}. Verfügbar: ${currentCoins}. Lade dein Guthaben unter /tools/billing auf.`;
}

function buildProjectLimitMessage(maxProjects: number): string {
  if (maxProjects <= 1) {
    return 'Dein aktueller Plan erlaubt nur 1 Projekt. Upgrade unter /pricing, um weitere Projekte anzulegen.';
  }
  return `Dein aktueller Plan erlaubt maximal ${maxProjects} Projekte. Upgrade unter /pricing, um weitere Projekte anzulegen.`;
}

async function loadUserDoc(uid: string): Promise<{ ref: FirebaseFirestore.DocumentReference; data: UserDocData } | null> {
  const ref = adminDb().collection('users').doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    return null;
  }
  return { ref, data: snap.data() as UserDocData };
}

export async function creditCoins(uid: string, coins: number): Promise<void> {
  if (!coins || coins <= 0) return;
  const { ref } = (await loadUserDoc(uid)) ?? {};
  if (!ref) {
    throw new Error(`User ${uid} nicht gefunden, Coins konnten nicht gutgeschrieben werden.`);
  }
  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new Error(`User ${uid} nicht gefunden.`);
    }
    const data = snap.data() as UserDocData;
    if (isAdminEmail((data.email as string | null) ?? null)) {
      return; // Admin braucht keine Coins.
    }
    const current = Number(data.coinsBalance ?? 0);
    tx.set(
      ref,
      {
        coinsBalance: current + coins,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export async function activatePlan(
  uid: string,
  planId: AppPlanId,
  options?: {
    customerId?: string | null;
    subscriptionId?: string | null;
    subscriptionRenewsAt?: Date | null;
    planStatus?: PlanStatus;
    cancelAtPeriodEnd?: boolean;
  }
): Promise<void> {
  const { ref } = (await loadUserDoc(uid)) ?? {};
  if (!ref) {
    throw new Error(`User ${uid} nicht gefunden, Plan ${planId} konnte nicht gesetzt werden.`);
  }
  const plan = getPlanConfig(planId);
  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new Error(`User ${uid} nicht gefunden.`);
    }
    const data = snap.data() as UserDocData;
    if (isAdminEmail((data.email as string | null) ?? null)) {
      return; // Admin hat bereits Business-Features.
    }
    const currentCoins = Number(data.coinsBalance ?? 0);
    const nextPlanStatus = options?.planStatus ?? 'active';
    tx.set(
      ref,
      {
        plan: planId,
        planSince: FieldValue.serverTimestamp(),
        planExpiresAt: null,
        planStatus: nextPlanStatus,
        coinsBalance: currentCoins + plan.includedCoinsPerMonth,
        stripeCustomerId: options?.customerId ?? null,
        stripeSubscriptionId: options?.subscriptionId ?? null,
        subscriptionRenewsAt: options?.subscriptionRenewsAt ?? null,
        subscriptionCancelAtPeriodEnd: options?.cancelAtPeriodEnd ?? false,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export async function syncPlanBillingState(
  uid: string,
  options: {
    planId?: AppPlanId;
    planStatus?: PlanStatus;
    customerId?: string | null;
    subscriptionId?: string | null;
    subscriptionRenewsAt?: Date | null;
    cancelAtPeriodEnd?: boolean;
  }
): Promise<void> {
  const { ref } = (await loadUserDoc(uid)) ?? {};
  if (!ref) {
    throw new Error(`User ${uid} nicht gefunden, Billing-Status konnte nicht synchronisiert werden.`);
  }

  await ref.set(
    {
      ...(options.planId ? { plan: options.planId } : {}),
      ...(options.planStatus ? { planStatus: options.planStatus } : {}),
      stripeCustomerId: options.customerId ?? null,
      stripeSubscriptionId: options.subscriptionId ?? null,
      subscriptionRenewsAt: options.subscriptionRenewsAt ?? null,
      subscriptionCancelAtPeriodEnd: options.cancelAtPeriodEnd ?? false,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function downgradeToFreePlan(uid: string): Promise<void> {
  const { ref } = (await loadUserDoc(uid)) ?? {};
  if (!ref) {
    throw new Error(`User ${uid} nicht gefunden, Free-Plan konnte nicht gesetzt werden.`);
  }

  await ref.set(
    {
      plan: 'free' satisfies AppPlanId,
      planStatus: 'canceled' satisfies PlanStatus,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionRenewsAt: null,
      subscriptionCancelAtPeriodEnd: false,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function assertCanCreateProject(uid: string): Promise<void> {
  const userDoc = await loadUserDoc(uid);
  if (!userDoc) {
    throw new Error(`User ${uid} nicht gefunden.`);
  }

  const email = (userDoc.data.email as string | null) ?? null;
  if (isAdminEmail(email)) {
    return;
  }

  const planId = normalizePlanId(userDoc.data.plan);
  const maxProjects = getPlanConfig(planId).maxProjects;
  if (!Number.isFinite(maxProjects) || maxProjects >= 9999) {
    return;
  }

  const projectsSnap = await adminDb().collection('projects').where('ownerId', '==', uid).get();
  if (projectsSnap.size >= maxProjects) {
    throw new BillingError('project_limit', buildProjectLimitMessage(maxProjects));
  }
}

export async function chargeCoins(uid: string, coins: number, actionLabel: string): Promise<void> {
  if (!coins || coins <= 0) return;
  const { ref } = (await loadUserDoc(uid)) ?? {};
  if (!ref) {
    throw new Error(`User ${uid} nicht gefunden, Coins konnten nicht belastet werden.`);
  }

  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new Error(`User ${uid} nicht gefunden.`);
    }

    const data = snap.data() as UserDocData;
    if (isAdminEmail((data.email as string | null) ?? null)) {
      return;
    }

    const current = Number(data.coinsBalance ?? 0);
    if (current < coins) {
      throw new BillingError('insufficient_coins', buildInsufficientCoinsMessage(actionLabel, coins, current));
    }

    tx.set(
      ref,
      {
        coinsBalance: current - coins,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export async function chargeCoinsForAction(uid: string, action: CoinActionKey, multiplier = 1): Promise<void> {
  const perAction = COIN_COSTS[action];
  if (perAction == null || perAction <= 0) return;

  const total = perAction * Math.max(1, multiplier);
  const label =
    action === 'ai'
      ? 'Diese KI-Aktion'
      : action === 'quickButton'
        ? 'Dieser fertige Button'
        : action === 'component'
          ? 'Dieser Baustein'
          : action === 'basicComponent'
            ? 'Dieser Basis-Baustein'
      : action === 'template'
        ? 'Diese Vorlage'
        : action === 'page'
          ? 'Diese neue Seite'
          : 'Diese Aktion';
  await chargeCoins(uid, total, label);
}

export async function getStripeSubscriptionId(uid: string): Promise<string> {
  const userDoc = await loadUserDoc(uid);
  if (!userDoc) {
    throw new Error(`User ${uid} nicht gefunden.`);
  }

  const subscriptionId = typeof userDoc.data.stripeSubscriptionId === 'string' ? userDoc.data.stripeSubscriptionId : '';
  if (!subscriptionId) {
    throw new BillingError('subscription_missing', 'Für diesen Account wurde kein aktives Stripe-Abo gefunden.');
  }
  return subscriptionId;
}

export async function claimStripeEvent(eventId: string): Promise<boolean> {
  const ref = adminDb().collection(STRIPE_EVENT_COLLECTION).doc(eventId);
  let alreadyProcessed = true;
  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      alreadyProcessed = true;
      return;
    }
    alreadyProcessed = false;
    tx.set(ref, {
      status: 'processing' satisfies StripeEventStatus,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
  return !alreadyProcessed;
}

export async function finalizeStripeEvent(
  eventId: string,
  status: StripeEventStatus,
  errorMessage?: string | null
): Promise<void> {
  const ref = adminDb().collection(STRIPE_EVENT_COLLECTION).doc(eventId);
  await ref.set(
    {
      status,
      errorMessage: errorMessage ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
