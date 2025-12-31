// src/lib/i18n.tsx
'use client';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { dict, Lang } from './i18n-dict';

type Ctx = {
  lang: Lang;
  t: (key: keyof typeof dict['de']) => string;
  setLang: (l: Lang) => void;
};

const I18nCtx = createContext<Ctx | null>(null);

function readCookieLang(): Lang | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
  const value = match ? decodeURIComponent(match[1]) : null;
  if (value === 'de' || value === 'en') return value;
  return null;
}

function writeCookieLang(lang: Lang) {
  if (typeof document === 'undefined') return;
  const maxAgeSeconds = 60 * 60 * 24 * 365; // 1 year
  document.cookie = `lang=${encodeURIComponent(lang)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

export function I18nProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLang] = useState<Lang>(initialLang && dict[initialLang] ? initialLang : 'de');

  useEffect(() => {
    const fromLocalStorage = (typeof window !== 'undefined' && (localStorage.getItem('lang') as Lang)) || null;
    const fromCookie = readCookieLang();
    const saved = (fromLocalStorage && dict[fromLocalStorage] ? fromLocalStorage : null) ?? fromCookie;
    if (saved && dict[saved]) setLang(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('lang', lang);
    writeCookieLang(lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.body.setAttribute('data-lang', lang);
    }
  }, [lang]);

  const t = useMemo(() => (key: keyof typeof dict['de']) => dict[lang][key], [lang]);

  return <I18nCtx.Provider value={{ lang, t, setLang }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}
