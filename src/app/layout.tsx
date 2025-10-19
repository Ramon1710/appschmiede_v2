// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AppSchmiede",
  description: "No-code/low-code App-Editor",
};

// KEIN globales Protected / KEIN globales useAuth hier!
// Seiten, die Login brauchen (Dashboard/Projects), schützen wir seitenweise.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
