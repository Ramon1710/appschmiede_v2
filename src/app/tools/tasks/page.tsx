// src/app/tools/tasks/page.tsx  (Aufgabenverteilung für Master)
'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, where, updateDoc } from 'firebase/firestore';

type Task = {
  id?: string;
  title: string;
  projectId: string;
  userId: string; // Empfänger (UID)
  status: 'open' | 'doing' | 'done';
  createdAt?: any;
  updatedAt?: any;
};

export default function TasksPage() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [list, setList] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignee, setAssignee] = useState('');

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u ? { uid: u.uid, email: u.email } : null)), []);
  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => setList(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Task) }))));
  }, []);

  const createTask = async () => {
    if (!title.trim() || !projectId.trim() || !assignee.trim()) return;
    await addDoc(collection(db, 'tasks'), {
      title: title.trim(),
      projectId: projectId.trim(),
      userId: assignee.trim(),
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as Task);
    setTitle(''); setProjectId(''); setAssignee('');
  };

  const setStatus = async (id: string, status: Task['status']) => {
    await updateDoc(doc(db, 'tasks', id), { status, updatedAt: serverTimestamp() });
  };

  const removeTask = async (id: string) => {
    await deleteDoc(doc(db, 'tasks', id));
  };

  if (!user) return <main className="min-h-screen grid place-items-center bg-neutral-950 text-neutral-100 p-6">Bitte anmelden.</main>;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-semibold">Aufgaben</h1>

        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-4 grid md:grid-cols-4 gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel" className="rounded-xl bg-neutral-800 px-3 py-2" />
          <input value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="Projekt-ID" className="rounded-xl bg-neutral-800 px-3 py-2" />
          <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Empfänger-UID" className="rounded-xl bg-neutral-800 px-3 py-2" />
          <button onClick={createTask} className="rounded-xl bg-white/10 hover:bg-white/20 px-3 py-2">+ Anlegen</button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {(['open','doing','done'] as const).map((s) => (
            <div key={s} className="rounded-2xl border border-white/10 bg-neutral-900 p-3">
              <div className="font-semibold mb-2 uppercase text-xs">{s}</div>
              <div className="space-y-2">
                {list.filter((t) => t.status === s).map((t) => (
                  <div key={t.id} className="rounded-xl border border-white/10 p-2">
                    <div className="text-sm font-medium">{t.title}</div>
                    <div className="text-xs opacity-70">Projekt: {t.projectId}</div>
                    <div className="text-xs opacity-70 mb-2">User: {t.userId}</div>
                    <div className="flex gap-2">
                      {s !== 'open' && <button onClick={() => setStatus(t.id!, 'open')} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20">open</button>}
                      {s !== 'doing' && <button onClick={() => setStatus(t.id!, 'doing')} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20">doing</button>}
                      {s !== 'done' && <button onClick={() => setStatus(t.id!, 'done')} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20">done</button>}
                      <button onClick={() => removeTask(t.id!)} className="ml-auto px-2 py-1 rounded bg-rose-600 hover:bg-rose-500">Löschen</button>
                    </div>
                  </div>
                ))}
                {list.filter((t) => t.status === s).length === 0 && <div className="text-xs opacity-60">–</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
