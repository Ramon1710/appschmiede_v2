'use client';

import React from 'react';
import { I18nProvider } from '@/lib/i18n';
import { Lang } from '@/lib/i18n-dict';

export default function I18nRoot({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  return <I18nProvider initialLang={initialLang}>{children}</I18nProvider>;
}
