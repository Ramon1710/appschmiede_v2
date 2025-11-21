"use client";

import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import LegalModalTrigger from '@/components/LegalModalTrigger';

const workflowSteps = [
  {
    title: 'Template auswählen',
    description:
      'Starte mit einer Vorlage für dein Use-Case: Support-Chat, Aufgabenverwaltung, Zeiterfassung, Analytics, Dokumentation und mehr. Ein Klick – und dein erstes Projekt ist angelegt.',
  },
  {
    title: 'Mit KI erweitern',
    description:
      'Beschreibe in eigenen Worten, was deine App können soll. Die KI legt passende Seiten, Abschnitte und Inhalte an – inklusive Farben, Layouts und Strukturen, die zu deinem Projekt passen.',
  },
  {
    title: 'Im Editor anpassen & testen',
    description:
      'Feinschliff machst du im visuellen Editor: Texte, Buttons, Abschnitte, Layout – alles per Drag & Drop. Mit QR-Code öffnest du deine App direkt auf dem Smartphone und testest sie live.',
  },
];

const featureList = [
  {
    title: 'Projekt-Dashboard',
    description:
      'Verwalte alle deine App-Projekte an einem Ort, filtere nach Status und öffne jede App mit einem Klick im Editor.',
  },
  {
    title: 'Visueller Editor',
    description:
      'Bearbeite Seiten im Phone-Frame, verschiebe Elemente per Drag & Drop, passe Eigenschaften im Property-Panel an und wechsle schnell zwischen Seiten.',
  },
  {
    title: 'KI-gestützte Seitenerstellung',
    description:
      'Lass aus einer einfachen Beschreibung komplette App-Strukturen generieren: Startseiten, Sektionen, CTAs, Tools – abgestimmt auf deine Branche.',
  },
  {
    title: 'Spezielle Tool-Seiten',
    description:
      'Greife auf fertige Bausteine zu: Chat-Support, Aufgabenverwaltung, Zeiterfassung, Analytics-Dashboard, Support-Doku, QR-Tools und mehr.',
  },
  {
    title: 'Öffentliche Vorschau & QR-Code',
    description:
      'Teile deine App über eine Vorschau-URL oder QR-Code. Ideal, um Feedback von Team, Kund:innen oder Tester:innen einzuholen.',
  },
  {
    title: 'Abrechnung & Billing-Bereich',
    description:
      'Upgrade dein Konto, wenn du mehr brauchst: Integriertes Billing mit Stripe, klar getrennte Projekte und jederzeit erweiterbar.',
  },
  {
    title: 'Rechtlich sauber unterwegs',
    description:
      'Impressum, Datenschutz und Legal-Modal sind eingebaut – so kannst du deine App professionell präsentieren und bleibst auf der sicheren Seite.',
  },
];

const audience = [
  {
    title: 'Gründer:innen & Solo-Selbstständige',
    description:
      'Baue in wenigen Stunden einen klickbaren Prototypen für dein Produkt, teste dein Angebot mit echten Nutzer:innen und überzeuge Investor:innen oder Partner.',
  },
  {
    title: 'Agenturen & Freelancer',
    description:
      'Erstelle Demo-Apps für Kund:innen, präsentiere Varianten im Browser und passe Layouts live im Gespräch an – ohne jedes Mal bei null anzufangen.',
  },
  {
    title: 'Unternehmen & Teams',
    description:
      'Setze interne Tools wie Zeiterfassung, Aufgabenboards, Support-Apps oder Dashboards um, ohne deine IT-Abteilung zu blockieren.',
  },
];

const kiHighlights = [
  'Erkennt Branche, Farben & Stil automatisch',
  'Generiert mehrere Seiten auf einmal',
  'Ideal für erste Versionen, Pitches und interne Tools',
];

const reasons = [
  {
    title: 'Schneller Start statt leere Leinwand',
    description:
      'Templates und Tool-Seiten geben dir Struktur, bevor du überhaupt eine Zeile Text geschrieben hast.',
  },
  {
    title: 'Alles in einer Plattform',
    description:
      'Vom Projektmanagement über den Editor bis zur Vorschau: Du musst nicht zwischen fünf Tools springen.',
  },
  {
    title: 'Echte Apps testen, nicht nur Konzepte',
    description:
      'Teile deine Vorschau mit Kund:innen oder Kolleg:innen – per Link oder QR-Code – und sammle Feedback, bevor du groß investierst.',
  },
  {
    title: 'Skalierbar durch Abos & Funktionen',
    description:
      'Starte klein, erweitere bei Bedarf – ohne den Überblick über deine Projekte zu verlieren.',
  },
];

const adSlotsLeft = [
  {
    title: 'Partner-Spot 01',
    description: 'Zeig dein Lieblings-Plugin für Prototyping und sichere dir Leads direkt im Editor.',
    gradient: 'from-cyan-500/30 to-blue-600/20',
  },
  {
    title: 'Early-Bird Deal',
    description: '20 % Rabatt auf Illustrationen & Mockups von Studio Forma – nur diese Woche.',
    gradient: 'from-purple-500/30 to-indigo-500/10',
  },
];

const adSlotsRight = [
  {
    title: 'KI-Workshop',
    description: 'Live-Session: Konzepte in 60 Minuten zur klickbaren App. Jetzt Platz sichern.',
    gradient: 'from-emerald-500/20 to-cyan-500/20',
  },
  {
    title: 'Template-Marktplatz',
    description: 'Verkaufe deine App-Schablonen direkt in der AppSchmiede Community.',
    gradient: 'from-rose-500/20 to-orange-500/20',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#03050a] text-white">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 lg:px-0">
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[220px_minmax(0,1fr)_220px]">
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              {adSlotsLeft.map((ad) => (
                <div
                  key={ad.title}
                  className={`rounded-2xl border border-white/10 bg-gradient-to-br ${ad.gradient} p-4 text-sm text-white shadow-lg`}
                >
                  <p className="text-xs uppercase tracking-[0.35em] text-white/70">Anzeige</p>
                  <h3 className="mt-2 text-lg font-semibold">{ad.title}</h3>
                  <p className="mt-2 text-white/80">{ad.description}</p>
                </div>
              ))}
            </div>
          </aside>

          <div className="flex flex-col gap-12">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#041634] via-[#050c1c] to-[#03050a] p-10 shadow-2xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
            <div className="flex-1 text-center lg:text-left">
              <p className="text-sm uppercase tracking-[0.45em] text-cyan-300">No-Code Builder</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
                Von der Idee zur App in wenigen Minuten
              </h1>
              <p className="mt-5 text-lg text-neutral-200">
                Melde dich an, wähle ein Template, lass dir von der KI helfen und passe alles im Editor an – direkt im Browser und ohne Vorkenntnisse. So testest du deine App-Ideen schneller als je zuvor.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  href="/register"
                  className="w-full rounded-full bg-white px-6 py-3 text-center text-base font-semibold text-[#050c1c] transition hover:bg-neutral-200 sm:w-auto"
                >
                  Jetzt kostenlos starten
                </Link>
                <Link
                  href="/projects"
                  className="w-full rounded-full border border-white/30 px-6 py-3 text-center text-base font-semibold text-white transition hover:border-white hover:text-white sm:w-auto"
                >
                  Beispiele ansehen
                </Link>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <div className="relative h-56 w-56 sm:h-64 sm:w-64">
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-cyan-500 via-blue-500 to-fuchsia-600 blur-2xl opacity-40" />
                <div className="relative flex h-full w-full items-center justify-center rounded-[32px] border border-white/15 bg-black/20 backdrop-blur">
                  <Image src="/logo.png" alt="AppSchmiede Logo" width={220} height={220} priority className="drop-shadow-2xl" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#050914]/90 p-8 shadow-lg">
          <header className="space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Ablauf</p>
            <h2 className="text-3xl font-semibold">So funktioniert die AppSchmiede</h2>
            <p className="text-base text-neutral-300">
              AppSchmiede ist deine Werkbank für digitale Produkte. Statt monatelang zu planen, baust du in wenigen Schritten eine funktionsfähige App,
              testest sie mit deinem Team oder Kund:innen und entscheidest dann, wie es weitergeht.
            </p>
          </header>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-400">Schritt {index + 1}</span>
                <h3 className="mt-3 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm text-neutral-300">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg">
          <header className="space-y-3 text-center">
            <h2 className="text-3xl font-semibold">Alles, was du zum App-Bau brauchst – in einer Oberfläche</h2>
            <p className="text-base text-neutral-300">
              AppSchmiede bündelt alle Schritte, die du für moderne Web-Apps brauchst – von der Idee bis zur Vorschau auf dem Handy.
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
            <h2 className="text-3xl font-semibold">Für Gründer:innen, Agenturen und Teams, die schneller testen wollen</h2>
            <p className="text-base text-neutral-300">
              AppSchmiede richtet sich an alle, die digitale Ideen nicht nur auf Papier, sondern direkt vor Augen sehen wollen.
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
              <h2 className="text-3xl font-semibold">KI an deiner Seite – kein Code notwendig</h2>
              <p className="mt-4 text-base text-neutral-300">
                Statt pixelgenauen Wireframes und komplizierten Tickets beschreibst du einfach, was du brauchst: „Eine App zur Zeiterfassung für mein Team,
                mit Projektübersicht, Stundenerfassung und Auswertung.“ Die KI erstellt dir die passende Struktur, Seiten und Bausteine. Du entscheidest,
                was bleibt – den Rest passt du im Editor an.
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
            <h2 className="text-3xl font-semibold">Warum du deine nächste App in der AppSchmiede bauen solltest</h2>
            <p className="text-base text-neutral-300">
              Weil du keine Zeit für endlose Abstimmungen, Lastenhefte und Warteschlangen in der IT hast.
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

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1731] via-[#050c1c] to-[#03050a] p-8 text-center shadow-2xl">
          <h2 className="text-3xl font-semibold">Bereit, deine erste App zu schmieden?</h2>
          <p className="mx-auto mt-4 max-w-3xl text-base text-neutral-200">
            Lege heute dein erstes Projekt an und erlebe, wie sich deine Idee innerhalb weniger Minuten in eine klickbare App verwandelt. Du kannst jederzeit klein anfangen – und wachsen, wenn deine Anforderungen steigen.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="w-full rounded-full bg-white px-6 py-3 text-center text-base font-semibold text-[#050c1c] transition hover:bg-neutral-200 sm:w-auto"
            >
              Jetzt kostenlos registrieren
            </Link>
            <Link
              href="/projects"
              className="w-full rounded-full border border-white/30 px-6 py-3 text-center text-base font-semibold text-white transition hover:border-white hover:text-white sm:w-auto"
            >
              Projekt anlegen und loslegen
            </Link>
          </div>
        </section>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              {adSlotsRight.map((ad) => (
                <div
                  key={ad.title}
                  className={`rounded-2xl border border-white/10 bg-gradient-to-br ${ad.gradient} p-4 text-sm text-white shadow-lg`}
                >
                  <p className="text-xs uppercase tracking-[0.35em] text-white/70">Anzeige</p>
                  <h3 className="mt-2 text-lg font-semibold">{ad.title}</h3>
                  <p className="mt-2 text-white/80">{ad.description}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>

      <LegalModalTrigger className="fixed bottom-4 left-4" />
    </div>
  );
}
