'use client';

import { useAuth } from '../providers';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) return <div className="container"><div className="card">Wird geladen…</div></div>;

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Willkommen, {user?.displayName || user?.email}</h2>
        <p style={{ color: 'var(--muted)' }}>
          Weiter mit <Link href="/projects">Projekten</Link> oder Profil/Einstellungen.
        </p>
      </div>
    </div>
  );
}
