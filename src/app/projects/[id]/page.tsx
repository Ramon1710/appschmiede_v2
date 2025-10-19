'use client';

import { useAuth } from '../../providers';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectEditorPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) return <div className="container"><div className="card">Wird geladen…</div></div>;

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Editor</h2>
        <p style={{ color: 'var(--muted)' }}>
          Projekt-ID: <span className="badge">{params.id}</span>
        </p>
        <p style={{ color: 'var(--muted)' }}>
          Hier implementieren wir als Nächstes den visuellen App-Editor (Drag & Drop, Eigenschaften-Panel, Live-Vorschau).
        </p>
      </div>
    </div>
  );
}
