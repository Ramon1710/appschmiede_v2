'use client';

import Link from 'next/link';
import useAuth from '@/hooks/useAuth';
import LogoutButton from './LogoutButton';

export default function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="w-full flex items-center justify-between p-4 border-b border-neutral-800">
      <nav className="flex gap-4 items-center">
        <Link href="/" className="font-bold">Appschmiede</Link>
        <Link href="/projects">Projekte</Link>
        <Link href="/editor">Editor</Link>
      </nav>

      <div className="flex items-center gap-3">
        {!loading && user ? (
          <>
            <div className="text-sm text-neutral-300">Hi, {user.displayName ?? user.email}</div>
            <LogoutButton />
          </>
        ) : (
          <nav className="flex gap-2">
            <Link href="/login">Login</Link>
            <Link href="/register">Registrieren</Link>
          </nav>
        )}
      </div>
    </header>
  );
}