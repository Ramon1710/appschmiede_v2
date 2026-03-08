import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import type { CoinPackageKey } from '@/config/billing';
import { COIN_PACKAGES, getPlanConfig } from '@/config/billing';
import type { AppPlanId, PlanStatus } from '@/types/user';
import { activatePlan, claimStripeEvent, creditCoins, downgradeToFreePlan, finalizeStripeEvent, syncPlanBillingState } from '@/lib/billing-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type StripeMetadata = Record<string, string | null | undefined>;
type StripeCheckoutSession = {
  metadata?: StripeMetadata;
  customer?: string | { id: string } | null;
  subscription?: string | { id: string } | null;
};
type StripeInvoicePayload = {
  subscription?: string | { id: string } | null;
};
type StripeSubscriptionPayload = {
  id: string;
  status?: string | null;
  metadata?: StripeMetadata;
  customer?: string | { id: string } | null;
  current_period_end?: number | null;
  cancel_at_period_end?: boolean;
};

function normalizePlanStatus(status?: string | null): PlanStatus {
  if (status === 'active') return 'active';
  if (status === 'trialing') return 'trialing';
  return 'canceled';
}

function toDateOrNull(unixSeconds?: number | null): Date | null {
  if (!unixSeconds || !Number.isFinite(unixSeconds)) return null;
  return new Date(unixSeconds * 1000);
}

function readStripeId(value?: string | { id: string } | null): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

async function handleCheckoutSession(session: StripeCheckoutSession) {
  const metadata = session.metadata ?? {};
  const uid = metadata.uid;
  const kind = metadata.kind;
  if (!uid || !kind) return;

  if (kind === 'coins') {
    const pkgKey = metadata.coinPackage as CoinPackageKey | undefined;
    if (!pkgKey) return;
    const pkg = COIN_PACKAGES[pkgKey];
    if (!pkg) return;
    await creditCoins(uid, pkg.coins);
    return;
  }

  if (kind === 'plan') {
    const planId = metadata.planId as AppPlanId | undefined;
    if (!planId) return;
    const stripe = getStripe() as any;
    const subscriptionId = readStripeId(session.subscription);
    const customerId = readStripeId(session.customer);
    let subscription: StripeSubscriptionPayload | null = null;

    if (subscriptionId) {
      subscription = await stripe.subscriptions.retrieve(subscriptionId);
    }

    await activatePlan(uid, planId, {
      customerId,
      subscriptionId,
      subscriptionRenewsAt: toDateOrNull(subscription?.current_period_end),
      planStatus: normalizePlanStatus(subscription?.status),
      cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    });
  }
}

async function handleInvoicePaymentSucceeded(invoice: StripeInvoicePayload) {
  if (!invoice.subscription) return;
  const subscriptionId =
    typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
  if (!subscriptionId) return;

  const stripe = getStripe() as any;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const uid = subscription.metadata?.uid;
  const planId = subscription.metadata?.planId as AppPlanId | undefined;
  if (!uid || !planId) return;

  const plan = getPlanConfig(planId);
  await creditCoins(uid, plan.includedCoinsPerMonth);
  await syncPlanBillingState(uid, {
    planId,
    planStatus: normalizePlanStatus(subscription.status),
    customerId: readStripeId(subscription.customer),
    subscriptionId,
    subscriptionRenewsAt: toDateOrNull(subscription.current_period_end),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  });
}

async function handleSubscriptionUpdated(subscription: StripeSubscriptionPayload) {
  const uid = subscription.metadata?.uid;
  const planId = subscription.metadata?.planId as AppPlanId | undefined;
  if (!uid || !planId) return;

  await syncPlanBillingState(uid, {
    planId,
    planStatus: normalizePlanStatus(subscription.status),
    customerId: readStripeId(subscription.customer),
    subscriptionId: subscription.id,
    subscriptionRenewsAt: toDateOrNull(subscription.current_period_end),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  });
}

async function handleSubscriptionDeleted(subscription: StripeSubscriptionPayload) {
  const uid = subscription.metadata?.uid;
  if (!uid) return;
  await downgradeToFreePlan(uid);
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: 'webhook secret missing' }, { status: 500 });
    }

    const rawBody = await request.text();
    const stripe = getStripe() as any;
    let event: any;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
      console.error('Stripe signature validation failed', error);
      return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
    }

    const shouldProcess = await claimStripeEvent(event.id);
    if (!shouldProcess) {
      return NextResponse.json({ skipped: true }, { status: 200 });
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSession(event.data.object as StripeCheckoutSession);
          break;
        case 'invoice.payment_succeeded':
          await handleInvoicePaymentSucceeded(event.data.object as StripeInvoicePayload);
          break;
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as StripeSubscriptionPayload);
          break;
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as StripeSubscriptionPayload);
          break;
        default:
          break;
      }
      await finalizeStripeEvent(event.id, 'completed');
      return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
      await finalizeStripeEvent(event.id, 'failed', error instanceof Error ? error.message : String(error));
      console.error('Stripe webhook processing failed', error);
      return NextResponse.json({ error: 'webhook processing failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Stripe webhook error', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
