"use client";

import Link from 'next/link';
import Header from '@/components/Header';
import LegalModalTrigger from '@/components/LegalModalTrigger';

const highlights = [
  {
    title: 'In Minuten prototypen',
    description: 'Vorlagen auswählen, KI starten und Ergebnisse direkt auf dem Gerät testen.',
  },
  {
    title: 'Editor + KI aus einer Hand',
    description: 'Überall verfügbar: Projekte, Seiten, Assets und Teamfreigaben bleiben synchron.',
  },
  {
    title: 'Keine Agentur notwendig',
    description: 'Bring dein Team an einen Tisch und iteriere live – ohne Wartezeiten oder hohe Setup-Kosten.',
  },
];

const timeline = [
  {
    label: 'Schritt 1',
    title: 'Registrieren und Profil anlegen',
    description: 'Teammitglieder einladen und Rechte vergeben.',
  },
  {
    label: 'Schritt 2',
    title: 'Vorlagen + KI kombinieren',
    description: 'Login-Screens, Chats oder Supportseiten einbauen und mit KI erweitern.',
  },
  {
    label: 'Schritt 3',
    title: 'Teilen und testen',
    description: 'Per Vorschau-Links oder QR-Codes sofort Feedback ausrollen.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#03050a] text-white">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-10 lg:px-8">
        <aside className="hidden w-48 flex-shrink-0 flex-col gap-4 lg:flex">
          {[1, 2].map((index) => (
            <div
              key={index}
              className="flex h-56 flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 text-center text-xs text-neutral-200"
            >
                <Link
                  href="/login"
                  className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white/90 hover:bg-white/10"
                >
                  Bereits registriert? Login
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-neutral-300">{item.description}</p>
              </div>
            ))}
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#050914]/80 p-8">
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">So funktioniert es</p>
                <h2 className="text-3xl font-semibold">In drei Schritten zu deinem Prototypen</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {timeline.map((step) => (
                  <div key={step.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.35em] text-neutral-400">{step.label}</p>
                    <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm text-neutral-300">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h2 className="text-3xl font-semibold">Updates & Roadmap</h2>
                <p className="mt-3 text-sm text-neutral-300">
                  Wir liefern jede Woche neue Widgets, KI-Verbesserungen und Integrationen. In der Roadmap siehst du, woran wir arbeiten:
                  Stripe-Checkout, mehrsprachige Projekte, Team-Rollen und ausführliche Analytics.
                </p>
                <div className="mt-4 space-y-2 text-sm text-neutral-200">
                  <p>✓ Stripe-Zahlungsflüsse inklusive Rechnungsarchiv</p>
                  <p>✓ KI-Vorlagen für Branchen (Handwerk, Beratung, Gastro)</p>
                  <p>✓ Export in React Native & Web-Embeds</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#070b16] p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Live-Status</p>
                <ul className="mt-4 space-y-3 text-sm text-neutral-200">
                  <li>• 4 neue Templates diese Woche</li>
                  <li>• KI-Modelle für Chat + Location in Beta</li>
                  <li>• Hosting & Auth powered by Firebase</li>
                  <li>• DSGVO-konformes Logging mit Export</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        <aside className="hidden w-48 flex-shrink-0 flex-col gap-4 lg:flex">
          {[3, 4].map((index) => (
            <div
              key={index}
              className="flex h-56 flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-pink-500/10 to-rose-500/10 text-center text-xs text-neutral-200"
            >
              <p className="font-semibold">Werbefläche {index}</p>
              <p className="mt-1 text-[11px] text-neutral-400">Perfekt für deine Tools & Services</p>
            </div>
          ))}
        </aside>
      </main>

      <LegalModalTrigger className="fixed bottom-4 left-4" />
    </div>
  );
}
