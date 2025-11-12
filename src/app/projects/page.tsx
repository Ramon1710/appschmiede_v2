// src/app/projects/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import {
  createProject,
  listProjects,
  renameProject,
  removeProject,
  subscribeProjects,
  type Project,
} from '@/lib/db-projects';
import { useI18n } from '@/components/I18nProviderClient';

export default function ProjectsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      return;
    }
    const unsub = subscribeProjects(user.uid, (p) => setProjects(p));
    return () => unsub && unsub();
  }, [user]);

  const onCreate = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const id = await createProject(user.uid, name || 'Neues Projekt');
      setName('');
      router.push(`/projects/${id}`);
    } catch (err) {
      console.error(err);
      alert('Fehler beim Erstellen. Prüfe Firestore-Regeln.');
    } finally {
      setBusy(false);
    }
  };

  const onRename = async (p: Project) => {
    const newName = window.prompt('Neuer Projektname', p.name);
    if (!newName || newName.trim() === '' || newName === p.name) return;
    try {
      await renameProject(p.id, newName.trim());
    } catch (err) {
      console.error(err);
    }
  };

  const onDelete = async (p: Project) => {
    if (!confirm(`Projekt "${p.name}" wirklich löschen?`)) return;
    try {
      await removeProject(p.id);
    } catch (err) {
      console.error(err);
    }
  };

  const onOpen = (p: Project) => {
    router.push(`/projects/${p.id}`);
  };

  if (loading) return <div className="container p-6">Lade …</div>;
  if (!user) return null;

  return (
    <div className="container" style={{ maxWidth: 900, paddingTop: 40 }}>
      <h1 className="text-2xl font-bold mb-6">{t('projects.title')}</h1>

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
            {busy ? 'Erstelle…' : t('projects.create')}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="kicker mb-3">Meine Projekte</div>
        {projects.length === 0 ? (
          <div className="text-sm text-muted">{t('projects.empty')}</div>
        ) : (
          <div className="flex flex-col gap-3">
            {projects.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4 rounded" style={{ background: 'rgba(15,23,41,0.5)' }}>
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm text-muted">ID: {p.id}</div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => onOpen(p)} className="btn">{t('projects.open')}</button>
                  <button onClick={() => onRename(p)} className="btn">{t('projects.rename')}</button>
                  <button onClick={() => onDelete(p)} className="btn" style={{ borderColor: '#ef4444', color: '#ef4444' }}>{t('projects.delete')}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
