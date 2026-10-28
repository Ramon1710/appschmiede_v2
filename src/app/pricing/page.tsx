import Link from 'next/link';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Kostenlose Nutzung',
  description: 'AppSchmiede ist einschließlich KI für freigeschaltete Mitglieder und Partner von Headbang Handwerk e. V. kostenlos.',
};

export default async function PricingPage() {
  const lang = (await cookies()).get('lang')?.value === 'en' ? 'en' : 'de';
  const tr = (de: string, en: string) => (lang === 'en' ? en : de);
  const features = [
    tr('Projekte und Seiten verwalten', 'Manage projects and pages'),
    tr('Visueller Editor, Bausteine und fertige Buttons', 'Visual editor, blocks and ready-made buttons'),
    tr('Vorlagen und KI-gestützte Funktionen', 'Templates and AI-assisted features'),
    tr('Vorschau, QR-Werkzeuge und verfügbare Exporte', 'Preview, QR tools and available exports'),
  ];

  return (
    <div className="min-h-screen bg-[#03050a] text-white">
      <Header />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12 lg:px-10">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#041634] via-[#050c1c] to-[#03050a] p-6 shadow-2xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Headbang Handwerk e. V.</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            {tr('Kostenlose Nutzung für Mitglieder und Partner', 'Free access for members and partners')}
          </h1>
          <p className="mt-5 text-base leading-7 text-neutral-200">
            {tr(
              'Die AppSchmiede ist für autorisierte Mitglieder und Partner vollständig kostenlos, einschließlich KI-Funktionen. Es gibt keine nutzerseitige Coin-Abrechnung, keine kostenpflichtigen App-Tarife und keine automatischen kostenpflichtigen Verlängerungen.',
              'AppSchmiede is completely free of charge for authorized members and partners, including AI features. There is no user-facing coin billing, no paid app plan and no automatic paid renewal.'
            )}
          </p>
          <p className="mt-4 text-sm leading-6 text-neutral-300">
            {tr(
              'Der Zugang erfolgt ausschließlich über eine persönliche Einladung. Eine öffentliche Registrierung ist nicht vorgesehen. Vorhandene historische Zahlungsfragen werden unabhängig davon mit dem Verein geklärt.',
              'Access is available by personal invitation only. Public registration is not offered. Any historical payment questions must be resolved separately with the association.'
            )}
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-200">{feature}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-[#050c1c] transition hover:bg-neutral-200">
              {tr('Bereits eingeladen? Jetzt anmelden', 'Already invited? Sign in')}
            </Link>
            <Link href="/agb" className="rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold transition hover:bg-white/10">
              {tr('Nutzungsbedingungen', 'Terms of use')}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
