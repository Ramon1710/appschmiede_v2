// src/app/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Header from '@/components/Header';
import type { Project } from '@/types/editor';
import { createProject, listProjects, removeProject, renameProject, subscribeProjects } from '@/lib/db-projects';

export default function DashboardPage() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [name, setName] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u ? { uid: u.uid, email: u.email } : null)), []);

  useEffect(() => {
    if (!user?.uid) return;
    const off = subscribeProjects(user.uid, (p) => setProjects(p));
    return () => off();
  }, [user?.uid]);

  const onCreate = async () => {
    if (!user?.uid || !name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createProject(name.trim(), user.uid);
      setName('');
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Anlegen.');
    } finally {
      setLoading(false);
    }
  };

  if (!user)
    return (
      <>
        <Header />
        <main className="min-h-screen grid place-items-center bg-neutral-950 text-neutral-100 p-6">
          <div>Bitte anmelden.</div>
        </main>
      </>
    );

  return (
    <>
      <Header />
      <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <header className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <span className="ml-auto text-sm opacity-70">{user.email}</span>
          </header>

          {/* Quick Links */}
          <section className="grid grid-cols-2 gap-4">
            <a
              href="/projects"
              className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-neutral-900 p-6 hover:bg-neutral-800 transition"
            >
              <div className="text-4xl">📁</div>
              <span className="font-semibold">Projekte</span>
              <span className="text-xs text-neutral-400">Alle Projekte verwalten</span>
            </a>
            <a
              href="/editor"
              className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-neutral-900 p-6 hover:bg-neutral-800 transition"
            >
              <div className="text-4xl">✏️</div>
              <span className="font-semibold">Editor</span>
              <span className="text-xs text-neutral-400">Neues Projekt erstellen</span>
            </a>
          </section>

          {/* Recent Projects */}
          <section className="rounded-2xl border border-white/10 bg-neutral-900 p-4 space-y-3">
            <h2 className="font-semibold">Zuletzt bearbeitet</h2>
            {projects.length === 0 ? (
              <div className="text-sm opacity-70">Keine Projekte gefunden. Erstelle ein neues Projekt über "Projekte".</div>
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 5).map((p) => (
                  <a
                    key={p.id}
                    href={`/editor?id=${p.id}`}
                    className="flex items-center gap-3 rounded-xl border border-white/10 p-3 hover:bg-neutral-800 transition"
                  >
                    <div className="text-2xl">📄</div>
                    <div className="flex-1">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-neutral-400">
                        {p.updatedAt?.toDate ? new Date(p.updatedAt.toDate()).toLocaleDateString('de-DE') : 'Neu'}
                      </div>
                    </div>
                    <div className="text-sm text-neutral-400">→</div>
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
