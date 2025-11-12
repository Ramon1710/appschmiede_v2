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

export default function ProjectsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');

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
      router.push(`/editor?projectId=${encodeURIComponent(id)}`);
    } catch (err) {
      // optional: toast
      console.error(err);
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
    router.push(`/editor?projectId=${encodeURIComponent(p.id)}`);
  };

  if (loading) return <div className="p-6">Lade …</div>;
  if (!user) return <div className="p-6">Bitte <a href="/login" className="text-emerald-400">anmelden</a>.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl mb-4">Projekte</h1>

      <div className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Neues Projekt Name"
          className="flex-1 p-2 rounded bg-neutral-800"
        />
        <button onClick={onCreate} disabled={busy} className="px-4 py-2 bg-emerald-600 rounded text-white">
          {busy ? 'Erstelle…' : 'Erstellen'}
        </button>
      </div>

      <div className="space-y-3">
        {projects.length === 0 ? (
          <div className="text-neutral-400">Keine Projekte vorhanden.</div>
        ) : (
          projects.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-neutral-900 rounded">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-neutral-400">ID: {p.id}</div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => onOpen(p)} className="px-3 py-1 rounded bg-sky-600 text-white">Öffnen</button>
                <button onClick={() => onRename(p)} className="px-3 py-1 rounded bg-neutral-700 text-white">Umbenennen</button>
                <button onClick={() => onDelete(p)} className="px-3 py-1 rounded bg-rose-600 text-white">Löschen</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
