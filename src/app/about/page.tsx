import Link from 'next/link';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import type { Lang } from '@/lib/i18n-dict';

export const metadata: Metadata = {
  title: 'Über AppSchmiede',
  description:
    'Hintergrund, Zielgruppe und Arbeitsweise von AppSchmiede: Wie aus Ideen testbare App-Prototypen im Browser werden.',
};

export default async function AboutPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('lang')?.value;
  const lang: Lang = raw === 'en' ? 'en' : 'de';
  const tr = (de: string, en: string) => (lang === 'en' ? en : de);

  const principles = [
    {
      title: tr('Schnell zu einem testbaren Ergebnis', 'Fast path to something testable'),
      description: tr(
        'AppSchmiede ist dafür gebaut, Ideen sichtbar zu machen, bevor ein großes Entwicklungsbudget gebunden wird. Der Fokus liegt auf realen Screens, klickbaren Flows und klaren Entscheidungen im Team.',
        'AppSchmiede is built to make ideas visible before a large engineering budget is committed. The focus is on real screens, clickable flows, and better decision-making inside teams.'
      ),
    },
    {
      title: tr('Visuelles Arbeiten statt Tool-Wechsel', 'Visual work instead of tool switching'),
      description: tr(
        'Projektanlage, Vorlagen, Seitenstruktur, Editor und Vorschau greifen ineinander. Dadurch müssen Teams nicht zwischen Whiteboard, Mockup-Tool, Spreadsheet und Präsentation springen.',
        'Projects, templates, page structure, editor, and preview fit into one workflow. Teams do not have to bounce between whiteboards, mockup tools, spreadsheets, and presentation decks.'
      ),
    },
    {
      title: tr('KI als Beschleuniger, nicht als Blackbox', 'AI as an accelerator, not a black box'),
      description: tr(
        'Die KI soll den Start erleichtern, aber nicht Entscheidungen verstecken. Inhalte, Strukturen und Layouts bleiben nachvollziehbar und können im Editor direkt verändert werden.',
        'AI is meant to speed up the start, not hide decisions. Content, structures, and layouts stay understandable and can be changed directly in the editor.'
      ),
    },
  ];

  const scenarios = [
    tr('Interne Tools für Teams im Büro oder Außendienst', 'Internal tools for office and field teams'),
    tr('Demo-Apps für Agenturen, Sales-Gespräche und Workshops', 'Demo apps for agencies, sales conversations, and workshops'),
    tr('MVPs für neue Services, Plattformideen oder Kundenportale', 'MVPs for new services, platform ideas, or client portals'),
    tr('Digitale Prozesse wie Support, Zeiterfassung, Aufgaben oder Freigaben', 'Digital workflows such as support, time tracking, tasks, or approvals'),
  ];

  return (
    <div className="min-h-screen bg-[#03050a] text-white">
      <Header />
      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-12 lg:px-10">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#041634] via-[#050c1c] to-[#03050a] p-8 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">{tr('Über uns', 'About')}</p>
          <h1 className="mt-3 text-4xl font-semibold">{tr('Was AppSchmiede leisten soll', 'What AppSchmiede is built to do')}</h1>
          <p className="mt-5 max-w-4xl text-base leading-7 text-neutral-200">
            {tr(
              'AppSchmiede ist eine browserbasierte Arbeitsumgebung für Teams, die App-Ideen, interne Werkzeuge oder klickbare MVPs deutlich schneller testen möchten. Statt monatelang Konzepte zu diskutieren, wird in kurzer Zeit etwas Sichtbares gebaut, intern geteilt und anhand von echtem Feedback verbessert.',
              'AppSchmiede is a browser-based workspace for teams that want to test app ideas, internal tools, or clickable MVPs much faster. Instead of discussing concepts for months, teams build something visible quickly, share it internally, and improve it based on real feedback.'
            )}
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {principles.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-300">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#050914]/90 p-8 shadow-lg">
          <h2 className="text-3xl font-semibold">{tr('Typische Einsatzszenarien', 'Typical scenarios')}</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {scenarios.map((scenario) => (
              <li key={scenario} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-neutral-200">
                {scenario}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg">
          <h2 className="text-3xl font-semibold">{tr('Transparenz und Kontakt', 'Transparency and contact')}</h2>
          <p className="mt-4 text-base leading-7 text-neutral-300">
            {tr(
              'Die Plattform richtet sich an reale Arbeitsprozesse und soll verständlich erklären, was sie kann und was nicht. Impressum und Datenschutz sind öffentlich erreichbar. Für Rückfragen oder Kooperationsanfragen steht eine direkte Kontaktmöglichkeit bereit.',
              'The platform is built around real workflows and should explain clearly what it can and cannot do. Imprint and privacy information are publicly available, and direct contact is possible for questions or partnerships.'
            )}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/impressum" className="rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-cyan-400/60 hover:text-cyan-200">
              {tr('Impressum', 'Imprint')}
            </Link>
            <Link href="/datenschutz" className="rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-cyan-400/60 hover:text-cyan-200">
              {tr('Datenschutz', 'Privacy policy')}
            </Link>
            <a href="mailto:ramon.meyer@hotmail.de" className="rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-cyan-400/60 hover:text-cyan-200">
              {tr('Kontakt per E-Mail', 'Contact by email')}
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}