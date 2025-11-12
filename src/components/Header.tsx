'use client';

import Link from 'next/link';
import useAuth from '@/hooks/useAuth';
import LogoutButton from './LogoutButton';
import { useI18n } from './I18nProviderClient';

export default function Header() {
  const { user, loading } = useAuth();
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="container flex items-center justify-between py-4">
      <div className="flex items-center gap-6">
        <div className="text-xl font-semibold">{t('app.title')}</div>
        <nav className="header-nav">
          <Link href="/preview">{t('nav.preview')}</Link>
          <Link href="/editor">{t('nav.editor')}</Link>
          <Link href="/impressum">{t('nav.imprint')}</Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex gap-1">
          <button className={`btn ${locale === 'de' ? 'opacity-90' : ''}`} onClick={() => setLocale('de')}>DE</button>
          <button className={`btn ${locale === 'en' ? 'opacity-90' : ''}`} onClick={() => setLocale('en')}>EN</button>
        </div>

        {!loading && user ? (
          <>
            <div className="kicker">{t('header.signedInAs')}</div>
            <div className="text-sm">{user.displayName ?? user.email}</div>
            <LogoutButton />
          </>
        ) : (
          <nav className="flex gap-3">
            <Link href="/login" className="btn">{t('btn.login')}</Link>
            <Link href="/register" className="btn">{t('btn.register')}</Link>
          </nav>
        )}
      </div>
    </header>
  );
}