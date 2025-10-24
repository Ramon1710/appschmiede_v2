// src/app/api/stripe/checkout/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { priceId, success_url, cancel_url } = await request.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY missing' }, { status: 500 });
    }
    if (!priceId) {
      return NextResponse.json({ error: 'priceId missing' }, { status: 400 });
    }

    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('line_items[0][price]', priceId);
    params.set('line_items[0][quantity]', '1');
    params.set(
      'success_url',
      success_url || `${process.env.NEXT_PUBLIC_APP_URL}/tools/billing?status=success`
    );
    params.set(
      'cancel_url',
      cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/tools/billing?status=cancel`
    );

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'stripe error' }, { status: 500 });
    }

    return NextResponse.json({ url: data.url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'server error' }, { status: 500 });
  }
}
