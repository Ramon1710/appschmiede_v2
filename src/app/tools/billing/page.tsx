// src/app/tools/billing/page.tsx  (Coins & One-Site-Checkout)
'use client';
import { useState } from 'react';

const ONE_SITE_PRICE = process.env.NEXT_PUBLIC_STRIPE_PRICE_ONE_SITE!;
const COINS_10_PRICE = process.env.NEXT_PUBLIC_STRIPE_PRICE_COINS_10!;
const COINS_50_PRICE = process.env.NEXT_PUBLIC_STRIPE_PRICE_COINS_50!;

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const checkout = async (priceId: string) => {
    setLoading(priceId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Fehler');
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-semibold">Bezahlung</h1>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-4">
            <div className="text-xl font-semibold mb-1">One-Site App</div>
            <div className="text-sm opacity-80 mb-3">Einfaches Projekt mit 1 Seite.</div>
            <button onClick={() => checkout(ONE_SITE_PRICE)} disabled={loading===ONE_SITE_PRICE} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50">
              {loading===ONE_SITE_PRICE ? 'Weiter…' : '20 € zahlen'}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-4">
            <div className="text-xl font-semibold mb-1">10 Coins</div>
            <div className="text-sm opacity-80 mb-3">Für zusätzliche Seiten/Funktionen.</div>
            <button onClick={() => checkout(COINS_10_PRICE)} disabled={loading===COINS_10_PRICE} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50">
              {loading===COINS_10_PRICE ? 'Weiter…' : 'Kaufen'}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-4">
            <div className="text-xl font-semibold mb-1">50 Coins</div>
            <div className="text-sm opacity-80 mb-3">Paket mit Rabatt.</div>
            <button onClick={() => checkout(COINS_50_PRICE)} disabled={loading===COINS_50_PRICE} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50">
              {loading===COINS_50_PRICE ? 'Weiter…' : 'Kaufen'}
            </button>
          </div>
        </div>

        <div className="text-xs opacity-60">
          ENV: NEXT_PUBLIC_STRIPE_PRICE_ONE_SITE, NEXT_PUBLIC_STRIPE_PRICE_COINS_10, NEXT_PUBLIC_STRIPE_PRICE_COINS_50, NEXT_PUBLIC_APP_URL, STRIPE_SECRET_KEY
        </div>
      </div>
    </main>
  );
}
