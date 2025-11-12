import React from 'react';
import Header from '@/components/Header';
import './globals.css';
import { I18nProvider } from '@/components/I18nProviderClient';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-neutral-950 text-neutral-100 min-h-screen">
        <I18nProvider>
          <Header />
          <main>{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}