'use client';

import type { User } from 'firebase/auth';
import type { CoinActionKey } from '@/config/coins';
import { buildAuthHeaders } from '@/lib/client-auth';

type BillingActionBody =
  | {
      kind: 'assert-project-create';
    }
  | {
      kind: 'charge';
      action: CoinActionKey;
      multiplier?: number;
    };

async function postBillingAction(user: User | null, body: BillingActionBody): Promise<void> {
  const response = await fetch('/api/billing/action', {
    method: 'POST',
    headers: await buildAuthHeaders(user, { 'content-type': 'application/json' }),
    body: JSON.stringify(body),
  });

  if (response.ok) {
    return;
  }

  const payload = await response.json().catch(() => null);
  throw new Error(payload?.error || 'Billing-Aktion konnte nicht ausgeführt werden.');
}

export async function assertCanCreateProjectClient(user: User | null): Promise<void> {
  await postBillingAction(user, { kind: 'assert-project-create' });
}

export async function chargeCoinsForClientAction(user: User | null, action: CoinActionKey, multiplier = 1): Promise<void> {
  await postBillingAction(user, { kind: 'charge', action, multiplier });
}