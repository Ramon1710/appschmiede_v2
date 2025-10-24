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

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('de');

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && (localStorage.getItem('lang') as Lang)) || null;
    if (saved && dict[saved]) setLang(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('lang', lang);
  }, [lang]);

  const t = useMemo(() => (key: keyof typeof dict['de']) => dict[lang][key], [lang]);

  return <I18nCtx.Provider value={{ lang, t, setLang }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}
