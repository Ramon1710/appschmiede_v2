import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import LegalModalTrigger from '@/components/LegalModalTrigger';

import { getHomeContent } from '@/lib/home-content';
import { cookies } from 'next/headers';
import { Lang } from '@/lib/i18n-dict';

const faqEntries = {
  de: [
    {
      question: 'Für wen ist AppSchmiede gedacht?',
      answer:
        'AppSchmiede richtet sich an Selbstständige, kleine Teams, Agenturen und Unternehmen, die interne Tools, MVPs oder klickbare Demos schneller umsetzen möchten. Statt ein Pflichtenheft zu schreiben, entsteht direkt ein testbarer Prototyp im Browser.',
    },
    {
      question: 'Was unterscheidet AppSchmiede von einem Baukasten?',
      answer:
        'Der Fokus liegt nicht auf dekorativen Webseiten, sondern auf arbeitsfähigen App-Strukturen: Projekte, Seiten, Vorlagen, Vorschau, Editor, KI-Generierung und wiederverwendbare Bausteine greifen in einer Oberfläche zusammen.',
    },
    {
      question: 'Wie läuft ein typisches Projekt ab?',
      answer:
        'Die meisten Nutzer starten mit einer Vorlage oder einem Branchen-Setup, ergänzen Inhalte mit KI und verfeinern die Seiten anschließend im Editor. Danach wird die App über Vorschau-Links oder QR-Codes intern getestet und iterativ verbessert.',
    },
    {
      question: 'Brauche ich Programmierkenntnisse?',
      answer:
        'Nein. Die Plattform ist so aufgebaut, dass Texte, Layouts, Bausteine und Seiten visuell bearbeitet werden können. Technische Teams können trotzdem mit klaren Strukturen, Projekten und Vorlagen arbeiten.',
    },
  ],
  en: [
    {
      question: 'Who is AppSchmiede built for?',
      answer:
        'AppSchmiede is designed for solo founders, small teams, agencies, and companies that want to ship internal tools, MVPs, or clickable demos faster. Instead of writing long specifications, you build a testable prototype directly in the browser.',
    },
    {
      question: 'What makes it different from a generic site builder?',
      answer:
        'The product is focused on usable app structures rather than decorative pages: projects, screens, templates, previews, editor workflows, AI generation, and reusable blocks all work together in one interface.',
    },
    {
      question: 'What does a typical workflow look like?',
      answer:
        'Most users start from a template or industry setup, extend it with AI-generated content, then refine screens in the editor. The result can be reviewed internally through preview links or QR codes and improved iteratively.',
    },
    {
      question: 'Do I need coding skills?',
      answer:
        'No. The platform is built so text, layouts, blocks, and pages can be edited visually. Technical teams can still benefit from clear project structure, reusable templates, and faster concept validation.',
    },
  ],
} as const;

const trustFacts = {
  de: [
    'Browserbasierter Editor ohne lokale Installation',
    'Projektverwaltung, Vorschau und QR-Tests in einem Workflow',
    'Rechtliche Basis mit Impressum und Datenschutz bereits vorhanden',
  ],
  en: [
    'Browser-based editor with no local installation required',
    'Projects, previews, and QR testing combined in one workflow',
    'Legal foundation with imprint and privacy pages already available',
  ],
} as const;

function WorkflowPreview({
  index,
  lang,
}: {
  index: number;
  lang: Lang;
}) {
  if (index === 0) {
    return (
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#091120] p-4 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.16),_transparent_40%)]" />
        <div className="relative rounded-[22px] border border-white/10 bg-[#050914]/95 p-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <div className="ml-3 rounded-full bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-neutral-400">
              {lang === 'en' ? 'Template Hub' : 'Vorlagen-Hub'}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              {
                title: lang === 'en' ? 'Support App' : 'Support-App',
                accent: 'from-cyan-500/30 to-blue-500/10',
              },
              {
                title: lang === 'en' ? 'Time Tracking' : 'Zeiterfassung',
                accent: 'from-emerald-500/30 to-teal-500/10',
              },
              {
                title: lang === 'en' ? 'Analytics Board' : 'Analytics-Board',
                accent: 'from-fuchsia-500/30 to-violet-500/10',
              },
              {
                title: lang === 'en' ? 'Task Space' : 'Task-Space',
                accent: 'from-amber-500/30 to-orange-500/10',
              },
            ].map((item) => (
              <div key={item.title} className={`rounded-2xl border border-white/10 bg-gradient-to-br ${item.accent} p-4`}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <div className="rounded-full border border-white/15 bg-black/20 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-white/70">
                    MVP
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-2.5 w-3/4 rounded-full bg-white/20" />
                  <div className="h-2.5 w-1/2 rounded-full bg-white/10" />
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="h-14 rounded-xl bg-black/20" />
                    <div className="h-14 rounded-xl bg-black/10" />
                    <div className="h-14 rounded-xl bg-black/20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#091120] p-4 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),_transparent_40%)]" />
        <div className="relative rounded-[22px] border border-white/10 bg-[#040816]/95 p-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">{lang === 'en' ? 'AI Generator' : 'KI-Generator'}</div>
              <div className="mt-1 text-sm font-semibold text-white">{lang === 'en' ? 'Prompt to app structure' : 'Prompt zur App-Struktur'}</div>
            </div>
            <div className="rounded-full bg-cyan-500/15 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-cyan-200">
              Live
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">{lang === 'en' ? 'Prompt' : 'Eingabe'}</div>
            <div className="mt-2 rounded-2xl border border-cyan-400/20 bg-[#0b1731] px-4 py-3 text-sm leading-6 text-neutral-200">
              {lang === 'en'
                ? 'Build a mobile app for field technicians with tasks, time logs, photo uploads, and status updates.'
                : 'Erstelle eine mobile App für Servicetechniker mit Aufgaben, Zeiterfassung, Foto-Uploads und Status-Updates.'}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">{lang === 'en' ? 'Generated pages' : 'Generierte Seiten'}</div>
              <div className="mt-3 space-y-2">
                {[
                  lang === 'en' ? 'Dashboard' : 'Dashboard',
                  lang === 'en' ? 'Task details' : 'Aufgabendetails',
                  lang === 'en' ? 'Time tracking' : 'Zeiterfassung',
                  lang === 'en' ? 'Media upload' : 'Medien-Upload',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2 text-sm text-neutral-200">
                    <span className="h-2 w-2 rounded-full bg-cyan-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 to-cyan-500/10 p-4">
              <div className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">{lang === 'en' ? 'Suggested stack' : 'Vorgeschlagene Bausteine'}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/80">
                {['Chat', 'Support', 'QR', 'Analytics', 'Tasks', 'Preview'].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#091120] p-4 shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,_rgba(56,189,248,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.14),_transparent_35%)]" />
      <div className="relative rounded-[22px] border border-white/10 bg-[#040816]/95 p-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">{lang === 'en' ? 'Visual Editor' : 'Visueller Editor'}</div>
            <div className="mt-1 text-sm font-semibold text-white">{lang === 'en' ? 'Drag, preview, adjust' : 'Ziehen, prüfen, anpassen'}</div>
          </div>
          <div className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/70">
            {lang === 'en' ? 'Preview' : 'Vorschau'}
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[200px_minmax(0,1fr)_220px]">
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
            {['Hero', 'Features', 'CTA', 'Support'].map((item) => (
              <div key={item} className="rounded-xl bg-black/20 px-3 py-2 text-sm text-neutral-200">
                {item}
              </div>
            ))}
          </div>
          <div className="rounded-[28px] border border-cyan-400/20 bg-[#0b1731] p-3">
            <div className="mx-auto flex h-[260px] max-w-[180px] flex-col rounded-[26px] border border-white/10 bg-[#02050d] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              <div className="mx-auto h-1.5 w-14 rounded-full bg-white/10" />
              <div className="mt-4 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-blue-500/10" />
              <div className="mt-3 h-3 w-2/3 rounded-full bg-white/20" />
              <div className="mt-2 h-3 w-1/2 rounded-full bg-white/10" />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="h-16 rounded-2xl bg-white/5" />
                <div className="h-16 rounded-2xl bg-white/10" />
              </div>
              <div className="mt-3 h-10 rounded-2xl bg-cyan-500/20" />
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="h-10 rounded-xl bg-black/20" />
            <div className="h-20 rounded-2xl bg-black/10" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 rounded-2xl bg-black/20" />
              <div className="h-16 rounded-2xl bg-black/10" />
            </div>
            <div className="h-12 rounded-2xl bg-fuchsia-500/15" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('lang')?.value;
  const lang: Lang = raw === 'en' ? 'en' : 'de';
  const tr = (de: string, en: string) => (lang === 'en' ? en : de);
  const faq = faqEntries[lang];
  const trustList = trustFacts[lang];
  const {
    workflowSteps,
    featureList,
    audience,
    kiHighlights,
    reasons,
    coinPricingCards,
    subscriptionPlans,
    subscriptionPlanOrder,
    planFeatureRows,
  } = getHomeContent(lang);

  return (
    <div className="min-h-screen bg-[#03050a] text-white">
      <Header />
      <main className="w-full px-4 py-12 lg:px-10">
        <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-12">
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
          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <article key={step.title} className="rounded-[30px] border border-white/10 bg-white/5 p-4 shadow-xl">
                <WorkflowPreview index={index} lang={lang} />
                <div className="px-1 pb-2 pt-5">
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-400">
                    {tr('Schritt', 'Step')} {index + 1}
                  </span>
                  <h3 className="mt-3 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-neutral-300">{step.description}</p>
                </div>
              </article>
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

        <section className="rounded-3xl border border-white/10 bg-[#08111f] p-8 shadow-lg">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">{tr('Praxis', 'Real-world use')}</p>
              <h2 className="mt-3 text-3xl font-semibold">{tr('Wie Teams AppSchmiede konkret einsetzen', 'How teams use AppSchmiede in practice')}</h2>
              <p className="mt-4 text-base text-neutral-300">
                {tr(
                  'Typische Einsätze sind interne Prozess-Apps, Support-Oberflächen, mobile Arbeitsmasken für Service-Teams, kleine Kundenportale oder schnelle MVPs für neue Geschäftsmodelle. Statt monatelanger Entwicklung entstehen belastbare Prototypen, die intern getestet und dann gezielt ausgebaut werden.',
                  'Typical use cases include internal process apps, support workflows, mobile screens for service teams, small client portals, or fast MVPs for new business ideas. Instead of waiting through long delivery cycles, teams get something tangible to test and improve.'
                )}
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: tr('Interne Tools', 'Internal tools'),
                    description: tr('Zeiterfassung, Checklisten, Schicht- oder Aufgabenansichten für den täglichen Betrieb.', 'Time tracking, checklists, scheduling, or task flows for daily operations.'),
                  },
                  {
                    title: tr('Kunden-Demos', 'Client demos'),
                    description: tr('Klickbare Prototypen für Angebote, Pitches oder Workshops mit direktem Feedback.', 'Clickable prototypes for proposals, pitches, or workshops with direct feedback.'),
                  },
                  {
                    title: tr('MVP-Tests', 'MVP validation'),
                    description: tr('Neue Ideen in wenigen Tagen sichtbar machen, bevor Budget in Entwicklung fließt.', 'Make new ideas visible in days before serious build budget is committed.'),
                  },
                ].map((item) => (
                  <article key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-neutral-300">{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
            <aside className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">{tr('Vertrauen', 'Trust')}</p>
              <h3 className="mt-3 text-2xl font-semibold">{tr('Was Besucher auf der Website direkt nachvollziehen können', 'What visitors can verify right away')}</h3>
              <ul className="mt-5 space-y-3 text-sm text-neutral-200">
                {trustList.map((fact) => (
                  <li key={fact}>✓ {fact}</li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link href="/about" className="rounded-full border border-white/20 px-4 py-2 text-center text-sm font-semibold text-white transition hover:border-cyan-400/60 hover:text-cyan-200">
                  {tr('Mehr über AppSchmiede', 'More about AppSchmiede')}
                </Link>
                <Link href="/impressum" className="rounded-full border border-white/20 px-4 py-2 text-center text-sm font-semibold text-white transition hover:border-cyan-400/60 hover:text-cyan-200">
                  {tr('Impressum ansehen', 'View imprint')}
                </Link>
              </div>
            </aside>
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

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg">
          <header className="space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-300">FAQ</p>
            <h2 className="text-3xl font-semibold">{tr('Häufige Fragen zur Plattform', 'Common questions about the platform')}</h2>
            <p className="text-base text-neutral-300">
              {tr(
                'Diese Antworten helfen Besucherinnen und Besuchern, das Produkt, den Einsatzbereich und den Ablauf besser einzuordnen.',
                'These answers help visitors understand the product, its use cases, and how the workflow fits into real projects.'
              )}
            </p>
          </header>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faq.map((entry) => (
              <article key={entry.question} className="rounded-2xl border border-white/10 bg-[#070b16] p-5">
                <h3 className="text-lg font-semibold">{entry.question}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-300">{entry.answer}</p>
              </article>
            ))}
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
      </main>

      <LegalModalTrigger className="fixed bottom-4 left-4" />
    </div>
  );
}
