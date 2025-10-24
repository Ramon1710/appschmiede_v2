// src/app/layout.tsx  (stellt sicher, dass die Styles geladen werden)
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
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
