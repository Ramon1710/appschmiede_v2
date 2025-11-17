'use client';

import Link from 'next/link';
import useAuth from '@/hooks/useAuth';
import LogoutButton from './LogoutButton';

export default function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="w-full flex items-center justify-between p-4 border-b border-neutral-800 bg-[#0b0b0f]/90 backdrop-blur-sm">
      <nav className="flex gap-4 items-center">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <img src="/logo.svg" alt="AppSchmiede" className="w-8 h-8" />
          <span>AppSchmiede</span>
        </Link>
        <Link href="/projects" className="hover:text-cyan-400 transition">Projekte</Link>
        <Link href="/editor" className="hover:text-cyan-400 transition">Editor</Link>
      </nav>

      <div className="flex items-center gap-3">
        {!loading && user ? (
          <>
            <div className="text-sm text-neutral-300">Hi, {user.displayName ?? user.email}</div>
            <LogoutButton />
          </>
        ) : (
          <nav className="flex gap-2">
            <Link href="/login" className="hover:text-cyan-400 transition">Login</Link>
            <Link href="/register" className="hover:text-cyan-400 transition">Registrieren</Link>
          </nav>
        )}
      </div>
    </header>
  );
}