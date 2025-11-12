// src/app/projects/[projectId]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import {
  createPage,
  deletePage,
  listPages,
  renamePage as renameRemotePage,
  subscribePages,
  type PageTree,
} from '@/lib/db-editor';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Project } from '@/types/editor';

export default function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params;
  const router = useRouter();
  const { user, loading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pages, setPages] = useState<PageTree[]>([]);
  const [newName, setNewName] = useState('');
  const [newFolder, setNewFolder] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    // realtime subscribe
    const unsub = subscribePages(projectId, (p) => setPages(p));
    return () => unsub && unsub();
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    // initial load fallback if subscribe isn't picked up yet
    (async () => {
      try {
        const list = await listPages(projectId);
        setPages(list);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [projectId]);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'projects', projectId));
        if (!snap.exists()) return setErr('Projekt nicht gefunden oder keine Berechtigung.');
        setProject(snap.data() as Project);
      } catch (e: any) {
        setErr(e?.message || 'Fehler beim Laden.');
      }
    })();
  }, [projectId]);

  const onCreatePage = async () => {
    if (!projectId || !user) return;
    setBusy(true);
    try {
      const id = await createPage(projectId, newName || 'Neue Seite', newFolder || null);
      setNewName('');
      setNewFolder('');
      router.push(`/editor?projectId=${encodeURIComponent(projectId)}&p=${encodeURIComponent(id)}`);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const onRename = async (p: PageTree) => {
    const name = window.prompt('Neuer Seitenname', p.name);
    if (!name) return;
    try {
      await renameRemotePage(projectId, p.id || '', name);
    } catch (err) {
      console.error(err);
    }
  };

  const onDelete = async (p: PageTree) => {
    if (!confirm(`Seite "${p.name}" löschen?`)) return;
    try {
      await deletePage(projectId, p.id || '');
    } catch (err) {
      console.error(err);
    }
  };

  const onOpen = (p: PageTree) => {
    router.push(`/editor?projectId=${encodeURIComponent(projectId)}&p=${encodeURIComponent(p.id || '')}`);
  };

  if (err)
    return (
      <main className="min-h-screen grid place-items-center bg-neutral-950 text-neutral-100 p-6">
        <div className="text-rose-400">{err}</div>
      </main>
    );

  if (!project)
    return (
      <main className="min-h-screen grid place-items-center bg-neutral-950 text-neutral-100 p-6">
        <div>Lade…</div>
      </main>
    );

  // group by folder
  const grouped = pages.reduce<Record<string, PageTree[]>>((acc, cur) => {
    const f = cur.folder ?? '__root';
    (acc[f] ||= []).push(cur);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <a href={`/editor?id=${project.id}`} className="ml-auto px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">
            Im Editor öffnen
          </a>
          <a href={`/preview/${project.id}`} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">
            Vorschau
          </a>
        </header>

        <section className="rounded-2xl border border-white/10 bg-neutral-900 p-4">
          <div className="text-sm opacity-70 mb-2">Zuletzt geändert: {new Date(project.updatedAt).toLocaleString()}</div>
          <div className="text-sm">Seiten: {project.pages.length}</div>
          <div className="text-sm">Elemente: {Object.keys(project.nodes).length}</div>
        </section>

        <div className="p-3 bg-neutral-900 rounded">
          <div className="flex gap-2 mb-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Seitenname" className="flex-1 p-2 rounded bg-neutral-800" />
            <input value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder="Ordner (optional)" className="w-48 p-2 rounded bg-neutral-800" />
            <button onClick={onCreatePage} disabled={busy} className="px-4 py-2 bg-emerald-600 rounded text-white">{busy ? 'Erstelle…' : 'Seite erstellen'}</button>
          </div>

          {Object.keys(grouped).map((folderKey) => (
            <div key={folderKey} className="mb-4">
              <div className="font-semibold text-neutral-300 mb-2">{folderKey === '__root' ? 'Unsortiert' : folderKey}</div>
              <div className="space-y-2">
                {(grouped[folderKey] || []).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-neutral-800 rounded">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-neutral-500">ID: {p.id}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onOpen(p)} className="px-3 py-1 rounded bg-sky-600 text-white">Öffnen</button>
                      <button onClick={() => onRename(p)} className="px-3 py-1 rounded bg-neutral-700 text-white">Umbenennen</button>
                      <button onClick={() => onDelete(p)} className="px-3 py-1 rounded bg-rose-600 text-white">Löschen</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
