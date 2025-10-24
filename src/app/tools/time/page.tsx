// src/app/tools/time/page.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

type TimeEntry = {
  id?: string;
  userId: string;
  projectId: string;
  projectName: string;
  start: number; // ms
  end: number | null; // ms
  note?: string;
  createdAt?: any;
  updatedAt?: any;
};

type Project = { id: string; name: string; ownerId: string };

const uid = () => `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;

export default function TimeTrackerPage() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [running, setRunning] = useState<TimeEntry | null>(null);

  // auth
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u ? { uid: u.uid, email: u.email } : null)), []);
  const userId = user?.uid;

  // load projects for this user
  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'projects'), where('ownerId', '==', userId), orderBy('updatedAt', 'desc'), limit(50));
    getDocs(q).then((snap) => {
      const list = snap.docs.map((d) => d.data() as Project);
      setProjects(list);
      if (!projectId && list[0]) setProjectId(list[0].id);
    });
  }, [userId]);

  // subscribe to my time entries
  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'times'), where('userId', '==', userId), orderBy('start', 'desc'), limit(100));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as TimeEntry), id: d.id }));
      setEntries(list);
      setRunning(list.find((e) => e.end === null) ?? null);
    });
  }, [userId]);

  const currentProjectName = useMemo(
    () => projects.find((p) => p.id === projectId)?.name ?? 'Unbekannt',
    [projects, projectId]
  );

  const startTimer = async () => {
    if (!userId || !projectId) return;
    if (running) return;
    const entry: TimeEntry = {
      userId,
      projectId,
      projectName: currentProjectName,
      start: Date.now(),
      end: null,
      note: note || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'times'), entry);
    setNote('');
  };

  const stopTimer = async () => {
    if (!running?.id) return;
    await updateDoc(doc(db, 'times', running.id), { end: Date.now(), updatedAt: serverTimestamp() });
  };

  const addManual = async () => {
    if (!userId || !projectId) return;
    const start = prompt('Start (YYYY-MM-DD HH:mm, 24h)') || '';
    const end = prompt('Ende (YYYY-MM-DD HH:mm, 24h)') || '';
    if (!start || !end) return;
    const toMs = (s: string) => new Date(s.replace(' ', 'T') + ':00').getTime();
    const entry: TimeEntry = {
      userId,
      projectId,
      projectName: currentProjectName,
      start: toMs(start),
      end: toMs(end),
      note: note || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'times'), entry);
    setNote('');
  };

  const fmt = (ms: number) => new Date(ms).toLocaleString();
  const dur = (s: number, e: number | null) => {
    if (!e) return 'läuft…';
    const d = Math.max(0, e - s);
    const h = Math.floor(d / 3600000);
    const m = Math.floor((d % 3600000) / 60000);
    return `${h}h ${m}m`;
    };

  if (!userId)
    return (
      <main className="min-h-screen grid place-items-center bg-neutral-950 text-neutral-100 p-6">
        <div>Melde dich bitte zuerst an.</div>
      </main>
    );

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Zeiterfassung</h1>
          <span className="text-xs opacity-70 ml-auto">{user?.email}</span>
        </header>

        <section className="rounded-2xl border border-white/10 bg-neutral-900 p-4 space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs block mb-1">Projekt</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-xl bg-neutral-800 px-3 py-2"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs block mb-1">Notiz (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl bg-neutral-800 px-3 py-2"
                placeholder="z. B. Feature X umgesetzt"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!running ? (
              <button onClick={startTimer} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500">
                ▶ Start
              </button>
            ) : (
              <button onClick={stopTimer} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500">
                ⏹ Stop
              </button>
            )}
            <button onClick={addManual} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20">
              ⌛ Manuell erfassen
            </button>
            {running && (
              <span className="text-sm opacity-80">
                Läuft seit: {fmt(running.start)} ({dur(running.start, Date.now())})
              </span>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-neutral-900 p-4">
          <h2 className="font-semibold mb-3">Letzte Buchungen</h2>
          <div className="divide-y divide-white/10">
            {entries.map((e) => (
              <div key={e.id} className="py-2 grid md:grid-cols-5 gap-2 text-sm">
                <div className="font-medium">{e.projectName}</div>
                <div>Start: {fmt(e.start)}</div>
                <div>Ende: {e.end ? fmt(e.end) : '—'}</div>
                <div>Dauer: {dur(e.start, e.end)}</div>
                <div className="opacity-70">{e.note || ''}</div>
              </div>
            ))}
            {entries.length === 0 && <div className="py-6 text-center opacity-70">Noch keine Zeiten erfasst.</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
