'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import de from '@/locales/de.json';
import en from '@/locales/en.json';

type Messages = Record<string, string>;
const MESSAGES: Record<string, Messages> = { de, en };

type I18nContextShape = {
  locale: string;
  setLocale: (l: string) => void;
  t: (k: string) => string;
};

const I18nContext = createContext<I18nContextShape>({
  locale: 'de',
  setLocale: () => {},
  t: (k: string) => k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>(() => {
    try {
      return (typeof window !== 'undefined' && localStorage.getItem('locale')) || 'de';
    } catch {
      return 'de';
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') localStorage.setItem('locale', locale);
    } catch {}
  }, [locale]);

  const setLocale = (l: string) => setLocaleState(l);

  const t = (key: string) => {
    const msg = MESSAGES[locale] && MESSAGES[locale][key];
    return msg ?? key;
  };

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}