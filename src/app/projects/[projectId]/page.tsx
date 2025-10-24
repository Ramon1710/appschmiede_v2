// src/app/projects/[projectId]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Project } from '@/types/editor';

export default function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params;
  const [project, setProject] = useState<Project | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
      </div>
    </main>
  );
}
