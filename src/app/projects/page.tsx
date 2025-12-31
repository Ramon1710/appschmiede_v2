// src/app/projects/page.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Header from '@/components/Header';
import UnauthenticatedScreen from '@/components/UnauthenticatedScreen';
import GuidedTour from '@/components/GuidedTour';
import type { Project } from '@/lib/db-projects';
import {
  PROJECT_ICON_CHOICES,
  createProject,
  removeProject,
  renameProject,
  subscribeProjects,
  updateProjectIcon,
} from '@/lib/db-projects';
import { getStoredProjectId } from '@/lib/editor-storage';
import { useI18n } from '@/lib/i18n';

export default function ProjectsIndexPage() {
  const { lang } = useI18n();
  const tr = (de: string, en: string) => (lang === 'en' ? en : de);

  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [name, setName] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [iconUpdatingId, setIconUpdatingId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u ? { uid: u.uid, email: u.email } : null)), []);

  useEffect(() => {
    if (!user?.uid) return;
    const off = subscribeProjects(user.uid, (p) => setProjects(p));
    return () => off();
  }, [user?.uid]);

  useEffect(() => {
    const hydrate = () => setActiveProjectId(getStoredProjectId());
    hydrate();
    window.addEventListener('storage', hydrate);
    return () => window.removeEventListener('storage', hydrate);
  }, []);

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
      setError(e?.message || tr('Fehler beim Anlegen.', 'Failed to create project.'));
    } finally {
      setLoading(false);
    }
  };

  const onRemove = async (projectId: string) => {
    const confirmed = typeof window !== 'undefined' ? window.confirm(tr('Wollen Sie das Projekt wirklich löschen?', 'Do you really want to delete this project?')) : true;
    if (!confirmed) return;
    try {
      await removeProject(projectId);
    } catch (e: any) {
      setError(e?.message || tr('Projekt konnte nicht gelöscht werden.', 'Project could not be deleted.'));
    }
  };

  const handleIconChange = async (projectId: string, icon: string) => {
    if (iconUpdatingId === projectId) return;
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    if (project.icon === icon) return;
    setIconUpdatingId(projectId);
    setError(null);
    try {
      await updateProjectIcon(projectId, icon);
    } catch (err: any) {
      console.error(tr('Icon konnte nicht gespeichert werden', 'Icon could not be saved'), err);
      setError(err?.message || tr('Icon konnte nicht gespeichert werden.', 'Icon could not be saved.'));
    } finally {
      setIconUpdatingId((prev) => (prev === projectId ? null : prev));
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
      setError(tr('Bitte gib einen Projektnamen ein.', 'Please enter a project name.'));
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
      setError(e?.message || tr('Projekt konnte nicht umbenannt werden.', 'Project could not be renamed.'));
    } finally {
      setRenaming(false);
    }
  };

  if (!user)
    return (
      <UnauthenticatedScreen
        badge={tr('Projekte', 'Projects')}
        description={tr(
          'Melde dich an, um deine Projekte zu sehen, neue Workspaces anzulegen oder sie im Editor zu öffnen.',
          'Sign in to view your projects, create new workspaces, or open them in the editor.'
        )}
      />
    );

  const tourSteps = [
    {
      id: 'projects-create-input',
      title: tr('Projektname festlegen', 'Choose a project name'),
      description: tr('Tippe hier den Namen deines neuen Projekts ein – z.B. "Marketing App".', 'Enter a name for your new project — e.g. “Marketing app”.'),
    },
    {
      id: 'projects-create-button',
      title: tr('+ Anlegen', '+ Create'),
      description: tr('Mit diesem Button legst du das Projekt an und kannst es sofort im Editor öffnen.', 'Creates the project so you can open it in the editor right away.'),
    },
    {
      id: 'projects-list',
      title: tr('Projektübersicht', 'Project overview'),
      description: tr('Alle angelegten Projekte erscheinen hier. Mit den Buttons kannst du sie öffnen oder löschen.', 'All your projects appear here. Use the buttons to open or delete them.'),
    },
  ];

  const formatTimestamp = (value: any) => {
    if (!value) return '—';
    if (value?.toDate) {
      try {
        const date = value.toDate();
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      } catch (e) {
        /* ignore */
      }
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const sortedProjects = [...projects].sort((a, b) => {
    const aTime = a.updatedAt?.toMillis?.() ?? a.updatedAt ?? a.createdAt?.toMillis?.() ?? a.createdAt ?? 0;
    const bTime = b.updatedAt?.toMillis?.() ?? b.updatedAt ?? b.createdAt?.toMillis?.() ?? b.createdAt ?? 0;
    return bTime - aTime;
  });

  const openProject = (projectId: string) => {
    setActiveProjectId(projectId);
    router.push(`/editor?projectId=${encodeURIComponent(projectId)}`);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen w-full bg-neutral-950 px-4 py-10 text-neutral-100 lg:px-10">
        <div className="flex flex-col gap-6">
          <header className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{tr('Projekte', 'Projects')}</h1>
            <span className="ml-auto text-sm opacity-70">{user.email}</span>
          </header>

          <section className="rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur-sm p-4 space-y-3">
            <h2 className="font-semibold">{tr('Neues Projekt', 'New project')}</h2>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tr('Projektname', 'Project name')}
                data-tour-id="projects-create-input"
                className="flex-1 rounded-xl bg-neutral-800 px-3 py-2"
              />
              <button
                onClick={onCreate}
                disabled={loading || !name.trim()}
                data-tour-id="projects-create-button"
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
              >
                {tr('+ Anlegen', '+ Create')}
              </button>
            </div>
            {error && <div className="text-sm text-rose-400">{error}</div>}
          </section>

          <section className="rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur-sm p-4 space-y-3" data-tour-id="projects-list">
            <h2 className="font-semibold">{tr('Meine Projekte', 'My projects')}</h2>
            {sortedProjects.length === 0 ? (
              <div className="text-sm opacity-70">{tr('Keine Projekte gefunden. Lege oben ein neues an.', 'No projects found. Create one above.')}</div>
            ) : (
              <div className="space-y-2">
                {sortedProjects.map((p) => {
                  const isEditing = renamingId === p.id;
                  const isActive = p.id === activeProjectId;
                  const icon = p.icon?.trim() || '📱';
                  const updatedLabel = formatTimestamp(p.updatedAt || p.createdAt);
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col gap-2 rounded-xl border border-white/10 p-3 sm:flex-row sm:items-center hover:border-cyan-400/40 transition cursor-pointer"
                      onClick={() => {
                        if (!isEditing) openProject(p.id);
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-2xl ${isActive ? 'ring-2 ring-cyan-400/60' : ''}`}>
                          {icon}
                        </div>
                        {isEditing ? (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                              ref={renameInputRef}
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onClick={(event) => event.stopPropagation()}
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
                                {tr('Speichern', 'Save')}
                              </button>
                              <button
                                type="button"
                                onClick={cancelRename}
                                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-semibold text-neutral-200 hover:bg-white/10"
                              >
                                {tr('Abbrechen', 'Cancel')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-base font-semibold text-white">{p.name}</p>
                              {isActive && (
                                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[11px] font-semibold text-cyan-200">{tr('Aktuell aktiv', 'Currently active')}</span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-400">{tr('Zuletzt geändert:', 'Last updated:')} {updatedLabel}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                              <label className="text-xs text-neutral-300">{tr('Icon:', 'Icon:')}</label>
                              <select
                                value={p.icon ?? icon}
                                onChange={(e) => handleIconChange(p.id, e.target.value)}
                                disabled={iconUpdatingId === p.id}
                                className="rounded-lg border border-white/15 bg-neutral-900 px-2 py-1 text-sm"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {PROJECT_ICON_CHOICES.map((choice) => (
                                  <option key={`${p.id}-${choice}`} value={choice}>{choice}</option>
                                ))}
                              </select>
                              {iconUpdatingId === p.id && <span className="text-xs text-neutral-400">{tr('Speichere…', 'Saving…')}</span>}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              beginRename(p);
                            }}
                            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-semibold text-neutral-200 hover:bg-white/10"
                          >
                            {tr('✏️ Umbenennen', '✏️ Rename')}
                          </button>
                        )}
                        <a
                          href={`/editor?projectId=${encodeURIComponent(p.id)}`}
                          className="rounded-lg border border-cyan-400/40 bg-cyan-500/20 px-3 py-1.5 font-semibold text-cyan-100 hover:bg-cyan-500/30"
                          onClick={(event) => {
                            event.stopPropagation();
                            openProject(p.id);
                          }}
                        >
                          {tr('Öffnen', 'Open')}
                        </a>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onRemove(p.id);
                          }}
                          className="rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 font-semibold text-rose-100 hover:bg-rose-500/30"
                        >
                          {tr('Löschen', 'Delete')}
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
