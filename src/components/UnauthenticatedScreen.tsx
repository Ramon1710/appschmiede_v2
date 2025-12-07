'use client';

import Link from 'next/link';
import Header from './Header';

type UnauthenticatedScreenProps = {
  badge?: string;
  title?: string;
  description?: string;
};

const defaultDescription =
  'Der Zugriff erfordert ein Konto. Melde dich an, um deine Projekte zu laden, neue Apps zu erstellen oder Vorlagen zu nutzen.';

export default function UnauthenticatedScreen({
  badge,
  title = 'Bitte anmelden',
  description = defaultDescription,
}: UnauthenticatedScreenProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#05070e] text-white">
      <Header />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="space-y-4">
          {badge ? <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">{badge}</p> : null}
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
          <p className="text-base text-neutral-200">{description}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <Link
            href="/login"
            className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:from-cyan-400 hover:to-blue-400"
          >
            Zum Login
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white/90 hover:bg-white/10"
          >
            Noch kein Konto? Registrieren
          </Link>
        </div>
      </div>
    </div>
  );
}
