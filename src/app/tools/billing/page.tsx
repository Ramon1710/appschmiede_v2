// src/app/tools/billing/page.tsx  (Coins & One-Site-Checkout)

'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import GuidedTour from '@/components/GuidedTour';
import useAuth from '@/hooks/useAuth';
import type { CoinPackageKey } from '@/config/billing';
import { useI18n } from '@/lib/i18n';

const COIN_BUNDLES: Array<{
  key: CoinPackageKey;
  label: { de: string; en: string };
  badge: { de: string; en: string };
  coins: number;
  priceLabel: string;
  description: { de: string; en: string };
}> = [
  {
    key: 'coins_50',
    label: { de: 'Starter-Paket', en: 'Starter pack' },
    badge: { de: 'Einsteiger', en: 'Beginner' },
    coins: 50,
    priceLabel: '6,99 €',
    description: {
      de: 'Perfekt, um neue Bausteine auszuprobieren oder erste KI-Läufe zu starten.',
      en: 'Perfect for trying new building blocks or running your first AI actions.',
    },
  },
  {
    key: 'coins_80',
    label: { de: 'Spar-Paket', en: 'Value pack' },
    badge: { de: 'Beliebt', en: 'Popular' },
    coins: 80,
    priceLabel: '8,99 €',
    description: {
      de: 'Für kleinere Projekte, die regelmäßig neue Seiten oder Vorlagen brauchen.',
      en: 'For smaller projects that regularly need new pages or templates.',
    },
  },
  {
    key: 'coins_100',
    label: { de: 'Creator-Paket', en: 'Creator pack' },
    badge: { de: 'Teams', en: 'Teams' },
    coins: 100,
    priceLabel: '9,49 €',
    description: {
      de: 'Ideal, wenn du häufig Bausteine einfügst und Templates testest.',
      en: 'Ideal if you often add building blocks and try templates.',
    },
  },
  {
    key: 'coins_150',
    label: { de: 'Studio-Paket', en: 'Studio pack' },
    badge: { de: 'Agenturen', en: 'Agencies' },
    coins: 150,
    priceLabel: '13,99 €',
    description: {
      de: 'Mehr Volumen für größere App-Strukturen oder intensive KI-Nutzung.',
      en: 'More volume for larger apps or intensive AI usage.',
    },
  },
  {
    key: 'coins_300',
    label: { de: 'Scale-Paket', en: 'Scale pack' },
    badge: { de: 'Projekte', en: 'Projects' },
    coins: 300,
    priceLabel: '26,99 €',
    description: {
      de: 'Für Teams, die dauerhaft mit Vorlagen, Export und KI arbeiten.',
      en: 'For teams that work with templates, export and AI long-term.',
    },
  },
];

export default function BillingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const { lang } = useI18n();
  const tr = (de: string, en: string) => (lang === 'en' ? en : de);

  const checkout = async (packageKey: CoinPackageKey) => {
    if (!user?.uid) {
      alert(tr('Bitte melde dich an, um Coins zu kaufen.', 'Please sign in to buy coins.'));
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
        alert(data?.error ?? tr('Checkout konnte nicht gestartet werden.', 'Checkout could not be started.'));
      }
    } catch (error) {
      console.error(tr('Checkout fehlgeschlagen', 'Checkout failed'), error);
      alert(tr('Checkout konnte nicht gestartet werden.', 'Checkout could not be started.'));
    } finally {
      setLoading(null);
    }
  };

  const billingTourSteps = [
    {
      id: 'billing-intro',
      title: tr('Coins & Einmalprodukte', 'Coins & one-time purchases'),
      description: tr(
        'Hier siehst du, wofür Coins benötigt werden und wie du sie in wenigen Sekunden auflädst.',
        'See what coins are used for and how to top up in seconds.'
      ),
    },
    {
      id: 'billing-packs',
      title: tr('Pakete auswählen', 'Choose a package'),
      description: tr(
        'Wähle das passende Coin-Paket. Jeder Button öffnet direkt den Stripe-Checkout.',
        'Choose the right coin package. Each button opens Stripe Checkout.'
      ),
    },
    {
      id: 'billing-steps',
      title: tr('So läuft die Aufladung ab', 'How top-ups work'),
      description: tr(
        'Kurze Anleitung, wie Checkout, Webhook und Guthabenanzeige zusammenspielen.',
        'Quick overview of checkout, webhook, and balance updates.'
      ),
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen w-full bg-neutral-950 px-4 py-10 text-neutral-100 lg:px-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <header className="space-y-3" data-tour-id="billing-intro">
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Coins & Billing</p>
            <h1 className="text-3xl font-semibold">{tr('Alle Bausteine laufen über Coins', 'Everything runs on coins')}</h1>
            <p className="text-base text-neutral-300">
              {tr(
                'Coins brauchst du jetzt für Bausteine, Vorlagen, KI-Funktionen und neue Seiten. Lade das passende Paket auf und zahle sicher via Stripe – per Kreditkarte oder PayPal. Nach erfolgreicher Zahlung aktualisiert sich dein Guthaben automatisch in der Kopfzeile.',
                'Coins are used for building blocks, templates, AI features, and new pages. Top up with the right package and pay securely via Stripe — card or PayPal. After payment, your balance updates automatically in the header.'
              )}
            </p>
          </header>

          <section className="grid gap-4 md:grid-cols-3" data-tour-id="billing-packs">
            {COIN_BUNDLES.map((bundle) => (
              <div key={bundle.key} className="rounded-2xl border border-white/10 bg-neutral-900/80 p-5 shadow-lg">
                <div className="text-xs uppercase tracking-[0.35em] text-emerald-300">{lang === 'en' ? bundle.badge.en : bundle.badge.de}</div>
                <div className="mt-2 text-xl font-semibold">{lang === 'en' ? bundle.label.en : bundle.label.de}</div>
                <p className="text-sm text-neutral-400">{bundle.coins} Coins · {bundle.priceLabel}</p>
                <p className="mt-2 text-sm text-neutral-400">{lang === 'en' ? bundle.description.en : bundle.description.de}</p>
                <button
                  onClick={() => checkout(bundle.key)}
                  disabled={loading === bundle.key}
                  className="mt-4 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 font-semibold hover:bg-white/15 disabled:opacity-50"
                >
                  {loading === bundle.key ? tr('Weiter…', 'Continue…') : tr('Kaufen', 'Buy')}
                </button>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5 text-sm text-neutral-300" data-tour-id="billing-steps">
            <h2 className="text-lg font-semibold text-white">{tr('So funktioniert die Aufladung', 'How top-ups work')}</h2>
            <ol className="mt-3 space-y-2 text-neutral-300">
              <li>{tr('1. Paket auswählen und auf den Button klicken.', '1. Select a package and click the button.')}</li>
              <li>{tr('2. Stripe Checkout mit Karte oder PayPal abschließen.', '2. Complete Stripe Checkout with card or PayPal.')}</li>
              <li>{tr('3. Sobald Stripe den Erfolg meldet, schreibt der Webhook deine Coins gut.', '3. Once Stripe confirms success, the webhook credits your coins.')}</li>
              <li>{tr('4. Das aktuelle Guthaben siehst du direkt oben rechts neben deinem Profil.', '4. Your current balance is shown in the header next to your profile.')}</li>
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
