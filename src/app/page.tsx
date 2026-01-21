import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import LegalModalTrigger from '@/components/LegalModalTrigger';
import GoogleAdSlot from '@/components/GoogleAdSlot';

import { getHomeContent } from '@/lib/home-content';
import { cookies } from 'next/headers';
import { Lang } from '@/lib/i18n-dict';

export default async function HomePage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('lang')?.value;
  const lang: Lang = raw === 'en' ? 'en' : 'de';
  const tr = (de: string, en: string) => (lang === 'en' ? en : de);
  const {
    workflowSteps,
    featureList,
    audience,
    kiHighlights,
    reasons,
    adSlotsLeft,
    adSlotsRight,
    coinPricingCards,
    subscriptionPlans,
    subscriptionPlanOrder,
    planFeatureRows,
  } = getHomeContent(lang);

  return (
    <div className="min-h-screen bg-[#03050a] text-white">
      <Header />
      <main className="w-full px-4 py-12 lg:px-10">
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[280px_minmax(0,1fr)_280px]">
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              {adSlotsLeft.map((ad) => (
                <GoogleAdSlot
                  key={ad.slotKey}
                  slotKey={ad.slotKey}
                  backgroundFallback={
                    <>
                      <h3 className="mt-2 text-lg font-semibold text-white">{ad.title}</h3>
                      <p className="mt-2 text-sm text-white/80">{ad.description}</p>
                    </>
                  }
                />
              ))}
            </div>
          </aside>

          <div className="flex flex-col gap-12">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#041634] via-[#050c1c] to-[#03050a] p-10 shadow-2xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
            <div className="flex-1 text-center lg:text-left">
              <p className="text-sm uppercase tracking-[0.45em] text-cyan-300">{tr('No-Code Builder', 'No-code builder')}</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
                {tr('Von der Idee zur App in wenigen Minuten', 'From idea to app in minutes')}
              </h1>
              <p className="mt-5 text-lg text-neutral-200">
                {tr(
                  'Melde dich an, wähle eine Vorlage, lass dir von der KI helfen und passe alles im Editor an – direkt im Browser und ohne Vorkenntnisse. So testest du deine App-Ideen schneller als je zuvor.',
                  'Sign up, pick a template, let AI help you, and fine-tune everything in the editor — right in the browser, no prior knowledge required. Test your app ideas faster than ever.'
                )}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  href="/register"
                  className="w-full rounded-full bg-white px-6 py-3 text-center text-base font-semibold text-[#050c1c] transition hover:bg-neutral-200 sm:w-auto"
                >
                  {tr('Jetzt kostenlos starten', 'Start for free')}
                </Link>
                <Link
                  href="/projects"
                  className="w-full rounded-full border border-white/30 px-6 py-3 text-center text-base font-semibold text-white transition hover:border-white hover:text-white sm:w-auto"
                >
                  {tr('Beispiele ansehen', 'See examples')}
                </Link>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <div className="relative h-56 w-56 sm:h-64 sm:w-64">
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-cyan-500 via-blue-500 to-fuchsia-600 blur-2xl opacity-40" />
                <div className="relative flex h-full w-full items-center justify-center rounded-[32px] border border-white/15 bg-black/20 backdrop-blur">
                  <Image
                    src="/logo.png"
                    alt={tr('AppSchmiede Logo', 'AppSchmiede logo')}
                    width={220}
                    height={220}
                    priority
                    className="drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#050914]/90 p-8 shadow-lg">
          <header className="space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">{tr('Ablauf', 'Workflow')}</p>
            <h2 className="text-3xl font-semibold">{tr('So funktioniert die AppSchmiede', 'How AppSchmiede works')}</h2>
            <p className="text-base text-neutral-300">
              {tr(
                'AppSchmiede ist deine Werkbank für digitale Produkte. Statt monatelang zu planen, baust du in wenigen Schritten eine funktionsfähige App, testest sie mit deinem Team oder Kund:innen und entscheidest dann, wie es weitergeht.',
                'AppSchmiede is your workshop for digital products. Instead of planning for months, you build a working app in just a few steps, test it with your team or clients, and then decide what to do next.'
              )}
            </p>
          </header>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-400">
                  {tr('Schritt', 'Step')} {index + 1}
                </span>
                <h3 className="mt-3 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm text-neutral-300">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg">
          <header className="space-y-3 text-center">
            <h2 className="text-3xl font-semibold">
              {tr('Alles, was du zum App-Bau brauchst – in einer Oberfläche', 'Everything you need to build an app — in one interface')}
            </h2>
            <p className="text-base text-neutral-300">
              {tr(
                'AppSchmiede bündelt alle Schritte, die du für moderne Web-Apps brauchst – von der Idee bis zur Vorschau auf dem Handy.',
                'AppSchmiede bundles every step you need for modern web apps — from idea to a mobile preview.'
              )}
            </p>
          </header>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {featureList.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-white/10 bg-[#070b16] p-5">
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm text-neutral-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#050914]/90 p-8 shadow-lg">
          <header className="space-y-3 text-center">
            <h2 className="text-3xl font-semibold">
              {tr('Für Gründer:innen, Agenturen und Teams, die schneller testen wollen', 'For founders, agencies and teams who want to test faster')}
            </h2>
            <p className="text-base text-neutral-300">
              {tr(
                'AppSchmiede richtet sich an alle, die digitale Ideen nicht nur auf Papier, sondern direkt vor Augen sehen wollen.',
                'AppSchmiede is for anyone who wants to see digital ideas on screen — not just on paper.'
              )}
            </p>
          </header>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {audience.map((group) => (
              <div key={group.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-xl font-semibold">{group.title}</h3>
                <p className="mt-3 text-sm text-neutral-300">{group.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold">{tr('KI an deiner Seite – kein Code notwendig', 'AI by your side — no code required')}</h2>
              <p className="mt-4 text-base text-neutral-300">
                {tr(
                  'Statt pixelgenauen Wireframes und komplizierten Tickets beschreibst du einfach, was du brauchst: „Eine App zur Zeiterfassung für mein Team, mit Projektübersicht, Stundenerfassung und Auswertung.“ Die KI erstellt dir die passende Struktur, Seiten und Bausteine. Du entscheidest, was bleibt – den Rest passt du im Editor an.',
                  'Instead of pixel-perfect wireframes and complex tickets, you just describe what you need: “A time-tracking app for my team, with a project overview, time entries, and reports.” The AI generates the structure, pages and building blocks. You decide what stays — and fine-tune the rest in the editor.'
                )}
              </p>
            </div>
            <div className="space-y-3 rounded-2xl border border-white/10 bg-[#070b16] p-5">
              {kiHighlights.map((highlight) => (
                <p key={highlight} className="text-sm text-neutral-200">
                  ✓ {highlight}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#050914]/90 p-8 shadow-lg">
          <header className="space-y-3 text-center">
            <h2 className="text-3xl font-semibold">
              {tr('Warum du deine nächste App in der AppSchmiede bauen solltest', 'Why you should build your next app with AppSchmiede')}
            </h2>
            <p className="text-base text-neutral-300">
              {tr(
                'Weil du keine Zeit für endlose Abstimmungen, Lastenhefte und Warteschlangen in der IT hast.',
                'Because you don’t have time for endless alignment, specs, and IT queues.'
              )}
            </p>
          </header>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {reasons.map((reason) => (
              <div key={reason.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-xl font-semibold">{reason.title}</h3>
                <p className="mt-3 text-sm text-neutral-300">{reason.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="preise" className="rounded-3xl border border-white/10 bg-[#050914]/90 p-8 shadow-lg">
          <header className="space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">
              {tr('Preise & Guthaben', 'Pricing & balance')}
            </p>
            <h2 className="text-3xl font-semibold">
              {tr('Coins für jede Aktion, Abos für planbare Budgets', 'Coins for every action, subscriptions for predictable budgets')}
            </h2>
            <p className="text-base text-neutral-300">
              {tr(
                'Jeder Baustein, jede Vorlage und jede KI-Funktion verbraucht Coins. Lade ein Paket auf oder sichere dir monatliche Kontingente über eines der Abos. Alles läuft über Stripe – per Kreditkarte oder PayPal.',
                'Every building block, template and AI feature consumes coins. Top up with a package or get monthly budgets via a subscription. Payments run via Stripe — card or PayPal.'
              )}
            </p>
          </header>
          <div className="mt-8 space-y-10">
            <div>
              <div className="flex flex-col gap-2 text-center">
                <h3 className="text-2xl font-semibold">{tr('Coin-Pakete', 'Coin packages')}</h3>
                <p className="text-sm text-neutral-400">
                  {tr(
                    'Sofort verfügbar nach Kauf – perfekt für spontane KI-Läufe oder zusätzliche Bausteine.',
                    'Available instantly after purchase — perfect for quick AI runs or extra building blocks.'
                  )}
                </p>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {coinPricingCards.map((plan) => (
                  <div key={plan.id} className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.35em] text-neutral-400">{plan.badge}</p>
                    <h3 className="mt-2 text-2xl font-semibold">{plan.title}</h3>
                    <p className="text-lg font-semibold text-cyan-300">{plan.price}</p>
                    <p className="mt-2 text-sm text-neutral-300">{plan.description}</p>
                    <ul className="mt-4 space-y-2 text-sm text-neutral-200">
                      {plan.highlights.map((highlight) => (
                        <li key={highlight}>✓ {highlight}</li>
                      ))}
                    </ul>
                    <Link
                      href="/tools/billing"
                      className="mt-6 inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/60 hover:text-cyan-200"
                    >
                      {tr('Coins kaufen', 'Buy coins')}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex flex-col gap-2 text-center">
                <h3 className="text-2xl font-semibold">{tr('Abomodelle', 'Subscriptions')}</h3>
                <p className="text-sm text-neutral-400">
                  {tr(
                    'Plane feste Budgets, sichere dir monatliche Coins und zusätzliche Funktionen.',
                    'Plan fixed budgets, get monthly coins, and unlock additional features.'
                  )}
                </p>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {subscriptionPlans.map((plan) => (
                  <div key={plan.id} className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.35em] text-neutral-400">{plan.badge}</p>
                    <h3 className="mt-2 text-2xl font-semibold">{plan.title}</h3>
                    <p className="text-lg font-semibold text-cyan-300">{plan.price}</p>
                    <p className="mt-2 text-sm text-neutral-300">{plan.description}</p>
                    <ul className="mt-4 space-y-2 text-sm text-neutral-200">
                      {plan.highlights.map((highlight) => (
                        <li key={highlight}>✓ {highlight}</li>
                      ))}
                    </ul>
                    <Link
                      href="/tools/billing"
                      className="mt-6 inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/60 hover:text-cyan-200"
                    >
                      {tr('Abo wählen', 'Choose plan')}
                    </Link>
                  </div>
                ))}
              </div>

              <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
                <table className="w-full text-sm text-neutral-200">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.3em] text-neutral-400">
                      <th className="px-4 py-3">{tr('Funktion', 'Feature')}</th>
                      {subscriptionPlanOrder.map((planId) => {
                        const plan = subscriptionPlans.find((entry) => entry.id === planId);
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
                    {planFeatureRows.map((row) => (
                      <tr key={row.feature} className="border-t border-white/10">
                        <td className="px-4 py-4 font-semibold text-white">{row.feature}</td>
                        {subscriptionPlanOrder.map((planId) => (
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
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1731] via-[#050c1c] to-[#03050a] p-8 text-center shadow-2xl">
          <h2 className="text-3xl font-semibold">{tr('Bereit, deine erste App zu schmieden?', 'Ready to forge your first app?')}</h2>
          <p className="mx-auto mt-4 max-w-3xl text-base text-neutral-200">
            {tr(
              'Lege heute dein erstes Projekt an und erlebe, wie sich deine Idee innerhalb weniger Minuten in eine klickbare App verwandelt. Du kannst jederzeit klein anfangen – und wachsen, wenn deine Anforderungen steigen.',
              'Create your first project today and see your idea turn into a clickable app within minutes. Start small anytime — and grow as your requirements evolve.'
            )}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="w-full rounded-full bg-white px-6 py-3 text-center text-base font-semibold text-[#050c1c] transition hover:bg-neutral-200 sm:w-auto"
            >
              {tr('Jetzt kostenlos registrieren', 'Register for free')}
            </Link>
            <Link
              href="/projects"
              className="w-full rounded-full border border-white/30 px-6 py-3 text-center text-base font-semibold text-white transition hover:border-white hover:text-white sm:w-auto"
            >
              {tr('Projekt anlegen und loslegen', 'Create a project and get started')}
            </Link>
          </div>
        </section>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              {adSlotsRight.map((ad) => (
                <GoogleAdSlot
                  key={ad.slotKey}
                  slotKey={ad.slotKey}
                  backgroundFallback={
                    <>
                      <h3 className="mt-2 text-lg font-semibold text-white">{ad.title}</h3>
                      <p className="mt-2 text-sm text-white/80">{ad.description}</p>
                    </>
                  }
                />
              ))}
            </div>
          </aside>
        </div>
      </main>

      <LegalModalTrigger className="fixed bottom-4 left-4" />
    </div>
  );
}
