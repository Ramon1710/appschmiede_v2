import { db } from '@/lib/firebase';
import { getPlanConfig } from '@/config/billing';
import { isAdminEmail } from '@/lib/user-utils';
import type { AppPlanId, AppUserProfile } from '@/types/user';
import { doc, getDoc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';

const STRIPE_EVENT_COLLECTION = 'stripe_events';

type StripeEventStatus = 'processing' | 'completed' | 'failed';

type UserDocData = AppUserProfile & Record<string, unknown>;

async function loadUserDoc(uid: string): Promise<{ ref: ReturnType<typeof doc>; data: UserDocData } | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
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
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
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
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export async function activatePlan(uid: string, planId: AppPlanId): Promise<void> {
  const { ref } = (await loadUserDoc(uid)) ?? {};
  if (!ref) {
    throw new Error(`User ${uid} nicht gefunden, Plan ${planId} konnte nicht gesetzt werden.`);
  }
  const plan = getPlanConfig(planId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      throw new Error(`User ${uid} nicht gefunden.`);
    }
    const data = snap.data() as UserDocData;
    if (isAdminEmail((data.email as string | null) ?? null)) {
      return; // Admin hat bereits Business-Features.
    }
    const currentCoins = Number(data.coinsBalance ?? 0);
    tx.set(
      ref,
      {
        plan: planId,
        planSince: serverTimestamp(),
        planExpiresAt: null,
        coinsBalance: currentCoins + plan.includedCoinsPerMonth,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export async function claimStripeEvent(eventId: string): Promise<boolean> {
  const ref = doc(db, STRIPE_EVENT_COLLECTION, eventId);
  let alreadyProcessed = true;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) {
      alreadyProcessed = true;
      return;
    }
    alreadyProcessed = false;
    tx.set(ref, {
      status: 'processing' satisfies StripeEventStatus,
      createdAt: serverTimestamp(),
    });
  });
  return !alreadyProcessed;
}

export async function finalizeStripeEvent(
  eventId: string,
  status: StripeEventStatus,
  errorMessage?: string | null
): Promise<void> {
  const ref = doc(db, STRIPE_EVENT_COLLECTION, eventId);
  await setDoc(
    ref,
    {
      status,
      errorMessage: errorMessage ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
