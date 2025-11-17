// src/app/tools/templates/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Node, PageTree } from '@/lib/editorTypes';

type Template = {
  id: string;
  name: string;
  description: string;
  projectName: string;
  pages: Array<Omit<PageTree, 'id' | 'createdAt' | 'updatedAt'>>;
};

const fallbackId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`);

const defaultBackground = 'linear-gradient(135deg, #0b1220, #111827)';

const nodeSize: Record<Node['type'], { w: number; h: number }> = {
  text: { w: 296, h: 60 },
  button: { w: 220, h: 52 },
  image: { w: 296, h: 200 },
  input: { w: 296, h: 52 },
  container: { w: 296, h: 180 },
};

const makeNode = (type: Node['type'], overrides: Partial<Node> = {}): Node => {
  const size = nodeSize[type];
  return {
    id: overrides.id ?? fallbackId(),
    type,
    x: overrides.x ?? 24,
    y: overrides.y ?? 120,
    w: overrides.w ?? size.w,
    h: overrides.h ?? size.h,
    props: overrides.props ?? {},
    style: overrides.style ?? {},
    children: overrides.children ?? [],
  };
};

const withNavbar = (children: Node[], entries: Array<{ label: string; targetPage: string; icon?: string }>) => [
  makeNode('container', {
    y: 32,
    h: 64,
    props: {
      component: 'navbar',
      navItems: entries.map((entry) => ({
        id: fallbackId(),
        label: entry.label,
        icon: entry.icon,
        action: 'navigate',
        target: `#${entry.targetPage.toLowerCase()}`,
        targetPage: entry.targetPage,
      })),
    },
  }),
  ...children,
];

const stack = (items: Array<Partial<Node> & { type: Node['type'] }>, options?: { startY?: number; gap?: number }) => {
  const startY = options?.startY ?? 120;
  const gap = options?.gap ?? 24;
  let cursor = startY;
  return items.map((item) => {
    const node = makeNode(item.type, { ...item, y: cursor } as Partial<Node>);
    cursor += (node.h ?? 0) + gap;
    return node;
  });
};

const createCompanySuiteTemplate = (): Template => ({
  id: 'company-suite',
  name: 'Unternehmens-App',
  description: 'Dashboard, Zeiterfassung, Aufgaben & Kommunikation für dein Team.',
  projectName: 'Unternehmens-App',
  pages: [
    {
      name: 'Unternehmen',
      folder: 'Übersicht',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: defaultBackground },
        children: withNavbar(
          stack([
            {
              type: 'text',
              props: { text: 'Unternehmensübersicht' },
              style: { fontSize: 28, fontWeight: 600 },
            },
            {
              type: 'text',
              props: {
                text: 'Projekte, Zeiten und Benachrichtigungen auf einen Blick – immer aktuell für dein Führungsteam.',
              },
              style: { fontSize: 16, lineHeight: 1.5 },
              h: 84,
            },
            {
              type: 'container',
              props: {
                component: 'time-tracking',
                timeTracking: {
                  entries: [
                    { id: fallbackId(), label: 'Projekt Alpha', seconds: 5400, endedAt: new Date().toISOString() },
                    { id: fallbackId(), label: 'Projekt Beta', seconds: 3600, startedAt: new Date().toISOString() },
                  ],
                },
              },
              h: 200,
            },
            {
              type: 'container',
              props: {
                component: 'task-manager',
                tasks: [
                  { id: fallbackId(), title: 'Kundentermin vorbereiten', done: false },
                  { id: fallbackId(), title: 'Sprint-Review freigeben', done: true },
                ],
              },
              h: 200,
            },
          ]),
          [
            { label: 'Dashboard', targetPage: 'Unternehmen', icon: '📊' },
            { label: 'Zeiten', targetPage: 'Zeiterfassung', icon: '⏱️' },
            { label: 'Aufgaben', targetPage: 'Aufgaben', icon: '✅' },
            { label: 'Chat', targetPage: 'Kommunikation', icon: '💬' },
          ]
        ),
      },
    },
    {
      name: 'Zeiterfassung',
      folder: 'Team',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#091322,#152846)' },
        children: withNavbar(
          stack([
            {
              type: 'text',
              props: { text: 'Zeiterfassung pro Projekt' },
              style: { fontSize: 26, fontWeight: 600 },
            },
            {
              type: 'container',
              props: {
                component: 'time-tracking',
                timeTracking: {
                  entries: [
                    {
                      id: fallbackId(),
                      label: 'Projekt Atlas – Konzept',
                      seconds: 7200,
                      startedAt: new Date(Date.now() - 7200 * 1000).toISOString(),
                      endedAt: new Date().toISOString(),
                    },
                    {
                      id: fallbackId(),
                      label: 'Projekt Atlas – Entwicklung',
                      seconds: 3600,
                      startedAt: new Date().toISOString(),
                    },
                  ],
                },
              },
              h: 220,
            },
            {
              type: 'container',
              props: {
                component: 'folder-structure',
                folderTree: [
                  { id: fallbackId(), name: 'Projekt Atlas', children: [{ id: fallbackId(), name: 'Sprint 1' }] },
                  { id: fallbackId(), name: 'Projekt Nova', children: [{ id: fallbackId(), name: 'Design' }] },
                ],
              },
              h: 220,
            },
          ]),
          [
            { label: 'Dashboard', targetPage: 'Unternehmen' },
            { label: 'Zeiten', targetPage: 'Zeiterfassung', icon: '⏱️' },
            { label: 'Aufgaben', targetPage: 'Aufgaben', icon: '✅' },
          ]
        ),
      },
    },
    {
      name: 'Aufgaben',
      folder: 'Team',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#101828,#1f2638)' },
        children: withNavbar(
          stack([
            {
              type: 'text',
              props: { text: 'Aufgaben & Benachrichtigungen' },
              style: { fontSize: 26, fontWeight: 600 },
            },
            {
              type: 'container',
              props: {
                component: 'task-manager',
                tasks: [
                  { id: fallbackId(), title: 'Marketing-Kampagne briefen', done: false },
                  { id: fallbackId(), title: 'Feedbackrunde Team', done: false },
                ],
              },
              h: 220,
            },
            {
              type: 'container',
              props: {
                component: 'todo',
                todoItems: [
                  { id: fallbackId(), title: 'Benachrichtigung: Alex neue Aufgabe', done: false },
                  { id: fallbackId(), title: 'Reminder: Arbeitszeit bestätigen', done: false },
                ],
              },
              h: 200,
            },
          ]),
          [
            { label: 'Dashboard', targetPage: 'Unternehmen' },
            { label: 'Zeiten', targetPage: 'Zeiterfassung' },
            { label: 'Aufgaben', targetPage: 'Aufgaben', icon: '✅' },
          ]
        ),
      },
    },
    {
      name: 'Kommunikation',
      folder: 'Team',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#10172a,#1a1f3b)' },
        children: withNavbar(
          stack([
            {
              type: 'text',
              props: { text: 'Team-Chat & Projektkommunikation' },
              style: { fontSize: 26, fontWeight: 600 },
            },
            { type: 'container', props: { component: 'chat' }, h: 240 },
            { type: 'button', props: { label: 'Bild hochladen', action: 'upload-photo' } },
            {
              type: 'container',
              props: {
                component: 'support',
                supportChannel: 'chat',
                supportTarget: 'support@unternehmen.app',
              },
              h: 160,
            },
          ]),
          [
            { label: 'Dashboard', targetPage: 'Unternehmen' },
            { label: 'Chat', targetPage: 'Kommunikation', icon: '💬' },
          ]
        ),
      },
    },
  ],
});

const createChatAppTemplate = (): Template => ({
  id: 'team-chat',
  name: 'Teamchat & Support',
  description: 'Login, Chatfenster, Support-Tickets und Upload-Aktionen in einem Paket.',
  projectName: 'Teamchat',
  pages: [
    {
      name: 'Start',
      folder: 'Übersicht',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(140deg,#0b1120,#1f2a40)' },
        children: withNavbar(
          stack([
            { type: 'text', props: { text: 'Willkommen im Teamchat' }, style: { fontSize: 28, fontWeight: 600 } },
            {
              type: 'text',
              props: {
                text: 'Bleib verbunden, starte Projekt-Chats und verwalte Support-Anfragen mit einem Fingertipp.',
              },
              style: { fontSize: 16 },
              h: 80,
            },
            { type: 'button', props: { label: 'Zum Chat', action: 'navigate', targetPage: 'Chat', target: 'chat' } },
            { type: 'button', props: { label: 'Registrieren', action: 'register' } },
            { type: 'button', props: { label: 'Login', action: 'login' } },
          ]),
          [
            { label: 'Start', targetPage: 'Start', icon: '🏠' },
            { label: 'Chat', targetPage: 'Chat', icon: '💬' },
            { label: 'Support', targetPage: 'Support', icon: '🎫' },
          ]
        ),
      },
    },
    {
      name: 'Chat',
      folder: 'Kommunikation',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(140deg,#101926,#1d2a3d)' },
        children: withNavbar(
          stack([
            { type: 'text', props: { text: 'Projektchat' }, style: { fontSize: 26, fontWeight: 600 } },
            { type: 'container', props: { component: 'chat' }, h: 280 },
            { type: 'button', props: { label: 'Bild senden', action: 'upload-photo' } },
            { type: 'button', props: { label: 'Audio aufnehmen', action: 'record-audio' } },
          ]),
          [
            { label: 'Start', targetPage: 'Start' },
            { label: 'Chat', targetPage: 'Chat', icon: '💬' },
          ]
        ),
      },
    },
    {
      name: 'Support',
      folder: 'Kommunikation',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(140deg,#0c1624,#14263c)' },
        children: withNavbar(
          stack([
            { type: 'text', props: { text: 'Support & Tickets' }, style: { fontSize: 26, fontWeight: 600 } },
            {
              type: 'container',
              props: {
                component: 'support',
                supportChannel: 'ticket',
                supportTarget: 'support@teamchat.app',
                supportTickets: [
                  {
                    id: fallbackId(),
                    subject: 'Datei-Upload funktioniert nicht',
                    message: 'Bitte prüfen, ob die 10MB-Grenze erreicht ist.',
                    createdAt: new Date().toISOString(),
                    channel: 'ticket',
                  },
                ],
              },
              h: 220,
            },
          ]),
          [
            { label: 'Start', targetPage: 'Start' },
            { label: 'Support', targetPage: 'Support', icon: '🎫' },
          ]
        ),
      },
    },
  ],
});

const createEventTemplate = (): Template => ({
  id: 'event-planner',
  name: 'Event & Community',
  description: 'Kalender, Karte, QR-Einlass und Aufgabenliste für dein nächstes Event.',
  projectName: 'Event-App',
  pages: [
    {
      name: 'Event',
      folder: 'Events',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#0a1424,#1d2b45)' },
        children: withNavbar(
          stack([
            { type: 'text', props: { text: 'Event Hub' }, style: { fontSize: 28, fontWeight: 600 } },
            { type: 'container', props: { component: 'calendar', calendarFocusDate: new Date().toISOString() }, h: 240 },
            { type: 'container', props: { component: 'map', mapLocation: 'Berlin, Germany' }, h: 220 },
            { type: 'container', props: { component: 'qr-code', qrUrl: 'https://example.com/tickets' }, h: 160 },
          ]),
          [
            { label: 'Event', targetPage: 'Event', icon: '🎟️' },
            { label: 'Tasks', targetPage: 'Orga', icon: '🛠️' },
          ]
        ),
      },
    },
    {
      name: 'Orga',
      folder: 'Events',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#10172a,#1d2a3d)' },
        children: withNavbar(
          stack([
            { type: 'text', props: { text: 'Event Organisation' }, style: { fontSize: 26, fontWeight: 600 } },
            {
              type: 'container',
              props: {
                component: 'task-manager',
                tasks: [
                  { id: fallbackId(), title: 'Catering bestätigen', done: false },
                  { id: fallbackId(), title: 'Location dekorieren', done: false },
                  { id: fallbackId(), title: 'Speaker einweisen', done: true },
                ],
              },
              h: 220,
            },
            {
              type: 'container',
              props: {
                component: 'audio-recorder',
                audioNotes: [],
              },
              h: 200,
            },
          ]),
          [
            { label: 'Event', targetPage: 'Event' },
            { label: 'Tasks', targetPage: 'Orga', icon: '🛠️' },
          ]
        ),
      },
    },
  ],
});

const templates: Template[] = [createCompanySuiteTemplate(), createChatAppTemplate(), createEventTemplate()];

export default function TemplatesPage() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u ? { uid: u.uid, email: u.email } : null)), []);

  if (!user)
    return (
      <main className="min-h-screen grid place-items-center bg-neutral-950 text-neutral-100 p-6">
        Bitte anmelden.
      </main>
    );

  const createFromTemplate = async (tpl: Template) => {
    const projectId = fallbackId();

    await setDoc(doc(db, 'projects', projectId), {
      name: tpl.projectName,
      ownerId: user.uid,
      ownerUid: user.uid,
      members: [user.uid],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    for (const templatePage of tpl.pages) {
      const pageId = fallbackId();
      await setDoc(doc(collection(db, 'projects', projectId, 'pages'), pageId), {
        name: templatePage.name,
        folder: templatePage.folder ?? null,
        tree: templatePage.tree,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    window.alert(`Projekt "${tpl.projectName}" erstellt. Du wirst zum Editor weitergeleitet.`);
    window.location.href = `/editor?projectId=${projectId}`;
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold">Vorlagenbibliothek</h1>
          <p className="text-sm text-neutral-400">
            Starte schneller mit vorgefertigten Projekten. Jede Vorlage nutzt die gleichen Bausteine wie dein Editor und kann direkt
            weiter angepasst werden.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {templates.map((tpl) => (
            <div key={tpl.id} className="rounded-2xl border border-white/10 bg-neutral-900/80 p-4 shadow-lg shadow-black/30">
              <div className="text-lg font-medium text-neutral-100">{tpl.name}</div>
              <div className="mt-1 text-sm text-neutral-400">{tpl.description}</div>
              <button
                type="button"
                onClick={() => createFromTemplate(tpl)}
                className="mt-4 w-full rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-neutral-100 transition hover:bg-white/20"
              >
                Projekt erstellen
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
