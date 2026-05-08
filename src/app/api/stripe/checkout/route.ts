import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { COIN_PACKAGES, PLAN_CONFIG, TEMP_FREE_ACCESS_ENABLED, type CoinPackageKey } from '@/config/billing';
import type { AppPlanId, AppUserProfile } from '@/types/user';
import { getFirebaseAdminDb } from '@/lib/firebase-admin';
import { isAdminEmail } from '@/lib/user-utils';
import { requireAuthenticatedUid } from '@/lib/server-auth';
import { isRequestAuthError } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CheckoutKind = 'plan' | 'coins';

type CheckoutPayload = {
  kind: CheckoutKind;
  planId?: AppPlanId;
  coinPackage?: CoinPackageKey;
  successUrl?: string;
  cancelUrl?: string;
};

type CheckoutMetadata = Record<string, string>;

type CheckoutSessionParams = {
  mode: 'subscription' | 'payment';
  success_url: string;
  cancel_url: string;
  customer_email?: string;
  metadata?: CheckoutMetadata;
  payment_method_types?: string[];
  line_items: Array<{
    price: string;
    quantity: number;
  }>;
  subscription_data?: {
    metadata?: CheckoutMetadata;
  };
};

type StripeCheckoutClient = {
  checkout: {
    sessions: {
      create(params: CheckoutSessionParams): Promise<{
        url: string | null;
      }>;
    };
  };
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function POST(request: Request) {
  try {
    if (TEMP_FREE_ACCESS_ENABLED) {
      return NextResponse.json({ error: 'Checkout ist bis Anfang 2027 deaktiviert.' }, { status: 403 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY missing' }, { status: 500 });
    }

    const uid = await requireAuthenticatedUid(request);
    const body = (await request.json()) as CheckoutPayload;
    if (!body.kind) {
      return NextResponse.json({ error: 'kind required' }, { status: 400 });
    }

    const snap = await getFirebaseAdminDb().collection('users').doc(uid).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 });
    }
    const userData = snap.data() as AppUserProfile;
    if (isAdminEmail(userData.email ?? null)) {
      return NextResponse.json({ error: 'Admins benötigen keinen Checkout.' }, { status: 403 });
    }

    const successUrl = body.successUrl ?? `${appUrl}/tools/billing?status=success`;
    const cancelUrl = body.cancelUrl ?? `${appUrl}/tools/billing?status=cancel`;
    const stripeClient = getStripe() as StripeCheckoutClient;

    const metadata: CheckoutMetadata = {
      uid,
      kind: body.kind,
    };

    let params: CheckoutSessionParams | null = null;

    if (body.kind === 'plan') {
      if (!body.planId) {
        return NextResponse.json({ error: 'planId required' }, { status: 400 });
      }
      const planConfig = PLAN_CONFIG[body.planId];
      if (!planConfig?.stripePriceId) {
        return NextResponse.json({ error: 'plan not configured for Stripe' }, { status: 400 });
      }
      metadata.planId = body.planId;
      params = {
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: userData.email ?? undefined,
        metadata,
        line_items: [
          {
            price: planConfig.stripePriceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            uid,
            planId: body.planId,
          },
        },
      } satisfies CheckoutSessionParams;
    } else {
      if (!body.coinPackage) {
        return NextResponse.json({ error: 'coinPackage required' }, { status: 400 });
      }
      const pkg = COIN_PACKAGES[body.coinPackage];
      if (!pkg?.stripePriceId) {
        return NextResponse.json({ error: 'coin package not configured for Stripe' }, { status: 400 });
      }
      metadata.coinPackage = body.coinPackage;
      params = {
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: userData.email ?? undefined,
        metadata,
        payment_method_types: ['card', 'paypal'],
        line_items: [
          {
            price: pkg.stripePriceId,
            quantity: 1,
          },
        ],
      } satisfies CheckoutSessionParams;
    }

    const session = await stripeClient.checkout.sessions.create(params);
    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error: any) {
    if (isRequestAuthError(error)) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 });
    }
    console.error('Stripe Checkout Fehler', error);
    return NextResponse.json({ error: error?.message ?? 'server error' }, { status: 500 });
  }
}
