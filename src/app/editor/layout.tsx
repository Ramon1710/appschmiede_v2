import React from 'react';
import type { Metadata } from 'next';
import RequireAppAccess from '@/components/RequireAppAccess';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0b0b0f]">
      <RequireAppAccess>{children}</RequireAppAccess>
    </div>
  );
}
