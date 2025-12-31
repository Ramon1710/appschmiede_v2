'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import useAuth from '@/hooks/useAuth';
import useUserProfile from '@/hooks/useUserProfile';
import { subscribeProjects } from '@/lib/db-projects';
import LogoutButton from './LogoutButton';
import { useI18n } from '@/lib/i18n';

export default function Header() {
  const { user, loading } = useAuth();
  const { profile } = useUserProfile(user?.uid);
  const { t, lang, setLang } = useI18n();
  const coinsValue = profile?.coinsBalance;
  const formattedCoins =
    typeof coinsValue === 'number'
      ? coinsValue >= Number.MAX_SAFE_INTEGER
        ? '∞'
        : coinsValue.toLocaleString('de-DE')
      : null;
  const [open, setOpen] = useState(false);
  const [hasProjects, setHasProjects] = useState(true);
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

  useEffect(() => {
    if (!user?.uid) {
      setHasProjects(true);
      return undefined;
    }
    const unsubscribe = subscribeProjects(user.uid, (projects) => {
      setHasProjects(projects.length > 0);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const editorDisabled = Boolean(user) && !hasProjects;

  return (
    <header className="relative z-40 w-full flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#0b0b0f]/95 backdrop-blur-md shadow-lg">
      <nav className="flex gap-6 items-center">
        <Link href="/" className="relative flex items-center gap-4 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-500 blur-lg opacity-40 group-hover:opacity-70 transition" />
            <Image src="/logo.png" alt="AppSchmiede" className="relative z-10 drop-shadow-lg" width={64} height={64} priority />
          </div>
          <div className="leading-tight">
            <span className="text-2xl font-bold tracking-tight text-white group-hover:text-cyan-200 transition">AppSchmiede</span>
            <span className="block text-xs uppercase tracking-[0.35em] text-cyan-400/80">AI App Builder</span>
          </div>
        </Link>
        <Link href="/" className="hover:text-cyan-400 transition text-sm uppercase tracking-wide">{t('nav_home')}</Link>
        <Link href="/dashboard" className="hover:text-cyan-400 transition text-sm uppercase tracking-wide">{t('nav_dashboard')}</Link>
        <Link href="/projects" className="hover:text-cyan-400 transition text-sm uppercase tracking-wide">{t('nav_projects')}</Link>
        <Link
          href="/editor"
          aria-disabled={editorDisabled}
          tabIndex={editorDisabled ? -1 : undefined}
          onClick={(event) => {
            if (editorDisabled) {
              event.preventDefault();
            }
          }}
          className={`hover:text-cyan-400 transition text-sm uppercase tracking-wide ${
            editorDisabled ? 'cursor-not-allowed text-neutral-500 opacity-60 hover:text-neutral-500' : ''
          }`}
          title={editorDisabled ? 'Lege zuerst ein Projekt an, bevor du den Editor öffnest.' : undefined}
        >
          {t('nav_editor')}
        </Link>
        <Link href="/tools/gewerke" className="hover:text-cyan-400 transition text-sm uppercase tracking-wide">{t('nav_trades')}</Link>
        <Link href="/tools/templates" className="hover:text-cyan-400 transition text-sm uppercase tracking-wide">{t('nav_templates')}</Link>
        <Link href="/#preise" className="hover:text-cyan-400 transition text-sm uppercase tracking-wide">{t('nav_pricing')}</Link>
        <Link href="/tools/billing" className="hover:text-cyan-400 transition text-sm uppercase tracking-wide">{t('nav_coins')}</Link>
      </nav>

      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white shadow">
          <button
            type="button"
            aria-label={t('lang_de')}
            onClick={() => setLang('de')}
            className={`flex items-center gap-1 rounded-full px-2 py-1 transition ${
              lang === 'de' ? 'bg-white/20 text-white' : 'text-neutral-200 hover:bg-white/10'
            }`}
          >
            <span role="img" aria-hidden="true">🇩🇪</span>
            <span className="hidden sm:inline">DE</span>
          </button>
          <button
            type="button"
            aria-label={t('lang_en')}
            onClick={() => setLang('en')}
            className={`flex items-center gap-1 rounded-full px-2 py-1 transition ${
              lang === 'en' ? 'bg-white/20 text-white' : 'text-neutral-200 hover:bg-white/10'
            }`}
          >
            <span role="img" aria-hidden="true">🇺🇸</span>
            <span className="hidden sm:inline">EN</span>
          </button>
        </div>
        {profile && formattedCoins && (
          <Link
            href="/tools/billing"
            className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white transition hover:border-cyan-400/50 hover:bg-white/10"
          >
            <span className="text-[10px] uppercase tracking-[0.35em] text-neutral-300">{t('coins_label')}</span>
            <span className="text-sm font-semibold">{formattedCoins}</span>
            <span className="text-[11px] text-cyan-300">{t('coins_topup')}</span>
          </Link>
        )}
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
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#10101a] p-3 shadow-2xl z-50">
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
            <Link href="/login" className="hover:text-cyan-400 transition">{t('nav_login')}</Link>
            <Link href="/register" className="hover:text-cyan-400 transition">{t('nav_register')}</Link>
          </nav>
        )}
      </div>
    </header>
  );
}