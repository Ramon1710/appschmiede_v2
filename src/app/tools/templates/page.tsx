// src/app/tools/templates/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

type Template = {
  id: string;
  name: string;
  description: string;
  project: any;
};

const uid = () => `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;

// einfache Demo-Templates
const templates: Template[] = [
  {
    id: 'simple-landing',
    name: 'Simple Landing',
    description: 'Startseite mit Titel, Bild und Call-to-Action.',
    project: () => {
      const pId = uid();
      const pageId = uid();
      const tId = uid();
      const bId = uid();
      const iId = uid();
      return {
        id: pId,
        name: 'Landing',
        pages: [{ id: pageId, name: 'Start', nodeIds: [tId, iId, bId] }],
        nodes: {
          [tId]: { id: tId, type: 'text', frame: { x: 24, y: 40, w: 320, h: 48 }, props: { text: 'Willkommen bei AppSchmiede' }, style: { fontSize: 20 } },
          [iId]: { id: iId, type: 'image', frame: { x: 24, y: 100, w: 340, h: 200 }, props: { src: 'https://picsum.photos/800/600' } },
          [bId]: { id: bId, type: 'button', frame: { x: 24, y: 320, w: 200, h: 48 }, props: { label: 'Loslegen' } },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    },
  },
  {
    id: 'profile-form',
    name: 'Profil / Formular',
    description: 'Profilseite mit Eingabefeldern.',
    project: () => {
      const pId = uid();
      const pageId = uid();
      const tId = uid();
      const n1 = uid();
      const n2 = uid();
      const n3 = uid();
      return {
        id: pId,
        name: 'Profil',
        pages: [{ id: pageId, name: 'Profil', nodeIds: [tId, n1, n2, n3] }],
        nodes: {
          [tId]: { id: tId, type: 'text', frame: { x: 24, y: 24, w: 300, h: 40 }, props: { text: 'Dein Profil' }, style: { fontSize: 20 } },
          [n1]: { id: n1, type: 'input', frame: { x: 24, y: 80, w: 320, h: 44 }, props: { placeholder: 'Name' } },
          [n2]: { id: n2, type: 'input', frame: { x: 24, y: 132, w: 320, h: 44 }, props: { placeholder: 'E-Mail' } },
          [n3]: { id: n3, type: 'button', frame: { x: 24, y: 188, w: 200, h: 44 }, props: { label: 'Speichern' } },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    },
  },
];

export default function TemplatesPage() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u ? { uid: u.uid, email: u.email } : null)), []);
  if (!user) return <main className="min-h-screen grid place-items-center bg-neutral-950 text-neutral-100 p-6">Bitte anmelden.</main>;

  const createFromTemplate = async (tpl: Template) => {
    const data = tpl.project();
    await setDoc(doc(db, 'projects', data.id), {
      ...data,
      ownerId: user.uid,
      _serverUpdatedAt: serverTimestamp(),
    });
    alert(`Projekt "${data.name}" erstellt (ID: ${data.id}).`);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold mb-4">Vorlagen</h1>
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="rounded-2xl border border-white/10 bg-neutral-900 p-4">
              <div className="font-medium">{t.name}</div>
              <div className="text-sm opacity-70 mb-3">{t.description}</div>
              <button onClick={() => createFromTemplate(t)} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20">
                Projekt erstellen
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
