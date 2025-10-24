// src/app/tools/analytics/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';

export default function AnalyticsPage() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [counts, setCounts] = useState<{ projects: number; times: number; chats: number }>({
    projects: 0,
    times: 0,
    chats: 0,
  });

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u ? { uid: u.uid, email: u.email } : null)), []);
  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const pSnap = await getCountFromServer(query(collection(db, 'projects'), where('ownerId', '==', uid)));
      const tSnap = await getCountFromServer(query(collection(db, 'times'), where('userId', '==', uid)));
      // Chats zählen: Summe aller Messages des Users (optional/annehmend)
      const cSnap = await getCountFromServer(query(collection(db, 'projectChats_flat'), where('userId', '==', uid))).catch(
        () => ({ data: () => ({ count: 0 }) } as any)
      );
      setCounts({ projects: pSnap.data().count, times: tSnap.data().count, chats: cSnap.data().count || 0 });
    })();
  }, [uid]);

  if (!uid)
    return (
      <main className="min-h-screen grid place-items-center bg-neutral-950 text-neutral-100 p-6">
        <div>Bitte anmelden.</div>
      </main>
    );

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-semibold">Analysen</h1>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-4">
            <div className="text-sm opacity-70">Projekte</div>
            <div className="text-3xl font-bold">{counts.projects}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-4">
            <div className="text-sm opacity-70">Zeitbuchungen</div>
            <div className="text-3xl font-bold">{counts.times}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-4">
            <div className="text-sm opacity-70">Chat-Nachrichten</div>
            <div className="text-3xl font-bold">{counts.chats}</div>
          </div>
        </div>
        <div className="text-xs opacity-60">
          Hinweis: Für Chats wird optional eine flache Sammlung <code>projectChats_flat</code> verwendet (Write-Trigger kann diese
          füllen). Wenn nicht vorhanden, zeigt der Zähler 0.
        </div>
      </div>
    </main>
  );
}
