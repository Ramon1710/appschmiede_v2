// src/app/tools/chat/page.tsx  (mit Bild-Upload)
'use client';
import { useEffect, useRef, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  addDoc, collection, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, where,
} from 'firebase/firestore';
import { storage } from '@/lib/storage';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

type Project = { id: string; name: string; ownerId: string };
type Message = {
  id?: string;
  projectId: string;
  userId: string;
  userEmail: string | null;
  text?: string;
  imageUrl?: string;
  createdAt?: any;
};

export default function ProjectChat() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u ? { uid: u.uid, email: u.email } : null)), []);
  const userId = user?.uid;

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'projects'), where('ownerId', '==', userId), orderBy('updatedAt', 'desc'), limit(50));
    getDocs(q).then((snap) => {
      const list = snap.docs.map((d) => d.data() as Project);
      setProjects(list);
      if (!projectId && list[0]) setProjectId(list[0].id);
    });
  }, [userId]);

  useEffect(() => {
    if (!projectId) return;
    const q = query(collection(db, 'projectChats', projectId, 'messages'), orderBy('createdAt', 'asc'), limit(500));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Message), id: d.id }));
      setMessages(list);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
  }, [projectId]);

  const send = async () => {
    if (!user || !projectId || (!text.trim() && !file)) return;

    let imageUrl: string | undefined;
    if (file) {
      const path = `chat/${projectId}/${user.uid}/${Date.now()}_${file.name}`;
      const r = ref(storage, path);
      await uploadBytes(r, file);
      imageUrl = await getDownloadURL(r);
    }

    await addDoc(collection(db, 'projectChats', projectId, 'messages'), {
      projectId,
      userId: user.uid,
      userEmail: user.email,
      text: text.trim() || undefined,
      imageUrl,
      createdAt: serverTimestamp(),
    } as Message);

    setText('');
    setFile(null);
  };

  if (!userId)
    return <main className="min-h-screen grid place-items-center bg-neutral-950 text-neutral-100 p-6">Bitte anmelden.</main>;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-neutral-900">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <h1 className="text-xl font-semibold">Projekt-Chat</h1>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="ml-auto rounded-xl bg-neutral-800 px-3 py-2">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="p-4 h-[60vh] overflow-y-auto space-y-2">
          {messages.map((m) => {
            const mine = m.userId === userId;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-emerald-600 text-white' : 'bg-white/10'}`} title={m.userEmail || ''}>
                  {m.text && <div>{m.text}</div>}
                  {m.imageUrl && <img src={m.imageUrl} alt="" className="rounded-lg mt-1 max-w-full" />}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="p-4 border-t border-white/10 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Nachricht schreiben…"
            className="flex-1 rounded-xl bg-neutral-800 px-3 py-2"
          />
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
          <button onClick={send} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20">Senden</button>
        </div>
      </div>
    </main>
  );
}
