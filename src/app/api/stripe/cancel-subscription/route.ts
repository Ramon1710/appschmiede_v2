import { NextResponse } from 'next/server';
import { getFirebaseAdminDb } from '@/lib/firebase-admin';
import { getStripe } from '@/lib/stripe';
import type { AppPlanId, AppUserProfile } from '@/types/user';
import { getStripeSubscriptionId, isBillingError, syncPlanBillingState } from '@/lib/billing-server';
import { isRequestAuthError, requireAuthenticatedUid } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const uid = await requireAuthenticatedUid(request);

    const userSnap = await getFirebaseAdminDb().collection('users').doc(uid).get();
    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 });
    }

    const userData = userSnap.data() as AppUserProfile;
    const subscriptionId = await getStripeSubscriptionId(uid);
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    await syncPlanBillingState(uid, {
      planId: (userData.plan ?? 'free') as AppPlanId,
      planStatus: 'canceled',
      customerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? null,
      subscriptionId: subscription.id,
      subscriptionRenewsAt: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    });

    return NextResponse.json(
      {
        ok: true,
        subscriptionRenewsAt: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Stripe subscription cancel failed', error);
    if (isRequestAuthError(error)) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 });
    }
    if (isBillingError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'server error' }, { status: 500 });
  }
}