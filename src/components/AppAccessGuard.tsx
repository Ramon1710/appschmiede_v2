'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useEffect, useState, type ReactNode } from 'react';
import { auth } from '@/lib/firebase';

const protectedPrefixes = [
  '/dashboard',
  '/projects',
  '/editor',
  '/profile',
  '/preview',
  '/tools',
  '/wizard',
];

type AccessState = 'checking' | 'allowed' | 'denied';
type PathAccess = { pathname: string; state: AccessState };

function requiresAppAccess(pathname: string): boolean {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function AppAccessGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const [access, setAccess] = useState<PathAccess>({ pathname: '', state: 'checking' });
  const [hasAuthUser, setHasAuthUser] = useState(false);

  useEffect(() => {
    if (!requiresAppAccess(pathname)) return undefined;
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      setHasAuthUser(Boolean(user));
      if (!user) {
        setAccess({ pathname, state: 'denied' });
        return;
      }

      setAccess({ pathname, state: 'checking' });
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/access/status', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (active) setAccess({ pathname, state: response.ok ? 'allowed' : 'denied' });
      } catch {
        if (active) setAccess({ pathname, state: 'denied' });
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [pathname]);

  const currentAccess = access.pathname === pathname ? access.state : 'checking';
  if (!requiresAppAccess(pathname) || currentAccess === 'allowed') return children;

  if (currentAccess === 'checking') {
    return (
      <main className="grid min-h-[50vh] place-items-center bg-neutral-950 px-6 text-neutral-300">
        Zugang wird geprüft …
      </main>
    );
  }

  return (
    <main className="grid min-h-[70vh] place-items-center bg-neutral-950 px-6 text-center text-neutral-100">
      <section className="max-w-lg space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">AppSchmiede</p>
        <h1 className="text-2xl font-semibold">Zugang nur mit persönlicher Einladung</h1>
        <p className="text-sm leading-6 text-neutral-300">
          Für diesen Bereich ist ein Konto mit aktiver Freigabe für Headbang Handwerk erforderlich.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {hasAuthUser ? (
            <button
              type="button"
              onClick={() => void signOut(auth)}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-950 hover:bg-neutral-200"
            >
              Abmelden
            </button>
          ) : null}
          <Link href="/login" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10">
            Zum Login
          </Link>
        </div>
      </section>
    </main>
  );
}
