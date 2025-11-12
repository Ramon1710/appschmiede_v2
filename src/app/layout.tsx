import React from 'react';
import Header from '@/components/Header';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-neutral-950 text-neutral-100 min-h-screen">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}