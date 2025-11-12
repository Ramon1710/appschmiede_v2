'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import { createProject, subscribeProjects, type Project } from '@/lib/db-projects';
import { useI18n } from '@/components/I18nProviderClient';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeProjects(user.uid, setProjects);
    return () => unsub && unsub();
  }, [user]);

  async function onCreate() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const id = await createProject(user.uid, name || 'Neues Projekt');
      setName('');
      router.push(`/editor?projectId=${id}`);
    } catch (err: any) {
      setError(err?.message ?? 'Fehler beim Erstellen');
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="container p-6">Lade…</div>;
  if (!user) return null;

  return (
    <div className="container" style={{ maxWidth: 800, paddingTop: 40 }}>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="text-sm text-muted mb-6">{user.email}</div>

      <div className="panel mb-6">
        <div className="kicker mb-3">{t('projects.new')}</div>
        <div className="flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Projektname"
            className="flex-1"
          />
          <button onClick={onCreate} disabled={busy} className="btn btn-primary">
            {busy ? 'Erstelle…' : '+ Anlegen'}
          </button>
        </div>
        {error && <div className="text-sm mt-2" style={{ color: '#ef4444' }}>{error}</div>}
      </div>

      <div className="panel">
        <div className="kicker mb-3">Meine Projekte</div>
        {projects.length === 0 ? (
          <div className="text-sm text-muted">Keine Projekte gefunden. Lege oben ein neues an.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded"
                style={{ background: 'rgba(15,23,41,0.5)' }}
              >
                <div className="font-semibold">{p.name}</div>
                <button onClick={() => router.push(`/editor?projectId=${p.id}`)} className="btn">Öffnen</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}