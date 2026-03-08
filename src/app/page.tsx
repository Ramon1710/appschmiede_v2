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

const heroStats = {
  de: ['Vorlagen-Start', 'KI-Generierung', 'Live-Vorschau'],
  en: ['Template start', 'AI generation', 'Live preview'],
} as const;

const featureSpotlights = {
  de: [
    {
      title: 'Projekte steuern',
      text: 'Alles in einem Workspace statt in fünf Tools.',
      accent: 'from-cyan-500/25 to-blue-500/10',
    },
    {
      title: 'Mit KI starten',
      text: 'Aus einer Idee werden Seiten, Bereiche und Inhalte.',
      accent: 'from-fuchsia-500/25 to-violet-500/10',
    },
    {
      title: 'Visuell bearbeiten',
      text: 'Layouts, Texte und Komponenten direkt im Editor anpassen.',
      accent: 'from-emerald-500/25 to-teal-500/10',
    },
    {
      title: 'Mobil testen',
      text: 'Per Vorschau-Link und QR-Code sofort auf dem Smartphone prüfen.',
      accent: 'from-amber-500/25 to-orange-500/10',
    },
  ],
  en: [
    {
      title: 'Control projects',
      text: 'Everything in one workspace instead of five tools.',
      accent: 'from-cyan-500/25 to-blue-500/10',
    },
    {
      title: 'Start with AI',
      text: 'Turn an idea into screens, sections, and content.',
      accent: 'from-fuchsia-500/25 to-violet-500/10',
    },
    {
      title: 'Edit visually',
      text: 'Adjust layouts, text, and components directly in the editor.',
      accent: 'from-emerald-500/25 to-teal-500/10',
    },
    {
      title: 'Test on mobile',
      text: 'Validate instantly via preview links and QR codes.',
      accent: 'from-amber-500/25 to-orange-500/10',
    },
  ],
} as const;

const personaCards = {
  de: [
    { icon: '🚀', title: 'Gründer:innen', text: 'Ideen schnell als MVP und Demo sichtbar machen.' },
    { icon: '🧩', title: 'Agenturen', text: 'Prototypen, Workshops und Kundenpräsentationen beschleunigen.' },
    { icon: '🏢', title: 'Teams', text: 'Interne Prozesse digitalisieren, bevor Entwicklung teuer wird.' },
  ],
  en: [
    { icon: '🚀', title: 'Founders', text: 'Turn ideas into visible MVPs and demos quickly.' },
    { icon: '🧩', title: 'Agencies', text: 'Speed up prototypes, workshops, and client presentations.' },
    { icon: '🏢', title: 'Teams', text: 'Digitize internal workflows before development gets expensive.' },
  ],
} as const;

const reasonPills = {
  de: ['Schneller Start', 'Weniger Abstimmung', 'Bessere Demos', 'Frühes Nutzerfeedback'],
  en: ['Faster start', 'Less coordination', 'Better demos', 'Earlier feedback'],
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

function SpotlightVisual({ title }: { title: string }) {
  if (/Projekte|Control projects/i.test(title)) {
    return (
      <div className="grid gap-2">
        <div className="flex items-center gap-2 rounded-xl bg-black/25 px-3 py-2 text-[11px] text-white/80">
          <span className="h-2 w-2 rounded-full bg-cyan-300" />
          Workspace Alpha
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-black/15 px-3 py-2 text-[11px] text-white/65">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          Mobile Support
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-10 rounded-xl bg-black/20" />
          <div className="h-10 rounded-xl bg-black/10" />
          <div className="h-10 rounded-xl bg-black/20" />
        </div>
      </div>
    );
  }

  if (/KI|AI/i.test(title)) {
    return (
      <div className="space-y-2">
        <div className="rounded-xl bg-black/20 px-3 py-2 text-[11px] text-white/80">
          Build a service app for field teams
        </div>
        <div className="flex flex-wrap gap-2">
          {['Dashboard', 'Tasks', 'Chat'].map((item) => (
            <span key={item} className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-white/70">
              {item}
            </span>
          ))}
        </div>
        <div className="h-8 rounded-xl bg-black/15" />
      </div>
    );
  }

  if (/Visuell|Edit visually/i.test(title)) {
    return (
      <div className="grid grid-cols-[56px_1fr] gap-2">
        <div className="space-y-2 rounded-xl bg-black/20 p-2">
          <div className="h-6 rounded-lg bg-white/10" />
          <div className="h-6 rounded-lg bg-white/5" />
          <div className="h-6 rounded-lg bg-white/10" />
        </div>
        <div className="rounded-xl bg-black/15 p-2">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-white/10" />
          <div className="mt-2 h-8 rounded-xl bg-white/10" />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="h-8 rounded-lg bg-white/5" />
            <div className="h-8 rounded-lg bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 text-[11px] text-white/75">
        <span>Preview</span>
        <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] text-emerald-200">Live</span>
      </div>
      <div className="mx-auto flex h-14 w-10 flex-col rounded-[14px] border border-white/10 bg-black/20 p-1.5">
        <div className="mx-auto h-1 w-5 rounded-full bg-white/10" />
        <div className="mt-2 h-5 rounded-lg bg-white/10" />
        <div className="mt-1 h-2 rounded-full bg-white/15" />
      </div>
      <div className="h-6 rounded-xl bg-black/15" />
    </div>
  );
}

function AiPromptVisual() {
  return (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">Screen</div>
          <div className="mt-2 h-10 rounded-xl bg-white/10" />
          <div className="mt-2 h-2.5 w-2/3 rounded-full bg-white/20" />
          <div className="mt-1 h-2.5 w-1/2 rounded-full bg-white/10" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
          <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-300">Flow</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-8 flex-1 rounded-xl bg-white/10" />
            <div className="h-px w-4 bg-cyan-300/60" />
            <div className="h-8 flex-1 rounded-xl bg-white/20" />
          </div>
          <div className="mt-3 h-2.5 w-3/4 rounded-full bg-white/15" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">Blocks</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {['Chat', 'Foto', 'Zeit'].map((item) => (
              <span key={item} className="rounded-full bg-black/20 px-2 py-1 text-[10px] text-white/75">
                {item}
              </span>
            ))}
          </div>
          <div className="mt-3 h-6 rounded-xl bg-white/10" />
        </div>
      </div>
    </>
  );
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('lang')?.value;
  const lang: Lang = raw === 'en' ? 'en' : 'de';
  const tr = (de: string, en: string) => (lang === 'en' ? en : de);
  const faq = faqEntries[lang];
  const trustList = trustFacts[lang];
  const stats = heroStats[lang];
  const spotlightCards = featureSpotlights[lang];
  const personas = personaCards[lang];
  const pills = reasonPills[lang];
  const {
    workflowSteps,
    kiHighlights,
  } = getHomeContent(lang);

  return (
    <div className="min-h-screen bg-[#03050a] text-white">
      <Header />
      <main className="w-full px-4 py-12 lg:px-10">
        <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-12">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#041634] via-[#050c1c] to-[#03050a] p-8 shadow-2xl md:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="text-center lg:text-left">
              <p className="text-sm uppercase tracking-[0.45em] text-cyan-300">{tr('No-Code Builder', 'No-code builder')}</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
                {tr('Von der Idee zur App in wenigen Minuten', 'From idea to app in minutes')}
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-neutral-200 lg:text-xl">
                {tr(
                  'Vorlage wählen, KI anschieben, im Editor verfeinern und direkt auf dem Handy testen. Weniger Planung, mehr sichtbares Produkt.',
                  'Pick a template, use AI, refine in the editor, and test on mobile right away. Less planning, more visible product.'
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
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                {stats.map((item) => (
                  <div key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-100 shadow-lg backdrop-blur">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative min-h-[420px]">
              <div className="absolute left-8 top-2 h-28 w-28 rounded-full bg-cyan-500/20 blur-3xl" />
              <div className="absolute bottom-6 right-10 h-32 w-32 rounded-full bg-fuchsia-500/20 blur-3xl" />
              <div className="relative mx-auto max-w-[760px]">
                <div className="relative rounded-[34px] border border-white/10 bg-[#06101d]/90 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <div className="ml-3 rounded-full bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-neutral-400">
                      {tr('Live Workspace', 'Live workspace')}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                      {[
                        tr('Dashboard', 'Dashboard'),
                        tr('Projekte', 'Projects'),
                        tr('Vorlagen', 'Templates'),
                        tr('Editor', 'Editor'),
                      ].map((item, index) => (
                        <div key={item} className={`rounded-2xl px-4 py-3 text-sm ${index === 1 ? 'bg-cyan-500/15 text-cyan-100' : 'bg-black/20 text-neutral-200'}`}>
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-4">
                      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 p-5">
                          <div className="text-xs uppercase tracking-[0.35em] text-cyan-100/80">{tr('App Preview', 'App preview')}</div>
                          <div className="mt-4 rounded-[28px] border border-white/10 bg-[#02050d] p-4">
                            <div className="mx-auto h-1.5 w-16 rounded-full bg-white/10" />
                            <div className="mt-4 h-24 rounded-3xl bg-white/10" />
                            <div className="mt-4 h-3 w-2/3 rounded-full bg-white/20" />
                            <div className="mt-2 h-3 w-1/2 rounded-full bg-white/10" />
                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <div className="h-16 rounded-2xl bg-white/5" />
                              <div className="h-16 rounded-2xl bg-white/10" />
                            </div>
                          </div>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                          <div className="text-xs uppercase tracking-[0.35em] text-neutral-400">{tr('Bausteine', 'Blocks')}</div>
                          <div className="mt-4 space-y-3">
                            {['Hero', 'Chat', 'Tasks', 'Analytics'].map((item) => (
                              <div key={item} className="rounded-2xl bg-black/20 px-4 py-3 text-sm text-neutral-200">{item}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        {spotlightCards.slice(0, 3).map((item) => (
                          <div key={item.title} className={`rounded-3xl border border-white/10 bg-gradient-to-br ${item.accent} p-4`}>
                            <div className="rounded-2xl bg-black/20 p-3">
                              <SpotlightVisual title={item.title} />
                            </div>
                            <div className="mt-4 text-sm font-semibold text-white">{item.title}</div>
                            <div className="mt-1 text-xs text-neutral-200">{item.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#050914]/90 p-8 shadow-lg">
          <header className="space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">{tr('Ablauf', 'Workflow')}</p>
            <h2 className="text-3xl font-semibold">{tr('So funktioniert die AppSchmiede', 'How AppSchmiede works')}</h2>
            <p className="text-sm text-neutral-300 md:text-base">
              {tr(
                'Drei klare Schritte statt langer Vorprojekte.',
                'Three clear steps instead of long prep phases.'
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
          </header>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {spotlightCards.map((feature) => (
              <article key={feature.title} className="overflow-hidden rounded-3xl border border-white/10 bg-[#070b16] p-4 shadow-lg">
                <div className={`rounded-2xl bg-gradient-to-br ${feature.accent} p-4`}>
                  <div className="rounded-2xl bg-black/20 p-3">
                    <SpotlightVisual title={feature.title} />
                  </div>
                </div>
                <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-neutral-300">{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#050914]/90 p-8 shadow-lg">
          <header className="space-y-3 text-center">
            <h2 className="text-3xl font-semibold">
              {tr('Für Gründer:innen, Agenturen und Teams, die schneller testen wollen', 'For founders, agencies and teams who want to test faster')}
            </h2>
          </header>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {personas.map((group) => (
              <article key={group.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-lg">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-3xl">{group.icon}</div>
                <h3 className="mt-4 text-xl font-semibold">{group.title}</h3>
                <p className="mt-2 text-sm text-neutral-300">{group.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div className="rounded-3xl border border-white/10 bg-[#070b16] p-5 shadow-lg">
              <div className="rounded-3xl border border-cyan-400/20 bg-[#0b1731] p-4">
                <div className="text-[11px] uppercase tracking-[0.35em] text-cyan-200">{tr('KI-Eingabe', 'AI prompt')}</div>
                <div className="mt-3 rounded-2xl bg-white/5 px-4 py-4 text-sm leading-6 text-neutral-200">
                  {tr(
                    'Baue eine Service-App mit Einsätzen, Fotos, Chat und Zeiterfassung für mobile Teams.',
                    'Build a service app with jobs, photos, chat, and time tracking for mobile teams.'
                  )}
                </div>
                <AiPromptVisual />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-semibold">{tr('KI an deiner Seite – kein Code notwendig', 'AI by your side — no code required')}</h2>
              <p className="mt-4 text-base text-neutral-300">
                {tr(
                  'Du beschreibst nur das Ziel. Die Plattform schlägt Seiten, Bausteine und Struktur vor, die du danach visuell weiterbearbeitest.',
                  'You only describe the outcome. The platform suggests screens, blocks, and structure, which you then refine visually.'
                )}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {kiHighlights.map((highlight) => (
                  <div key={highlight} className="rounded-2xl border border-white/10 bg-[#070b16] px-4 py-3 text-sm text-neutral-200">
                    ✓ {highlight}
                  </div>
                ))}
              </div>
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
                  'Interne Tools, Kunden-Demos und MVPs lassen sich deutlich früher sichtbar machen.',
                  'Internal tools, client demos, and MVPs become visible much earlier.'
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
          </header>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {pills.map((item) => (
              <div key={item} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-neutral-100 shadow-lg">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg">
          <header className="space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-300">FAQ</p>
            <h2 className="text-3xl font-semibold">{tr('Häufige Fragen zur Plattform', 'Common questions about the platform')}</h2>
          </header>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {faq.slice(0, 3).map((entry) => (
              <details key={entry.question} className="rounded-2xl border border-white/10 bg-[#070b16] p-5">
                <summary className="cursor-pointer list-none text-lg font-semibold text-white">{entry.question}</summary>
                <p className="mt-3 text-sm leading-6 text-neutral-300">{entry.answer}</p>
              </details>
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
