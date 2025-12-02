// src/app/projects/page.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Header from '@/components/Header';
import GuidedTour from '@/components/GuidedTour';
import type { Project } from '@/types/editor';
import { createProject, listProjects, removeProject, renameProject, subscribeProjects } from '@/lib/db-projects';

export default function ProjectsIndexPage() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [name, setName] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u ? { uid: u.uid, email: u.email } : null)), []);

  useEffect(() => {
    if (!user?.uid) return;
    const off = subscribeProjects(user.uid, (p) => setProjects(p));
    return () => off();
  }, [user?.uid]);

  useEffect(() => {
    if (!renamingId) return;
    renameInputRef.current?.focus();
    renameInputRef.current?.select();
  }, [renamingId]);

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

  const onRemove = async (projectId: string) => {
    const confirmed = typeof window !== 'undefined' ? window.confirm('Wollen Sie das Projekt wirklich löschen?') : true;
    if (!confirmed) return;
    try {
      await removeProject(projectId);
    } catch (e: any) {
      setError(e?.message || 'Projekt konnte nicht gelöscht werden.');
    }
  };

  const beginRename = (project: Project) => {
    setError(null);
    setRenamingId(project.id);
    setRenameValue(project.name);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
    setRenaming(false);
  };

  const submitRename = async () => {
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setError('Bitte gib einen Projektnamen ein.');
      return;
    }
    const project = projects.find((p) => p.id === renamingId);
    if (project && project.name === trimmed) {
      cancelRename();
      return;
    }
    setRenaming(true);
    setError(null);
    try {
      await renameProject(renamingId, trimmed);
      cancelRename();
    } catch (e: any) {
      setError(e?.message || 'Projekt konnte nicht umbenannt werden.');
    } finally {
      setRenaming(false);
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

  const tourSteps = [
    {
      id: 'projects-create-input',
      title: 'Projektname festlegen',
      description: 'Tippe hier den Namen deines neuen Projekts ein – z.B. "Marketing App".',
    },
    {
      id: 'projects-create-button',
      title: '+ Anlegen',
      description: 'Mit diesem Button legst du das Projekt an und kannst es sofort im Editor öffnen.',
    },
    {
      id: 'projects-list',
      title: 'Projektübersicht',
      description: 'Alle angelegten Projekte erscheinen hier. Mit den Buttons kannst du sie öffnen oder löschen.',
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen w-full bg-neutral-950 px-4 py-10 text-neutral-100 lg:px-10">
        <div className="flex flex-col gap-6">
          <header className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Projekte</h1>
            <span className="ml-auto text-sm opacity-70">{user.email}</span>
          </header>

          <section className="rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur-sm p-4 space-y-3">
            <h2 className="font-semibold">Neues Projekt</h2>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Projektname"
                data-tour-id="projects-create-input"
                className="flex-1 rounded-xl bg-neutral-800 px-3 py-2"
              />
              <button
                onClick={onCreate}
                disabled={loading || !name.trim()}
                data-tour-id="projects-create-button"
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
              >
                + Anlegen
              </button>
            </div>
            {error && <div className="text-sm text-rose-400">{error}</div>}
          </section>

          <section className="rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur-sm p-4 space-y-3" data-tour-id="projects-list">
            <h2 className="font-semibold">Meine Projekte</h2>
            {projects.length === 0 ? (
              <div className="text-sm opacity-70">Keine Projekte gefunden. Lege oben ein neues an.</div>
            ) : (
              <div className="space-y-2">
                {projects.map((p) => {
                  const isEditing = renamingId === p.id;
                  return (
                    <div key={p.id} className="flex flex-col gap-2 rounded-xl border border-white/10 p-3 sm:flex-row sm:items-center">
                      <div className="flex-1">
                        {isEditing ? (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                              ref={renameInputRef}
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  submitRename();
                                }
                                if (event.key === 'Escape') {
                                  event.preventDefault();
                                  cancelRename();
                                }
                              }}
                              className="flex-1 rounded-lg border border-white/15 bg-neutral-900 px-3 py-2 text-sm"
                            />
                            <div className="flex gap-2 text-sm">
                              <button
                                type="button"
                                onClick={submitRename}
                                disabled={renaming}
                                className="rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 font-semibold text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-50"
                              >
                                Speichern
                              </button>
                              <button
                                type="button"
                                onClick={cancelRename}
                                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-semibold text-neutral-200 hover:bg-white/10"
                              >
                                Abbrechen
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-base font-semibold text-white">{p.name}</p>
                            <p className="text-xs text-neutral-400">ID: {p.id}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => beginRename(p)}
                            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-semibold text-neutral-200 hover:bg-white/10"
                          >
                            ✏️ Umbenennen
                          </button>
                        )}
                        <a
                          href={`/editor?id=${p.id}`}
                          className="rounded-lg border border-cyan-400/40 bg-cyan-500/20 px-3 py-1.5 font-semibold text-cyan-100 hover:bg-cyan-500/30"
                        >
                          Öffnen
                        </a>
                        <button
                          type="button"
                          onClick={() => onRemove(p.id)}
                          className="rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 font-semibold text-rose-100 hover:bg-rose-500/30"
                        >
                          Löschen
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
      <GuidedTour storageKey="tour-projects" steps={tourSteps} />
    </>
  );
}
