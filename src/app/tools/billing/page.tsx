// src/app/tools/billing/page.tsx  (Coins & One-Site-Checkout)

'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import GuidedTour from '@/components/GuidedTour';

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

  const billingTourSteps = [
    {
      id: 'billing-intro',
      title: 'Coins & Einmalprodukte',
      description: 'Hier siehst du, wofür Coins benötigt werden und wie du sie in wenigen Sekunden auflädst.',
    },
    {
      id: 'billing-packs',
      title: 'Pakete auswählen',
      description: 'Wähle zwischen Coins oder der One-Site-App. Jeder Button öffnet direkt den Stripe-Checkout.',
    },
    {
      id: 'billing-steps',
      title: 'So läuft die Aufladung ab',
      description: 'Kurze Anleitung, wie Checkout, Webhook und Guthabenanzeige zusammenspielen.',
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen w-full bg-neutral-950 px-4 py-10 text-neutral-100 lg:px-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <header className="space-y-3" data-tour-id="billing-intro">
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Coins & Billing</p>
            <h1 className="text-3xl font-semibold">Coins aufladen oder Einmal-Projekte kaufen</h1>
            <p className="text-base text-neutral-300">
              Coins benötigst du für KI-gestützte Funktionen wie Seiten-Generierung oder Bild-Erstellung. Wähle ein Paket und zahle sicher via Stripe. Nach
              erfolgreicher Zahlung aktualisiert sich dein Guthaben automatisch in der Kopfzeile.
            </p>
          </header>

          <section className="grid gap-4 md:grid-cols-3" data-tour-id="billing-packs">
            <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-5 shadow-lg">
              <div className="text-xs uppercase tracking-[0.35em] text-violet-300">Schnellstart</div>
              <div className="mt-2 text-xl font-semibold">One-Site App</div>
              <p className="mt-1 text-sm text-neutral-400">Einmalige App mit einer Seite – ideal für schnelle Demos.</p>
              <button
                onClick={() => checkout(ONE_SITE_PRICE)}
                disabled={loading === ONE_SITE_PRICE}
                className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-2 font-semibold hover:bg-violet-500 disabled:opacity-50"
              >
                {loading === ONE_SITE_PRICE ? 'Weiter…' : '20 € zahlen'}
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-5 shadow-lg">
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Flexibel</div>
              <div className="mt-2 text-xl font-semibold">10 Coins</div>
              <p className="mt-1 text-sm text-neutral-400">Perfekt, um einzelne Seiten oder Bilder nachzukaufen.</p>
              <button
                onClick={() => checkout(COINS_10_PRICE)}
                disabled={loading === COINS_10_PRICE}
                className="mt-4 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 font-semibold hover:bg-white/15 disabled:opacity-50"
              >
                {loading === COINS_10_PRICE ? 'Weiter…' : 'Kaufen'}
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-5 shadow-lg">
              <div className="text-xs uppercase tracking-[0.35em] text-amber-300">Beliebt</div>
              <div className="mt-2 text-xl font-semibold">50 Coins</div>
              <p className="mt-1 text-sm text-neutral-400">Mehr Features zum rabattierten Paketpreis.</p>
              <button
                onClick={() => checkout(COINS_50_PRICE)}
                disabled={loading === COINS_50_PRICE}
                className="mt-4 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 font-semibold hover:bg-white/15 disabled:opacity-50"
              >
                {loading === COINS_50_PRICE ? 'Weiter…' : 'Kaufen'}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5 text-sm text-neutral-300" data-tour-id="billing-steps">
            <h2 className="text-lg font-semibold text-white">So funktioniert die Aufladung</h2>
            <ol className="mt-3 space-y-2 text-neutral-300">
              <li>1. Paket auswählen und auf den Button klicken.</li>
              <li>2. Stripe Checkout mit Test- oder Livekarte abschließen.</li>
              <li>3. Sobald Stripe den Erfolg meldet, schreibt der Webhook deine Coins gut.</li>
              <li>4. Das aktuelle Guthaben siehst du direkt oben rechts neben deinem Profil.</li>
            </ol>
          </section>

          <div className="text-xs text-neutral-500">
            ENV: NEXT_PUBLIC_STRIPE_PRICE_ONE_SITE, NEXT_PUBLIC_STRIPE_PRICE_COINS_10, NEXT_PUBLIC_STRIPE_PRICE_COINS_50, NEXT_PUBLIC_APP_URL, STRIPE_SECRET_KEY
          </div>
        </div>
      </main>
      <GuidedTour storageKey="tour-billing" steps={billingTourSteps} restartLabel="Coins Tutorial" />
    </>
  );
}
