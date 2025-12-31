import React from 'react';
import Script from 'next/script';
import './globals.css';
import I18nRoot from './I18nRoot';
import { cookies } from 'next/headers';
import { Lang } from '@/lib/i18n-dict';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const raw = cookieStore.get('lang')?.value;
  const initialLang: Lang = raw === 'en' ? 'en' : 'de';

  return (
    <html lang={initialLang}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-9591311841405142" />
        <Script
          id="adsense-loader"
          strategy="beforeInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9591311841405142"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-neutral-950 text-neutral-100 min-h-screen">
        <I18nRoot initialLang={initialLang}>{children}</I18nRoot>
      </body>
    </html>
  );
}