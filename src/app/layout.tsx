import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AppSchmiede",
  description: "No-code/low-code App-Editor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
