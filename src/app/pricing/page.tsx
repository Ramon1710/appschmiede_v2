import Link from 'next/link';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import LegalModalTrigger from '@/components/LegalModalTrigger';
import { getHomeContent } from '@/lib/home-content';
import type { Lang } from '@/lib/i18n-dict';

export const metadata: Metadata = {
  title: 'Preise | AppSchmiede',
  description:
    'Alle Preise, Abos und Coin-Pakete von AppSchmiede auf einer eigenen Seite mit direktem Zugang zum Billing-Bereich.',
};

export default async function PricingPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('lang')?.value;
  const lang: Lang = raw === 'en' ? 'en' : 'de';
  const tr = (de: string, en: string) => (lang === 'en' ? en : de);
  const { subscriptionPlans, subscriptionPlanOrder, planFeatureRows, coinPricingCards } = getHomeContent(lang);
  const orderedPlans = subscriptionPlanOrder
    .map((planId) => subscriptionPlans.find((plan) => plan.id === planId))
    .filter((plan): plan is NonNullable<typeof plan> => Boolean(plan));

  return (
    <div className="min-h-screen bg-[#03050a] text-white">
      <Header />
      <main className="mx-auto flex w-full max-w-[1380px] flex-col gap-8 px-4 py-12 lg:px-10">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#041634] via-[#050c1c] to-[#03050a] p-8 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">{tr('Preise', 'Pricing')}</p>
          <h1 className="mt-3 text-4xl font-semibold">{tr('Abos und Coins auf einen Blick', 'Subscriptions and coins at a glance')}</h1>
          <p className="mt-5 max-w-4xl text-base leading-7 text-neutral-200">
            {tr(
              'Wähle zwischen laufenden Abos für regelmäßige Nutzung und Coin-Paketen für zusätzliche Bausteine, KI-Läufe oder neue Seiten. Coins sind zusätzlich jederzeit im Billing-Bereich aufladbar.',
              'Choose between recurring subscriptions for regular usage and coin packs for extra building blocks, AI actions, or new pages. Coins can also be topped up any time in the billing area.'
            )}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-[#050c1c] transition hover:bg-neutral-200">
              {tr('Kostenlos starten', 'Start for free')}
            </Link>
            <Link href="/tools/billing" className="rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-cyan-400/60 hover:text-cyan-200">
              {tr('Zu den Coins', 'Go to coins')}
            </Link>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          {orderedPlans.map((plan) => (
            <article key={plan.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">{plan.badge}</div>
              <h2 className="mt-3 text-2xl font-semibold">{plan.title}</h2>
              <p className="mt-2 text-sm text-neutral-300">{plan.price}</p>
              <p className="mt-4 text-sm leading-6 text-neutral-400">{plan.description}</p>
              <div className="mt-5 space-y-2">
                {plan.highlights.map((highlight) => (
                  <div key={highlight} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-200">
                    {highlight}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#050914]/90 p-8 shadow-lg">
          <h2 className="text-3xl font-semibold">{tr('Leistungsübersicht', 'Feature overview')}</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-left text-sm">
              <thead className="bg-white/5 text-neutral-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">{tr('Leistung', 'Feature')}</th>
                  {orderedPlans.map((plan) => (
                    <th key={plan.id} className="px-4 py-3 font-semibold">{plan.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {planFeatureRows.map((row, index) => (
                  <tr key={row.feature} className={index % 2 === 0 ? 'bg-white/[0.03]' : 'bg-transparent'}>
                    <td className="border-t border-white/10 px-4 py-3 text-neutral-200">{row.feature}</td>
                    {orderedPlans.map((plan) => (
                      <td key={plan.id} className="border-t border-white/10 px-4 py-3 text-neutral-400">{row.values[plan.id]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold">{tr('Coin-Pakete für Extras', 'Coin packs for extras')}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-300">
                {tr(
                  'Coins nutzt du für zusätzliche Bausteine, KI-Funktionen, Vorlagen und neue Seiten. Die Pakete kaufst du einmalig und lädst sie im Billing-Bereich auf dein Konto.',
                  'Use coins for extra building blocks, AI features, templates, and new pages. Coin packs are one-time purchases that you top up in the billing area.'
                )}
              </p>
            </div>
            <Link href="/tools/billing" className="rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-cyan-400/60 hover:text-cyan-200">
              {tr('Coins kaufen', 'Buy coins')}
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {coinPricingCards.map((card) => (
              <article key={card.id} className="rounded-2xl border border-white/10 bg-black/20 p-5 shadow-lg">
                <div className="text-xs uppercase tracking-[0.35em] text-emerald-300">{card.badge}</div>
                <h3 className="mt-3 text-xl font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm text-neutral-300">{card.price}</p>
                <p className="mt-4 text-sm leading-6 text-neutral-400">{card.description}</p>
                <div className="mt-5 space-y-2">
                  {card.highlights.map((highlight) => (
                    <div key={highlight} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200">
                      {highlight}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <LegalModalTrigger className="fixed bottom-4 left-4" />
    </div>
  );
}