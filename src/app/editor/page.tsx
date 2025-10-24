// src/app/editor/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

type Page = { id: string; name: string; nodeIds: string[] };
type Project = {
  id: string;
  name: string;
  ownerId: string;
  pages: Page[];
  nodes: Record<string, any>;
  createdAt: number;
  updatedAt: number;
};

export default function EditorPage() {
  const sp = useSearchParams();
  const projectId = sp.get('id');

  const [loading, setLoading] = useState<boolean>(!!projectId);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'projects', projectId));
        if (!snap.exists()) {
          setError('Projekt nicht gefunden oder keine Berechtigung.');
          setProject(null);
        } else {
          setProject(snap.data() as Project);
        }
      } catch (e: any) {
        setError(e?.message || 'Fehler beim Laden.');
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  if (!projectId) {
    return (
      <main className="min-h-screen grid place-items-center">
        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 max-w-xl">
          <div className="text-xl font-semibold mb-2">Kein Projekt gewählt</div>
          <div className="opacity-80 mb-3">
            Öffne ein Projekt über <code>/projects</code> oder nutze
            <code> /editor?id=&lt;PROJEKT-ID&gt;</code>.
          </div>
          <a href="/projects" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 inline-block">
            Zu meinen Projekten
          </a>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center">
        <div className="opacity-80">Lade Projekt…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen grid place-items-center">
        <div className="text-rose-400">{error}</div>
      </main>
    );
  }

  if (!project) return null;

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <header className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <a
            href={`/preview/${project.id}`}
            className="ml-auto px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
          >
            Vorschau
          </a>
        </header>

        {/* Platzhalter – hier später Canvas/Toolbox wieder einhängen */}
        <section className="rounded-2xl border border-white/10 bg-neutral-900 p-4">
          <div className="text-sm opacity-80 mb-1">
            Seiten: {project.pages?.length ?? 0} • Elemente: {Object.keys(project.nodes || {}).length}
          </div>
          <div className="text-xs opacity-60">
            Fallback-Ansicht, damit die Seite stabil lädt. (Canvas-Komponenten hängen wir danach wieder an.)
          </div>
        </section>
      </div>
    </main>
  );
}
