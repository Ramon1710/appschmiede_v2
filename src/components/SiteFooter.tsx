import Link from 'next/link';
import PrivacySettingsButton from '@/components/PrivacySettingsButton';

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#050814]/95 px-6 py-8 text-sm text-neutral-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="text-base font-semibold text-white">AppSchmiede</p>
          <p className="leading-6 text-neutral-400">
            Bis Anfang 2027 sind Vorlagen, Projekte, Seiten und Funktionen für alle Nutzer kostenfrei. Analyse-Technologien werden nur nach Einwilligung verwendet.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <Link href="/impressum" className="transition hover:text-cyan-300">
            Impressum
          </Link>
          <Link href="/datenschutz" className="transition hover:text-cyan-300">
            Datenschutz
          </Link>
          <Link href="/agb" className="transition hover:text-cyan-300">
            AGB
          </Link>
          <Link href="/stripe-subscriptions" className="transition hover:text-cyan-300">
            Stripe-Subscriptions
          </Link>
          <Link href="/datenschutz/firebase" className="transition hover:text-cyan-300">
            Firebase-Hinweise
          </Link>
          <PrivacySettingsButton className="text-left transition hover:text-cyan-300">
            Datenschutzeinstellungen
          </PrivacySettingsButton>
        </div>
      </div>
    </footer>
  );
}