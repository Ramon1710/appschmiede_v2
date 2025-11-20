import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import type { CoinPackageKey } from '@/config/billing';
import { COIN_PACKAGES, getPlanConfig } from '@/config/billing';
import type { AppPlanId } from '@/types/user';
import { activatePlan, claimStripeEvent, creditCoins, finalizeStripeEvent } from '@/lib/billing-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type StripeMetadata = Record<string, string | null | undefined>;
type StripeCheckoutSession = { metadata?: StripeMetadata };
type StripeInvoicePayload = {
  subscription?: string | { id: string } | null;
};

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
    await activatePlan(uid, planId);
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
