'use client';

import Link from 'next/link';
import useAuth from '@/hooks/useAuth';
import LogoutButton from './LogoutButton';

export default function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#0b0b0f]/95 backdrop-blur-md shadow-lg">
      <nav className="flex gap-6 items-center">
        <Link href="/" className="relative flex items-center gap-4 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-500 blur-lg opacity-40 group-hover:opacity-70 transition" />
            <img src="/logo.svg" alt="AppSchmiede" className="relative z-10 w-12 h-12 drop-shadow-lg" />
          </div>
          <div className="leading-tight">
            <span className="text-2xl font-bold tracking-tight text-white group-hover:text-cyan-200 transition">AppSchmiede</span>
            <span className="block text-xs uppercase tracking-[0.35em] text-cyan-400/80">AI App Builder</span>
          </div>
        </Link>
        <Link href="/projects" className="hover:text-cyan-400 transition text-sm uppercase tracking-wide">Projekte</Link>
        <Link href="/editor" className="hover:text-cyan-400 transition text-sm uppercase tracking-wide">Editor</Link>
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