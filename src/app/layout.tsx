// src/app/layout.tsx  (komplett ersetzen)
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AppSchmiede',
  description: 'No-Code App Editor',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
