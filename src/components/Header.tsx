'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import useAuth from '@/hooks/useAuth';
import LogoutButton from './LogoutButton';

export default function Header() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#0b0b0f]/95 backdrop-blur-md shadow-lg">
      <nav className="flex gap-6 items-center">
        <Link href="/" className="relative flex items-center gap-4 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-500 blur-lg opacity-40 group-hover:opacity-70 transition" />
            <Image src="/logo.svg" alt="AppSchmiede" className="relative z-10 drop-shadow-lg" width={64} height={64} priority />
          </div>
          <div className="leading-tight">
            <span className="text-2xl font-bold tracking-tight text-white group-hover:text-cyan-200 transition">AppSchmiede</span>
            <span className="block text-xs uppercase tracking-[0.35em] text-cyan-400/80">AI App Builder</span>
          </div>
        </Link>
        <Link href="/dashboard" className="hover:text-cyan-400 transition text-sm uppercase tracking-wide">Dashboard</Link>
        <Link href="/projects" className="hover:text-cyan-400 transition text-sm uppercase tracking-wide">Projekte</Link>
        <Link href="/editor" className="hover:text-cyan-400 transition text-sm uppercase tracking-wide">Editor</Link>
      </nav>

      <div className="flex items-center gap-3 text-sm">
        {!loading && user ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20 transition"
            >
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-fuchsia-500 text-white text-sm font-semibold">
                {(user.displayName ?? user.email ?? 'U').slice(0, 1).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-neutral-200">{user.displayName ?? user.email}</span>
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#10101a] p-3 shadow-2xl">
                <div className="px-2 pb-2 text-xs uppercase tracking-widest text-neutral-500">Konto</div>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/10 transition"
                  onClick={() => setOpen(false)}
                >
                  Persönliche Daten
                </Link>
                <div className="mt-2 border-t border-white/10 pt-2">
                  <LogoutButton />
                </div>
              </div>
            )}
          </div>
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