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
import { useI18n } from '@/lib/i18n';

export default function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params;
  const router = useRouter();
  const { user, loading } = useAuth();
  const { lang } = useI18n();
  const tr = (de: string, en: string) => (lang === 'en' ? en : de);
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
        if (!snap.exists()) return setErr(tr('Projekt nicht gefunden oder keine Berechtigung.', 'Project not found or you do not have permission.'));
        setProject(snap.data() as Project);
      } catch (e: any) {
        setErr(e?.message || tr('Fehler beim Laden.', 'Failed to load.'));
      }
    })();
  }, [projectId]);

  const onCreatePage = async () => {
    if (!projectId || !user) return;
    setBusy(true);
    try {
      const id = await createPage(projectId, newName || tr('Neue Seite', 'New page'), newFolder || null);
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
    const name = window.prompt(tr('Neuer Seitenname', 'New page name'), p.name);
    if (!name) return;
    try {
      await renameRemotePage(projectId, p.id || '', name);
    } catch (err) {
      console.error(err);
    }
  };

  const onDelete = async (p: PageTree) => {
    if (!confirm(tr(`Seite "${p.name}" löschen?`, `Delete page "${p.name}"?`))) return;
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
        <div>{tr('Lade…', 'Loading…')}</div>
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
            {tr('Im Editor öffnen', 'Open in editor')}
          </a>
          <a href={`/preview/${project.id}`} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">
            {tr('Vorschau', 'Preview')}
          </a>
        </header>

        <section className="rounded-2xl border border-white/10 bg-neutral-900 p-4">
          <div className="text-sm opacity-70 mb-2">{tr('Zuletzt geändert:', 'Last updated:')} {new Date(project.updatedAt).toLocaleString(lang === 'en' ? 'en-US' : 'de-DE')}</div>
          <div className="text-sm">{tr('Seiten:', 'Pages:')} {project.pages.length}</div>
          <div className="text-sm">{tr('Elemente:', 'Elements:')} {Object.keys(project.nodes).length}</div>
        </section>

        <div className="p-3 bg-neutral-900 rounded">
          <div className="flex gap-2 mb-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={tr('Seitenname', 'Page name')} className="flex-1 p-2 rounded bg-neutral-800" />
            <input value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder={tr('Ordner (optional)', 'Folder (optional)')} className="w-48 p-2 rounded bg-neutral-800" />
            <button onClick={onCreatePage} disabled={busy} className="px-4 py-2 bg-emerald-600 rounded text-white">{busy ? tr('Erstelle…', 'Creating…') : tr('Seite erstellen', 'Create page')}</button>
          </div>

          {Object.keys(grouped).map((folderKey) => (
            <div key={folderKey} className="mb-4">
              <div className="font-semibold text-neutral-300 mb-2">{folderKey === '__root' ? tr('Unsortiert', 'Unsorted') : folderKey}</div>
              <div className="space-y-2">
                {(grouped[folderKey] || []).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-neutral-800 rounded">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-neutral-500">ID: {p.id}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onOpen(p)} className="px-3 py-1 rounded bg-sky-600 text-white">{tr('Öffnen', 'Open')}</button>
                      <button onClick={() => onRename(p)} className="px-3 py-1 rounded bg-neutral-700 text-white">{tr('Umbenennen', 'Rename')}</button>
                      <button onClick={() => onDelete(p)} className="px-3 py-1 rounded bg-rose-600 text-white">{tr('Löschen', 'Delete')}</button>
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
