'use client';

import { useMemo, useState } from 'react';
import { getHomeContent } from '@/lib/home-content';
import { useI18n } from '@/lib/i18n';

type PricingModalTab = 'coins' | 'subscriptions';

type PricingModalTriggerProps = {
  label: string;
  initialTab?: PricingModalTab;
  className?: string;
};

export default function PricingModalTrigger({
  label,
  initialTab = 'coins',
  className,
}: PricingModalTriggerProps) {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PricingModalTab>(initialTab);

  const content = useMemo(() => getHomeContent(lang), [lang]);

  const openModal = () => {
    setActiveTab(initialTab);
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={className}
      >
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-4 py-6">
          <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#050914] shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                  {lang === 'en' ? 'Pricing' : 'Preise'}
                </div>
                <h2 className="mt-2 text-3xl font-semibold text-white">
                  {lang === 'en' ? 'Coins and subscriptions at a glance' : 'Coins und Abos auf einen Blick'}
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('coins')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === 'coins'
                      ? 'bg-cyan-500/20 text-cyan-100'
                      : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  {lang === 'en' ? 'Coins' : 'Coins'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('subscriptions')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === 'subscriptions'
                      ? 'bg-cyan-500/20 text-cyan-100'
                      : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  {lang === 'en' ? 'Subscriptions' : 'Abos'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-white/10"
                >
                  {lang === 'en' ? 'Close' : 'Schließen'}
                </button>
              </div>
            </div>

            <div className="max-h-[78vh] overflow-y-auto px-6 py-6">
              {activeTab === 'coins' ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {content.coinPricingCards.map((plan) => (
                      <article key={plan.id} className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5">
                        <p className="text-xs uppercase tracking-[0.35em] text-neutral-400">{plan.badge}</p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">{plan.title}</h3>
                        <p className="text-lg font-semibold text-cyan-300">{plan.price}</p>
                        <p className="mt-2 text-sm text-neutral-300">{plan.description}</p>
                        <ul className="mt-4 space-y-2 text-sm text-neutral-200">
                          {plan.highlights.map((highlight) => (
                            <li key={highlight}>✓ {highlight}</li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {content.subscriptionPlans.map((plan) => (
                      <article key={plan.id} className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5">
                        <p className="text-xs uppercase tracking-[0.35em] text-neutral-400">{plan.badge}</p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">{plan.title}</h3>
                        <p className="text-lg font-semibold text-cyan-300">{plan.price}</p>
                        <p className="mt-2 text-sm text-neutral-300">{plan.description}</p>
                        <ul className="mt-4 space-y-2 text-sm text-neutral-200">
                          {plan.highlights.map((highlight) => (
                            <li key={highlight}>✓ {highlight}</li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
                    <table className="w-full text-sm text-neutral-200">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-[0.3em] text-neutral-400">
                          <th className="px-4 py-3">{lang === 'en' ? 'Feature' : 'Funktion'}</th>
                          {content.subscriptionPlanOrder.map((planId) => {
                            const plan = content.subscriptionPlans.find((entry) => entry.id === planId);
                            if (!plan) return null;
                            return (
                              <th key={plan.id} className="px-4 py-3 text-center">
                                {plan.title}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {content.planFeatureRows.map((row) => (
                          <tr key={row.feature} className="border-t border-white/10">
                            <td className="px-4 py-4 font-semibold text-white">{row.feature}</td>
                            {content.subscriptionPlanOrder.map((planId) => (
                              <td key={`${row.feature}-${planId}`} className="px-4 py-4 text-center text-neutral-100">
                                {row.values[planId]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}