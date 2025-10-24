// src/app/tools/i18n-demo/page.tsx
'use client';
import { I18nProvider, useI18n } from '@/lib/i18n';

function Inner() {
  const { t, lang, setLang } = useI18n();
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 space-y-3">
      <div className="text-2xl font-semibold">{t('welcome')}</div>
      <div className="opacity-80">{t('hello')} – Lang: <span className="font-mono">{lang}</span></div>
      <button
        onClick={() => setLang(lang === 'de' ? 'en' : 'de')}
        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
      >
        {t('toggle_lang')}
      </button>
    </div>
  );
}

export default function I18nDemoPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 grid place-items-center">
      <div className="w-full max-w-xl">
        <I18nProvider>
          <Inner />
        </I18nProvider>
      </div>
    </main>
  );
}
