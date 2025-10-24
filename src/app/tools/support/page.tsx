// src/app/tools/support/page.tsx  (Tickets / Helpdesk)
'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';

type Ticket = {
  id?: string;
  userId: string;
  email: string | null;
  subject: string;
  message: string;
  status: 'open' | 'closed';
  createdAt?: any;
  updatedAt?: any;
};

export default function SupportPage() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [list, setList] = useState<Ticket[]>([]);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u ? { uid: u.uid, email: u.email } : null)), []);
  const userId = user?.uid;

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'tickets'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => setList(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Ticket) }))));
  }, [userId]);

  const submit = async () => {
    if (!userId || !subject.trim() || !message.trim()) return;
    await addDoc(collection(db, 'tickets'), {
      userId,
      email: user?.email || null,
      subject: subject.trim(),
      message: message.trim(),
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as Ticket);
    setSubject(''); setMessage('');
  };

  const closeTicket = async (id: string) => {
    await updateDoc(doc(db, 'tickets', id), { status: 'closed', updatedAt: serverTimestamp() });
  };

  if (!userId) return <main className="min-h-screen grid place-items-center bg-neutral-950 text-neutral-100 p-6">Bitte anmelden.</main>;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold">Support</h1>

        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-4 space-y-2">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Betreff" className="w-full rounded-xl bg-neutral-800 px-3 py-2" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Nachricht" rows={4} className="w-full rounded-xl bg-neutral-800 px-3 py-2" />
          <button onClick={submit} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20">Ticket erstellen</button>
        </div>

        <div className="space-y-2">
          {list.map((t) => (
            <div key={t.id} className="rounded-2xl border border-white/10 bg-neutral-900 p-3">
              <div className="flex items-center gap-2">
                <div className="font-medium">{t.subject}</div>
                <div className="text-xs opacity-70">{t.status}</div>
                {t.status === 'open' && <button onClick={() => closeTicket(t.id!)} className="ml-auto px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">Schließen</button>}
              </div>
              <div className="text-sm opacity-80 mt-1 whitespace-pre-wrap">{t.message}</div>
            </div>
          ))}
          {list.length === 0 && <div className="text-sm opacity-60">Keine Tickets.</div>}
        </div>
      </div>
    </main>
  );
}
