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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <RequireAppAccess>{children}</RequireAppAccess>;
}