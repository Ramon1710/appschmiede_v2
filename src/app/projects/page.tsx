// src/app/projects/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { Project } from '@/types/editor';
import { createProject, listProjects, removeProject, renameProject, subscribeProjects } from '@/lib/db-projects';

export default function ProjectsIndexPage() {
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
      const p = await createProject(name.trim(), user.uid);
      setName('');
      // optional: direkt auf Detailseite
      // location.href = `/projects/${p.id}`;
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Anlegen.');
    } finally {
      setLoading(false);
    }
  };

  if (!user)
    return (
      <main className="min-h-screen grid place-items-center bg-neutral-950 text-neutral-100 p-6">
        <div>Bitte anmelden.</div>
      </main>
    );

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <span className="ml-auto text-sm opacity-70">{user.email}</span>
        </header>

        <section className="rounded-2xl border border-white/10 bg-neutral-900 p-4 space-y-3">
          <h2 className="font-semibold">Neues Projekt</h2>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Projektname"
              className="flex-1 rounded-xl bg-neutral-800 px-3 py-2"
            />
            <button
              onClick={onCreate}
              disabled={loading || !name.trim()}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
            >
              + Anlegen
            </button>
          </div>
          {error && <div className="text-sm text-rose-400">{error}</div>}
        </section>

        <section className="rounded-2xl border border-white/10 bg-neutral-900 p-4 space-y-3">
          <h2 className="font-semibold">Meine Projekte</h2>
          {projects.length === 0 ? (
            <div className="text-sm opacity-70">Keine Projekte gefunden. Lege oben ein neues an.</div>
          ) : (
            <div className="space-y-2">
              {projects.map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-xl border border-white/10 p-2">
                  <input
                    defaultValue={p.name}
                    onBlur={(e) => renameProject(p.id, e.target.value)}
                    className="flex-1 bg-transparent outline-none"
                  />
                  <a href={`/projects/${p.id}`} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">
                    Öffnen
                  </a>
                  <button onClick={() => removeProject(p.id)} className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500">
                    Löschen
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
