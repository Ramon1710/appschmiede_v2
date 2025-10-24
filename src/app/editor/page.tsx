// src/app/editor/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { Project, NodeBase, NodeType } from '@/types/editor';
import PhoneFrame from './_components/PhoneFrame';
import Canvas from './_components/Canvas';
import PropertiesPanel from './_components/PropertiesPanel';
import Toolbox from './_components/Toolbox';

const uid = () => `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;

function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<null | { uid: string; email: string | null }>(null);
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u ? { uid: u.uid, email: u.email } : null); setReady(true); }), []);

  if (!ready) return <div className="grid place-items-center h-screen">Lade…</div>;
  if (user) return <>{children}</>;

  const action = async () => {
    setInfo(null);
    try {
      if (mode === 'login') await signInWithEmailAndPassword(auth, email, pass);
      if (mode === 'register') await createUserWithEmailAndPassword(auth, email, pass);
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setInfo('E-Mail zum Zurücksetzen gesendet.');
      }
    } catch (e: any) {
      setInfo(e.message ?? 'Fehler');
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl">
        <h1 className="text-xl font-semibold mb-4">AppSchmiede – Anmeldung</h1>
        {info && <div className="mb-3 text-sm text-emerald-400">{info}</div>}
        <label className="block text-sm mb-1">E-Mail</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mb-3 rounded-xl bg-neutral-800 px-3 py-2 outline-none" />
        {mode !== 'reset' && (
          <>
            <label className="block text-sm mb-1">Passwort</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="w-full mb-3 rounded-xl bg-neutral-800 px-3 py-2 outline-none" />
          </>
        )}
        <button onClick={action} className="w-full rounded-xl bg-white/10 hover:bg-white/20 transition px-4 py-2 font-medium">
          {mode === 'login' && 'Login'}
          {mode === 'register' && 'Registrieren'}
          {mode === 'reset' && 'Passwort zurücksetzen'}
        </button>
        <div className="mt-4 flex items-center justify-between text-sm text-neutral-400">
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="hover:text-neutral-200">
            {mode === 'login' ? 'Neu? Registrieren' : 'Schon da? Login'}
          </button>
          <button onClick={() => setMode('reset')} className="hover:text-neutral-200">
            Passwort vergessen
          </button>
        </div>
      </div>
    </div>
  );
}

function useProjectState(userId: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState<'idle' | 'dirty' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const q = query(collection(db, 'projects'), where('ownerId', '==', userId));
    getDocs(q).then((snap) => {
      const list: Project[] = snap.docs.map((d) => d.data() as Project);
      setProjects(list.sort((a, b) => b.updatedAt - a.updatedAt));
      if (list[0]) setCurrentId(list[0].id);
    });
  }, [userId]);

  useEffect(() => {
    if (!currentId) {
      setProject(null);
      return;
    }
    const ref = doc(db, 'projects', currentId);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) setProject(snap.data() as Project);
    });
  }, [currentId]);

  useEffect(() => {
    if (!project) return;
    setSaving('dirty');
    const t = setTimeout(async () => {
      try {
        setSaving('saving');
        await setDoc(doc(db, 'projects', project.id), { ...project, updatedAt: Date.now(), _serverUpdatedAt: serverTimestamp() });
        setSaving('saved');
        setTimeout(() => setSaving('idle'), 1000);
      } catch {
        setSaving('idle');
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [JSON.stringify(project)]);

  const createProject = async () => {
    const id = uid();
    const p: Project = {
      id,
      name: 'Neues Projekt',
      ownerId: userId,
      pages: [{ id: uid(), name: 'Start', nodeIds: [] }],
      nodes: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await setDoc(doc(db, 'projects', id), p);
    setProjects((prev) => [p, ...prev]);
    setCurrentId(id);
  };

  const removeProject = async (id: string) => {
    await deleteDoc(doc(db, 'projects', id));
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (currentId === id) setCurrentId(projects[0]?.id ?? null);
  };

  const renameProject = async (id: string, name: string) => {
    await updateDoc(doc(db, 'projects', id), { name, updatedAt: Date.now() });
  };

  return { projects, currentId, setCurrentId, project, setProject, saving, createProject, removeProject, renameProject };
}

export default function EditorPage() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u ? { uid: u.uid, email: u.email } : null)), []);
  if (!user) return <AuthGate><div /></AuthGate>;

  const { projects, currentId, setCurrentId, project, setProject, saving, createProject, removeProject, renameProject } =
    useProjectState(user.uid);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (saving === 'saved') {
      setToast('Gespeichert!');
      const t = setTimeout(() => setToast(null), 1200);
      return () => clearTimeout(t);
    }
  }, [saving]);

  // Vorschau: Navigation via CustomEvent (von Button)
  useEffect(() => {
    const fn = (e: any) => {
      const pid = e.detail?.pageId as string | undefined;
      if (!pid || !project) return;
      const idx = project.pages.findIndex((p) => p.id === pid);
      if (idx > -1) {
        setProject({ ...project, pages: [project.pages[idx], ...project.pages.filter((_, i) => i !== idx)] });
      }
    };
    window.addEventListener('appschmiede-nav', fn as any);
    return () => window.removeEventListener('appschmiede-nav', fn as any);
  }, [project]);

  const currentPageId = project?.pages[0]?.id;

  const addNode = (type: NodeType) => {
    if (!project || !currentPageId) return;
    const id = uid();
    const base: NodeBase = {
      id,
      type,
      frame: { x: 20, y: 20, w: type === 'text' ? 200 : 160, h: type === 'text' ? 40 : 48 },
      style: {},
      props: {},
    };
    const p: Project = {
      ...project,
      nodes: { ...project.nodes, [id]: base },
      pages: project.pages.map((pg, i) => (i === 0 ? { ...pg, nodeIds: [...pg.nodeIds, id] } : pg)),
    };
    setProject(p);
    setSelectedId(id);
  };

  const removeNode = () => {
    if (!project || !selectedId || !currentPageId) return;
    const { [selectedId]: _, ...rest } = project.nodes;
    setProject({
      ...project,
      nodes: rest,
      pages: project.pages.map((pg, i) => (i === 0 ? { ...pg, nodeIds: pg.nodeIds.filter((id) => id !== selectedId) } : pg)),
    });
    setSelectedId(null);
  };

  const addPage = () => {
    if (!project) return;
    setProject({ ...project, pages: [{ id: uid(), name: `Seite ${project.pages.length + 1}`, nodeIds: [] }, ...project.pages] });
  };

  const renameCurrentPage = (name: string) => {
    if (!project || !currentPageId) return;
    setProject({ ...project, pages: project.pages.map((pg, i) => (i === 0 ? { ...pg, name } : pg)) });
  };

  const deleteCurrentPage = () => {
    if (!project || project.pages.length <= 1) return;
    const remaining = project.pages.slice(1);
    const remainingIds = new Set(remaining.flatMap((p) => p.nodeIds));
    const newNodes: Record<string, NodeBase> = {};
    for (const [id, node] of Object.entries(project.nodes)) if (remainingIds.has(id)) newNodes[id] = node;
    setProject({ ...project, pages: remaining, nodes: newNodes });
    setSelectedId(null);
  };

  return (
    <div className="bg-neutral-950 text-neutral-100 min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center gap-3">
          <div className="font-semibold">AppSchmiede Editor</div>
          <div className="text-xs opacity-70">{project?.name || '—'}</div>
          <div className="ml-auto flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20" onClick={() => setPreview((v) => !v)}>
              {preview ? 'Bearbeiten' : 'Vorschau'}
            </button>
            <a className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20" href={`/preview/${project?.id}`} target="_blank">
              Preview-Link
            </a>
            <span className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10">
              {saving === 'saving' ? 'Speichert…' : saving === 'saved' ? 'Gespeichert' : 'Bereit'}
            </span>
            <button className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30" onClick={() => signOut(auth)}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-4 grid grid-cols-[280px_1fr_320px] gap-4">
        {/* Projekte & Toolbox */}
        <aside className="rounded-2xl border border-white/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Projekte</h2>
            <button onClick={createProject} className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20">
              Neu
            </button>
          </div>
          <div className="space-y-1 max-h-[40vh] overflow-auto">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setCurrentId(p.id)}
                className={`w-full text-left px-3 py-2 rounded-xl ${currentId === p.id ? 'bg-white/15' : 'hover:bg-white/10'} `}
              >
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs opacity-60">{new Date(p.updatedAt).toLocaleString()}</div>
              </button>
            ))}
          </div>
          {project && (
            <div className="mt-3 space-y-2">
              <input
                defaultValue={project.name}
                onBlur={(e) => renameProject(project.id, e.target.value)}
                className="w-full bg-neutral-800 rounded-xl px-3 py-2"
              />
              <button onClick={() => removeProject(project.id)} className="w-full px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30">
                Löschen
              </button>
            </div>
          )}

          <div className="mt-6">
            <Toolbox onAdd={addNode} />
          </div>
        </aside>

        {/* Canvas */}
        <section className="rounded-2xl border border-white/10 p-6 grid place-items-center relative">
          {project ? (
            <PhoneFrame>{project.pages[0] && <Canvas project={project} setProject={setProject} pageId={project.pages[0].id} selectedId={selectedId} setSelectedId={setSelectedId} preview={preview} />}</PhoneFrame>
          ) : (
            <div className="text-neutral-400">Kein Projekt ausgewählt.</div>
          )}
          {selectedId && !preview && (
            <button onClick={removeNode} className="absolute bottom-4 right-4 px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30">
              Element löschen
            </button>
          )}
          {toast && <div className="absolute top-4 right-4 text-sm px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">{toast}</div>}
        </section>

        {/* Properties */}
        <aside className="rounded-2xl border border-white/10 p-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Seiten</h2>
            <div className="flex gap-2">
              <button onClick={addPage} className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20">
                + Seite
              </button>
              <button onClick={deleteCurrentPage} className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20">
                Entf
              </button>
            </div>
          </div>
          {project && (
            <div className="space-y-2">
              <input
                className="w-full bg-neutral-800 rounded-xl px-3 py-2"
                value={project.pages[0].name}
                onChange={(e) => renameCurrentPage(e.target.value)}
              />
              <div className="text-xs text-neutral-400">Aktive Seite ist immer die erste in der Liste (Tabs folgen).</div>
            </div>
          )}

          <div className="h-px bg-white/10" />

          <h2 className="font-semibold">Eigenschaften</h2>
          {project && <PropertiesPanel node={selectedId ? project.nodes[selectedId] ?? null : null} project={project} setProject={setProject} />}
        </aside>
      </main>
    </div>
  );
}
