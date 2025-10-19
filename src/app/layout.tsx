// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AppSchmiede",
  description: "No-code/low-code App-Editor",
};

// Kein globaler Protected/AuthProvider hier.
// Geschützte Seiten bekommen ihr Gate lokal in der Seite.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
