import React from 'react';
import './globals.css';
import I18nRoot from './I18nRoot';
import { cookies } from 'next/headers';
import { Lang } from '@/lib/i18n-dict';
import type { Metadata } from 'next';
import ConsentBanner from '@/components/ConsentBanner';
import SiteFooter from '@/components/SiteFooter';
import AppAccessGuard from '@/components/AppAccessGuard';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://myappschmiede.com'),
  title: {
    default: 'AppSchmiede – exklusiv für Headbang Handwerk',
    template: '%s | AppSchmiede',
  },
  description:
    'AppSchmiede ist die digitale Plattform für autorisierte Mitglieder und Partner von Headbang Handwerk e. V. Der Zugang erfolgt ausschließlich über persönliche Einladung.',
  alternates: {
    canonical: '/',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const raw = cookieStore.get('lang')?.value;
  const initialLang: Lang = raw === 'en' ? 'en' : 'de';

  return (
    <html lang={initialLang}>
      <body className="bg-neutral-950 text-neutral-100 min-h-screen">
        <I18nRoot initialLang={initialLang}>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">
              <AppAccessGuard>{children}</AppAccessGuard>
            </div>
            <SiteFooter />
          </div>
          <ConsentBanner />
        </I18nRoot>
      </body>
    </html>
  );
}