'use client';

import Link from 'next/link';
import useAuth from '@/hooks/useAuth';
import LogoutButton from './LogoutButton';
import { useI18n } from './I18nProviderClient';

export default function Header() {
  const { user, loading } = useAuth();
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="container flex items-center justify-between p-6" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <div className="flex items-center gap-6">
        <div className="text-xl font-semibold">{t('app.title')}</div>
        <nav className="header-nav">
          <Link href="/projects">Projekte</Link>
          <Link href="/editor">Editor</Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button 
            className={`btn ${locale === 'de' ? 'btn-primary' : ''}`} 
            onClick={() => setLocale('de')}
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            DE
          </button>
          <button 
            className={`btn ${locale === 'en' ? 'btn-primary' : ''}`} 
            onClick={() => setLocale('en')}
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            EN
          </button>
        </div>

        {!loading && user ? (
          <>
            <div className="text-sm text-muted">Hi, {user.displayName ?? user.email}</div>
            <LogoutButton />
          </>
        ) : (
          <div className="flex gap-3">
            <Link href="/login" className="btn">{t('btn.login')}</Link>
            <Link href="/register" className="btn btn-primary">{t('btn.register')}</Link>
          </div>
        )}
      </div>
    </header>
  );
}