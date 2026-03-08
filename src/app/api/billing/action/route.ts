import { NextResponse } from 'next/server';
import type { CoinActionKey } from '@/config/coins';
import { assertCanCreateProject, chargeCoinsForAction, isBillingError } from '@/lib/billing-server';
import { isRequestAuthError, requireAuthenticatedUid } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BillingActionRequest =
  | {
      kind: 'assert-project-create';
    }
  | {
      kind: 'charge';
      action: CoinActionKey;
      multiplier?: number;
    };

function billingErrorStatus(code: string): number {
  switch (code) {
    case 'insufficient_coins':
      return 402;
    case 'project_limit':
      return 409;
    case 'subscription_missing':
      return 404;
    default:
      return 400;
  }
}

export async function POST(request: Request) {
  try {
    const uid = await requireAuthenticatedUid(request);
    const body = (await request.json()) as BillingActionRequest;

    if (body.kind === 'assert-project-create') {
      await assertCanCreateProject(uid);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (body.kind === 'charge') {
      const multiplier = Math.max(1, Number(body.multiplier ?? 1) || 1);
      await chargeCoinsForAction(uid, body.action, multiplier);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'invalid billing action' }, { status: 400 });
  } catch (error) {
    if (isRequestAuthError(error)) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 });
    }
    if (isBillingError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: billingErrorStatus(error.code) });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'server error' }, { status: 500 });
  }
}