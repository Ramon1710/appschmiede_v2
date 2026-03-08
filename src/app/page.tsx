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

function TemplateGalleryMini({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  const items = [
    {
      title: lang === 'en' ? 'Support App' : 'Support-App',
      description: lang === 'en' ? 'Tickets, chat, and help center.' : 'Tickets, Chat und Helpdesk.',
    },
    {
      title: lang === 'en' ? 'Time Tracking' : 'Zeiterfassung',
      description: lang === 'en' ? 'Timesheets, reports, and teams.' : 'Zeiten, Auswertung und Teams.',
    },
    {
      title: lang === 'en' ? 'Analytics Board' : 'Analytics-Board',
      description: lang === 'en' ? 'KPIs, dashboards, and exports.' : 'KPIs, Dashboards und Exporte.',
    },
  ];

  return (
    <div className="rounded-[22px] border border-white/10 bg-neutral-950/90 p-4 shadow-2xl">
      <div className="space-y-1 border-b border-white/10 pb-3">
        <div className="text-[11px] uppercase tracking-[0.35em] text-neutral-500">{lang === 'en' ? 'Templates' : 'Vorlagen'}</div>
        <div className="text-sm font-semibold text-white">{lang === 'en' ? 'Build from ready-made apps' : 'Mit fertigen Apps starten'}</div>
      </div>
      <div className={`mt-4 grid gap-3 ${compact ? 'grid-cols-1' : 'md:grid-cols-3'}`}>
        {items.slice(0, compact ? 2 : 3).map((item) => (
          <article key={item.title} className="rounded-2xl border border-white/10 bg-neutral-900/80 p-3 shadow-lg shadow-black/20">
            <div className="h-20 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent" />
            <div className="mt-3 text-sm font-medium text-neutral-100">{item.title}</div>
            <div className="mt-1 text-xs text-neutral-400">{item.description}</div>
            <div className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-center text-xs font-semibold text-neutral-100">
              {lang === 'en' ? 'Create project' : 'Projekt anlegen'}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function DashboardMini({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-neutral-950/90 p-4 shadow-2xl">
      <div className="flex items-center gap-3 pb-3">
        <div className="text-lg font-semibold text-white">Dashboard</div>
        <div className="ml-auto text-xs text-neutral-500">hello@appschmiede.dev</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-4">
        <div className="text-[11px] uppercase tracking-[0.35em] text-cyan-400/80">{lang === 'en' ? 'Welcome back' : 'Willkommen zurück'}</div>
        <div className="mt-2 text-xl font-semibold text-white">{lang === 'en' ? 'Build your next app in minutes.' : 'Baue deine nächste App in Minuten.'}</div>
        <div className="mt-3 flex gap-2 text-xs">
          <div className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-2 font-semibold text-white">{lang === 'en' ? 'Open projects' : 'Projekte öffnen'}</div>
          <div className="rounded-full border border-white/20 px-3 py-2 font-semibold text-neutral-100">{lang === 'en' ? 'Go to editor' : 'Direkt zum Editor'}</div>
        </div>
      </div>
      <div className={`mt-4 grid gap-3 ${compact ? 'grid-cols-3' : 'md:grid-cols-3'}`}>
        {[
          lang === 'en' ? 'Projects' : 'Projekte',
          lang === 'en' ? 'Editor' : 'Editor',
          lang === 'en' ? 'Templates' : 'Vorlagen',
        ].map((item) => (
          <div key={item} className={`rounded-2xl border border-white/10 bg-neutral-900/80 text-center font-semibold text-neutral-100 ${compact ? 'p-2 text-[11px]' : 'p-4 text-sm'}`}>
            {item}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-900/80 p-3">
        <div className="text-sm font-semibold text-white">{lang === 'en' ? 'Recently edited' : 'Zuletzt bearbeitet'}</div>
        <div className="mt-3 space-y-2">
          {['Space Desk', 'Field Ops', 'Client Portal'].slice(0, compact ? 2 : 3).map((item, index) => (
            <div key={item} className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${index === 0 ? 'border-cyan-400/40 bg-cyan-500/5' : 'border-white/10 bg-transparent'}`}>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-base">{index === 0 ? 'S' : index === 1 ? 'F' : 'C'}</div>
              <div className="flex-1">
                <div className="font-medium text-white">{item}</div>
                <div className="text-xs text-neutral-400">08.03 • 12:48</div>
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300">{index === 0 ? (lang === 'en' ? 'Active' : 'Aktiv') : (lang === 'en' ? 'Continue' : 'Weiter')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditorMini({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#040816]/95 p-4 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">{lang === 'en' ? 'Visual Editor' : 'Visueller Editor'}</div>
          <div className="mt-1 text-sm font-semibold text-white">{lang === 'en' ? 'Blocks, canvas, properties' : 'Bausteine, Canvas, Eigenschaften'}</div>
        </div>
        <div className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/70">
          {lang === 'en' ? 'Preview' : 'Vorschau'}
        </div>
      </div>
      <div className={`mt-4 grid gap-3 ${compact ? 'grid-cols-[86px_minmax(0,1fr)_110px]' : 'lg:grid-cols-[160px_minmax(0,1fr)_180px]'}`}>
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
          {[
            lang === 'en' ? 'Blocks' : 'Bausteine',
            lang === 'en' ? 'Buttons' : 'Buttons',
            lang === 'en' ? 'Templates' : 'Vorlagen',
          ].map((item, index) => (
            <div key={item} className={`rounded-lg border px-2 py-2 text-center text-[11px] ${index === 0 ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100' : 'border-white/10 bg-white/5 text-neutral-300'}`}>
              {item}
            </div>
          ))}
          <div className="rounded-xl bg-black/20 px-3 py-2 text-[11px] text-neutral-300">Hero</div>
          <div className="rounded-xl bg-black/20 px-3 py-2 text-[11px] text-neutral-300">Chat</div>
          <div className="rounded-xl bg-black/20 px-3 py-2 text-[11px] text-neutral-300">CTA</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#070a13]/80 p-3 shadow-2xl">
          <div className="mb-3 flex items-center justify-between text-[11px] text-neutral-400">
            <span>{lang === 'en' ? 'Canvas' : 'Canvas'}</span>
            <span>100%</span>
          </div>
          <div className="mx-auto flex h-[220px] max-w-[150px] flex-col rounded-[28px] border border-white/10 bg-[#02050d] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-white/10" />
            <div className="mt-4 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-blue-500/10" />
            <div className="mt-3 h-2.5 w-2/3 rounded-full bg-white/20" />
            <div className="mt-2 h-2.5 w-1/2 rounded-full bg-white/10" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="h-12 rounded-xl bg-white/5" />
              <div className="h-12 rounded-xl bg-white/10" />
            </div>
            <div className="mt-3 h-8 rounded-xl bg-cyan-500/20" />
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="rounded-xl bg-black/20 px-3 py-2 text-[11px] font-semibold text-neutral-200">{lang === 'en' ? 'Properties' : 'Eigenschaften'}</div>
          <div className="h-9 rounded-xl bg-black/15" />
          <div className="h-16 rounded-2xl bg-black/10" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-10 rounded-xl bg-black/20" />
            <div className="h-10 rounded-xl bg-black/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PhonePreviewMini({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#06101d]/95 p-4 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">{lang === 'en' ? 'Preview' : 'Vorschau'}</div>
          <div className="mt-1 text-sm font-semibold text-white">{lang === 'en' ? 'Real mobile layout' : 'Echtes Mobile-Layout'}</div>
        </div>
        <div className="rounded-full bg-emerald-400/20 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-emerald-200">Live</div>
      </div>
      <div className={`mt-4 flex items-center ${compact ? 'gap-2' : 'gap-4'}`}>
        <div className={`mx-auto flex flex-col rounded-[28px] border border-white/10 bg-[#02050d] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] ${compact ? 'h-[160px] w-[92px]' : 'h-[220px] w-[126px]'}`}>
          <div className="mx-auto h-1.5 w-12 rounded-full bg-white/10" />
          <div className={`rounded-2xl bg-gradient-to-br from-cyan-500/25 to-blue-500/10 ${compact ? 'mt-3 h-10' : 'mt-4 h-16'}`} />
          <div className="mt-3 h-2.5 w-2/3 rounded-full bg-white/20" />
          <div className="mt-2 h-2.5 w-1/2 rounded-full bg-white/10" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className={`rounded-xl bg-white/5 ${compact ? 'h-8' : 'h-12'}`} />
            <div className={`rounded-xl bg-white/10 ${compact ? 'h-8' : 'h-12'}`} />
          </div>
          <div className={`mt-3 rounded-xl bg-cyan-500/20 ${compact ? 'h-6' : 'h-8'}`} />
        </div>
        <div className="flex-1 space-y-2">
          <div className="rounded-xl bg-black/20 px-3 py-2 text-xs text-neutral-300">{lang === 'en' ? 'Preview URL and QR code' : 'Preview-URL und QR-Code'}</div>
          <div className="rounded-xl bg-black/15 px-3 py-2 text-xs text-neutral-400">{lang === 'en' ? 'Open on your phone instantly' : 'Direkt auf dem Smartphone testen'}</div>
          {!compact && (
            <div className="grid grid-cols-2 gap-2">
              <div className="h-12 rounded-xl bg-black/20" />
              <div className="h-12 rounded-xl bg-black/10" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AIGeneratorMini({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#040816]/95 p-4 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">{lang === 'en' ? 'AI Generator' : 'KI-Generator'}</div>
          <div className="mt-1 text-sm font-semibold text-white">{lang === 'en' ? 'Prompt to app structure' : 'Prompt zur App-Struktur'}</div>
        </div>
        <div className="rounded-full bg-cyan-500/15 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-cyan-200">Live</div>
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">{lang === 'en' ? 'Prompt' : 'Eingabe'}</div>
        <div className="mt-2 rounded-2xl border border-cyan-400/20 bg-[#0b1731] px-4 py-3 text-sm leading-6 text-neutral-200">
          {lang === 'en'
            ? 'Build a mobile app for field technicians with tasks, time logs, photo uploads, and status updates.'
            : 'Erstelle eine mobile App für Servicetechniker mit Aufgaben, Zeiterfassung, Foto-Uploads und Status-Updates.'}
        </div>
      </div>
      <div className={`mt-4 grid gap-3 ${compact ? 'grid-cols-1' : 'sm:grid-cols-[1.1fr_0.9fr]'}`}>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">{lang === 'en' ? 'Generated pages' : 'Generierte Seiten'}</div>
          <div className="mt-3 space-y-2">
            {[
              lang === 'en' ? 'Dashboard' : 'Dashboard',
              lang === 'en' ? 'Task details' : 'Aufgabendetails',
              lang === 'en' ? 'Time tracking' : 'Zeiterfassung',
              lang === 'en' ? 'Media upload' : 'Medien-Upload',
            ].slice(0, compact ? 3 : 4).map((item) => (
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
  );
}

function WorkflowPreview({
  index,
  lang,
}: {
  index: number;
  lang: Lang;
}) {
  if (index === 0) {
    return <TemplateGalleryMini lang={lang} />;
  }

  if (index === 1) {
    return <AIGeneratorMini lang={lang} />;
  }

  return <EditorMini lang={lang} />;
}

function SpotlightVisual({ title, lang }: { title: string; lang: Lang }) {
  if (/Projekte|Control projects/i.test(title)) {
    return <DashboardMini lang={lang} compact />;
  }

  if (/KI|AI/i.test(title)) {
    return <AIGeneratorMini lang={lang} compact />;
  }

  if (/Visuell|Edit visually/i.test(title)) {
    return <EditorMini lang={lang} compact />;
  }

  return <PhonePreviewMini lang={lang} compact />;
}

function AiPromptVisual({ lang }: { lang: Lang }) {
  return <AIGeneratorMini lang={lang} />;
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
                              <SpotlightVisual title={item.title} lang={lang} />
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
                    <SpotlightVisual title={feature.title} lang={lang} />
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
                <AiPromptVisual lang={lang} />
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
