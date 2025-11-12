'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import EditorClient from './EditorClient';

export default function EditorPageClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && !user) {
      const redirect = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [user, loading, router, pathname, searchParams]);

  if (loading) return <div className="container p-6">Lade…</div>;
  if (!user) return null;

  return <EditorClient />;
}