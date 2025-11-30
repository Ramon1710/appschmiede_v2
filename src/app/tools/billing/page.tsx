// src/app/tools/billing/page.tsx  (Coins & One-Site-Checkout)

'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import GuidedTour from '@/components/GuidedTour';
import useAuth from '@/hooks/useAuth';
import type { CoinPackageKey } from '@/config/billing';

const COIN_BUNDLES: Array<{
  key: CoinPackageKey;
  label: string;
  badge: string;
  coins: number;
  priceLabel: string;
  description: string;
}> = [
  {
    key: 'coins_50',
    label: 'Starter-Paket',
    badge: 'Einsteiger',
    coins: 50,
    priceLabel: '6,99 €',
    description: 'Perfekt, um neue Bausteine auszuprobieren oder erste KI-Läufe zu starten.',
  },
  {
    key: 'coins_80',
    label: 'Spar-Paket',
    badge: 'Beliebt',
    coins: 80,
    priceLabel: '8,99 €',
    description: 'Für kleinere Projekte, die regelmäßig neue Seiten oder Vorlagen brauchen.',
  },
  {
    key: 'coins_100',
    label: 'Creator-Paket',
    badge: 'Teams',
    coins: 100,
    priceLabel: '9,49 €',
    description: 'Ideal, wenn du häufig Bausteine einfügst und Templates testest.',
  },
  {
    key: 'coins_150',
    label: 'Studio-Paket',
    badge: 'Agenturen',
    coins: 150,
    priceLabel: '13,99 €',
    description: 'Mehr Volumen für größere App-Strukturen oder intensive KI-Nutzung.',
  },
  {
    key: 'coins_300',
    label: 'Scale-Paket',
    badge: 'Projekte',
    coins: 300,
    priceLabel: '26,99 €',
    description: 'Für Teams, die dauerhaft mit Vorlagen, Export und KI arbeiten.',
  },
];

export default function BillingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const checkout = async (packageKey: CoinPackageKey) => {
    if (!user?.uid) {
      alert('Bitte melde dich an, um Coins zu kaufen.');
      return;
    }
    setLoading(packageKey);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, kind: 'coins', coinPackage: packageKey }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data?.error ?? 'Checkout konnte nicht gestartet werden.');
      }
    } catch (error) {
      console.error('Checkout fehlgeschlagen', error);
      alert('Checkout konnte nicht gestartet werden.');
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
      description: 'Wähle das passende Coin-Paket. Jeder Button öffnet direkt den Stripe-Checkout.',
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
            <h1 className="text-3xl font-semibold">Alle Bausteine laufen über Coins</h1>
            <p className="text-base text-neutral-300">
              Coins brauchst du jetzt für Bausteine, Vorlagen, KI-Funktionen und neue Seiten. Lade das passende Paket auf und zahle sicher via Stripe – per Kreditkarte oder
              PayPal. Nach erfolgreicher Zahlung aktualisiert sich dein Guthaben automatisch in der Kopfzeile.
            </p>
          </header>

          <section className="grid gap-4 md:grid-cols-3" data-tour-id="billing-packs">
            {COIN_BUNDLES.map((bundle) => (
              <div key={bundle.key} className="rounded-2xl border border-white/10 bg-neutral-900/80 p-5 shadow-lg">
                <div className="text-xs uppercase tracking-[0.35em] text-emerald-300">{bundle.badge}</div>
                <div className="mt-2 text-xl font-semibold">{bundle.label}</div>
                <p className="text-sm text-neutral-400">{bundle.coins} Coins · {bundle.priceLabel}</p>
                <p className="mt-2 text-sm text-neutral-400">{bundle.description}</p>
                <button
                  onClick={() => checkout(bundle.key)}
                  disabled={loading === bundle.key}
                  className="mt-4 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 font-semibold hover:bg-white/15 disabled:opacity-50"
                >
                  {loading === bundle.key ? 'Weiter…' : 'Kaufen'}
                </button>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5 text-sm text-neutral-300" data-tour-id="billing-steps">
            <h2 className="text-lg font-semibold text-white">So funktioniert die Aufladung</h2>
            <ol className="mt-3 space-y-2 text-neutral-300">
              <li>1. Paket auswählen und auf den Button klicken.</li>
              <li>2. Stripe Checkout mit Karte oder PayPal abschließen.</li>
              <li>3. Sobald Stripe den Erfolg meldet, schreibt der Webhook deine Coins gut.</li>
              <li>4. Das aktuelle Guthaben siehst du direkt oben rechts neben deinem Profil.</li>
            </ol>
          </section>

          <div className="text-xs text-neutral-500">
            ENV: NEXT_PUBLIC_STRIPE_PRICE_COINS_50, NEXT_PUBLIC_STRIPE_PRICE_COINS_80, NEXT_PUBLIC_STRIPE_PRICE_COINS_100, NEXT_PUBLIC_STRIPE_PRICE_COINS_150,
            NEXT_PUBLIC_STRIPE_PRICE_COINS_300, NEXT_PUBLIC_APP_URL, STRIPE_SECRET_KEY
          </div>
        </div>
      </main>
      <GuidedTour storageKey="tour-billing" steps={billingTourSteps} restartLabel="Coins Tutorial" />
    </>
  );
}
