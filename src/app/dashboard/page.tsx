// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Header from '@/components/Header';
import type { Project } from '@/lib/db-projects';
import { subscribeProjects } from '@/lib/db-projects';

export default function DashboardPage() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u ? { uid: u.uid, email: u.email } : null)), []);

  useEffect(() => {
    if (!user?.uid) return;
    const off = subscribeProjects(user.uid, (p) => setProjects(p));
    return () => off();
  }, [user?.uid]);

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
      <main className="min-h-screen text-neutral-100 p-6">
        <div className="mx-auto max-w-7xl flex gap-6">
          {/* Left Ad Space */}
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-6 rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur-sm p-6 space-y-4">
              <div className="text-xs text-neutral-400 uppercase tracking-wider">Werbung</div>
              <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center text-neutral-500 text-sm">
                Anzeige 1
              </div>
              <div className="aspect-square bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center text-neutral-500 text-sm">
                Anzeige 2
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            <header className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <span className="ml-auto text-sm opacity-70">{user.email}</span>
            </header>

            <section className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-neutral-900/80 backdrop-blur-md p-6 shadow-2xl md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-400/80">Willkommen zurück</p>
                <h2 className="text-4xl font-semibold leading-tight">Baue deine nächste App in Minuten.</h2>
                <p className="text-sm text-neutral-400">
                  Verwalte deine Projekte, teste neue Ideen im Editor und teile Prototypen mit deinem Team – alles in einem Workspace.
                </p>
                <div className="flex gap-3 pt-2 text-sm">
                  <Link
                    href="/projects"
                    className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:from-cyan-400 hover:to-blue-400"
                  >
                    Projekte öffnen
                  </Link>
                  <Link
                    href="/editor"
                    className="rounded-full border border-white/30 px-4 py-2 font-semibold text-neutral-100 hover:bg-white/10"
                  >
                    Direkt zum Editor
                  </Link>
                </div>
              </div>
              <div className="relative mx-auto flex h-48 w-48 items-center justify-center md:mx-0 md:h-56 md:w-56">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-fuchsia-600 blur-3xl opacity-40" />
                <Image src="/logo.png" alt="AppSchmiede Logo" width={220} height={220} priority className="relative drop-shadow-2xl" />
              </div>
            </section>

            {/* Quick Links */}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Link
                href="/projects"
                className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur-sm p-6 transition hover:bg-neutral-800/80"
              >
                <div className="text-4xl">📁</div>
                <span className="font-semibold">Projekte</span>
                <span className="text-xs text-neutral-400">Alle Projekte verwalten</span>
              </Link>
              <Link
                href="/editor"
                className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur-sm p-6 transition hover:bg-neutral-800/80"
              >
                <div className="text-4xl">✏️</div>
                <span className="font-semibold">Editor</span>
                <span className="text-xs text-neutral-400">Neues Projekt erstellen</span>
              </Link>
              <Link
                href="/tools/templates"
                className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur-sm p-6 transition hover:bg-neutral-800/80"
              >
                <div className="text-4xl">🧩</div>
                <span className="font-semibold">Vorlagen</span>
                <span className="text-xs text-neutral-400">Fertige Apps kopieren</span>
              </Link>
            </section>

            {/* Recent Projects */}
            <section className="rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur-sm p-4 space-y-3">
              <h2 className="font-semibold">Zuletzt bearbeitet</h2>
              {projects.length === 0 ? (
                <div className="text-sm opacity-70">Keine Projekte gefunden. Erstelle ein neues Projekt über "Projekte".</div>
              ) : (
                <div className="space-y-2">
                  {projects.slice(0, 5).map((p) => (
                    <Link
                      key={p.id}
                      href={`/editor?id=${p.id}`}
                      className="flex items-center gap-3 rounded-xl border border-white/10 p-3 transition hover:bg-neutral-800"
                    >
                      <div className="text-2xl">📄</div>
                      <div className="flex-1">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-neutral-400">
                          {p.updatedAt?.toDate ? new Date(p.updatedAt.toDate()).toLocaleDateString('de-DE') : 'Neu'}
                        </div>
                      </div>
                      <div className="text-sm text-neutral-400">→</div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Ad Space */}
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-6 rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur-sm p-6 space-y-4">
              <div className="text-xs text-neutral-400 uppercase tracking-wider">Werbung</div>
              <div className="aspect-square bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center text-neutral-500 text-sm">
                Anzeige 3
              </div>
              <div className="aspect-square bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-xl flex items-center justify-center text-neutral-500 text-sm">
                Anzeige 4
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
