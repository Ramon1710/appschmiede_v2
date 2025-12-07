// src/app/tools/templates/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Node, PageTree } from '@/lib/editorTypes';
import Header from '@/components/Header';
import UnauthenticatedScreen from '@/components/UnauthenticatedScreen';
import GuidedTour from '@/components/GuidedTour';

type Template = {
  id: string;
  name: string;
  description: string;
  projectName: string;
  pages: Array<Omit<PageTree, 'id' | 'createdAt' | 'updatedAt'>>;
  source?: 'builtin' | 'custom';
  createdBy?: string;
};

const TEMPLATE_ADMIN_EMAILS = ['ramon.mueler@gmx.ch', 'admin.admin@appschmiede.com'];

class TemplatesErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message: string }>
{
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, message: error instanceof Error ? error.message : 'Unbekannter Fehler' };
  }

  componentDidCatch(error: unknown, info: any) {
    console.error('Vorlagen-Rendering fehlgeschlagen', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          Vorlagen konnten nicht geladen werden. Bitte Seite neu laden. Fehler: {this.state.message}
        </div>
      );
    }
    return this.props.children;
  }
}

const fallbackId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;

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

const withNavbar = (
  children: Node[],
  entries: Array<{ label: string; targetPage: string; icon?: string }>,
  options?: { width?: number; height?: number; y?: number }
) => [
  makeNode('container', {
    y: options?.y ?? 16,
    h: options?.height ?? 120,
    w: options?.width ?? 520,
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

const stack = (
  items: Array<Partial<Node> & { type: Node['type'] }>,
  options?: { startY?: number; gap?: number }
) => {
  const startY = options?.startY ?? 120;
  const gap = options?.gap ?? 24;
  let cursor = startY;
  return items.map((item) => {
    const node = makeNode(item.type, { ...item, y: cursor } as Partial<Node>);
    cursor += (node.h ?? 0) + gap;
    return node;
  });
};

const createAuthPages = (appName: string, options?: { background?: string }): Template['pages'] => {
  const bg = options?.background ?? 'linear-gradient(140deg,#050c18,#111f2f)';
  const baseText = `Willkommen bei ${appName}`;
  const paragraph = `${appName} schützt deinen Workspace. Melde dich an oder lege ein neues Team an.`;

  const login: Template['pages'][number] = {
    name: 'Login',
    folder: 'Auth',
    tree: {
      id: 'root',
      type: 'container',
      props: { bg },
      children: stack(
        [
          { type: 'text', props: { text: baseText }, style: { fontSize: 28, fontWeight: 600 } },
          {
            type: 'text',
            h: 64,
            props: { text: paragraph },
            style: { fontSize: 15, color: '#cbd5f5', lineHeight: 1.5 },
          },
          { type: 'input', props: { placeholder: 'E-Mail-Adresse', inputType: 'email' } },
          { type: 'input', props: { placeholder: 'Passwort', inputType: 'password' } },
          { type: 'button', props: { label: 'Login', action: 'login' } },
          {
            type: 'button',
            w: 260,
            props: { label: 'Passwort vergessen', action: 'navigate', targetPage: 'Passwort Reset' },
          },
          {
            type: 'button',
            w: 260,
            props: { label: 'Jetzt registrieren', action: 'navigate', targetPage: 'Registrierung' },
          },
        ],
        { startY: 80 }
      ),
    },
  };

  const register: Template['pages'][number] = {
    name: 'Registrierung',
    folder: 'Auth',
    tree: {
      id: 'root',
      type: 'container',
      props: { bg },
      children: stack(
        [
          { type: 'text', props: { text: `Konto erstellen – ${appName}` }, style: { fontSize: 28, fontWeight: 600 } },
          {
            type: 'text',
            h: 64,
            props: { text: 'Lade dein Team ein, sichere Projekte und verwalte Zugänge.' },
            style: { fontSize: 15, color: '#d7e4ff' },
          },
          { type: 'input', props: { placeholder: 'Vorname', inputType: 'text' } },
          { type: 'input', props: { placeholder: 'Nachname', inputType: 'text' } },
          { type: 'input', props: { placeholder: 'Unternehmen oder Team', inputType: 'text' } },
          { type: 'input', props: { placeholder: 'E-Mail', inputType: 'email' } },
          { type: 'input', props: { placeholder: 'Passwort', inputType: 'password' } },
          { type: 'button', props: { label: 'Registrieren', action: 'register' } },
        ],
        { startY: 80 }
      ),
    },
  };

  const reset: Template['pages'][number] = {
    name: 'Passwort Reset',
    folder: 'Auth',
    tree: {
      id: 'root',
      type: 'container',
      props: { bg },
      children: stack(
        [
          { type: 'text', props: { text: 'Passwort vergessen?' }, style: { fontSize: 28, fontWeight: 600 } },
          {
            type: 'text',
            h: 72,
            props: {
              text: 'Gib deine E-Mail-Adresse ein und wir schicken dir direkt einen Link zum Zurücksetzen.',
            },
            style: { fontSize: 15, color: '#dbeafe' },
          },
          { type: 'input', props: { placeholder: 'E-Mail-Adresse', inputType: 'email' } },
          { type: 'button', props: { label: 'Link senden', action: 'reset-password' } },
          {
            type: 'button',
            w: 240,
            props: { label: 'Zurück zum Login', action: 'navigate', targetPage: 'Login' },
          },
        ],
        { startY: 80 }
      ),
    },
  };

  return [login, register, reset];
};

const withAuthPages = (appName: string, pages: Template['pages'], options?: { background?: string }) => [
  ...createAuthPages(appName, options),
  ...pages,
];

const createCompanySuiteTemplate = (): Template => ({
  id: 'company-suite',
  name: 'Unternehmens-App',
  description: 'Login, Registrierung, Reset, Dashboard plus Zeit, Aufgaben, Mitarbeitertracking, Projektstruktur und Chat.',
  projectName: 'Unternehmens-App',
  pages: (() => {
    const navItems = [
      { label: 'Dashboard', targetPage: 'Dashboard', icon: '📊' },
      { label: 'Zeiten', targetPage: 'Zeiterfassung', icon: '⏱️' },
      { label: 'Aufgaben', targetPage: 'Aufgaben', icon: '✅' },
      { label: 'Mitarbeiter', targetPage: 'Mitarbeiter-Tracking', icon: '🧑‍💼' },
      { label: 'Projektstruktur', targetPage: 'Projektstruktur', icon: '🗂️' },
      { label: 'Chat', targetPage: 'Chat', icon: '💬' },
    ];

    const authPages: Template['pages'] = [
      {
        name: 'Login',
        folder: 'Onboarding',
        tree: {
          id: 'root',
          type: 'container',
          props: { bg: 'linear-gradient(135deg,#050910,#0f1b2e)' },
          children: stack(
            [
              {
                type: 'text',
                h: 120,
                w: 540,
                props: { text: 'Willkommen in der Unternehmens-App' },
                style: { fontSize: 34, fontWeight: 700 },
              },
              {
                type: 'text',
                h: 128,
                w: 540,
                props: {
                  text: 'Verwalte Projekte, Zeiten und Team-Kommunikation. Bitte melde dich mit deinen Unternehmensdaten an.',
                },
                style: { fontSize: 17, lineHeight: 1.6, color: '#cbd5f5' },
              },
              { type: 'input', props: { placeholder: 'Unternehmens-E-Mail', inputType: 'email' } },
              { type: 'input', props: { placeholder: 'Passwort', inputType: 'password' } },
              { type: 'button', props: { label: 'Einloggen', action: 'login' } },
              { type: 'button', props: { label: 'Passwort vergessen', action: 'navigate', targetPage: 'Passwort Reset' } },
              { type: 'button', props: { label: 'Jetzt registrieren', action: 'navigate', targetPage: 'Registrierung' } },
            ],
            { startY: 80 }
          ),
        },
      },
      {
        name: 'Registrierung',
        folder: 'Onboarding',
        tree: {
          id: 'root',
          type: 'container',
          props: { bg: 'linear-gradient(135deg,#050c18,#112034)' },
          children: stack(
            [
              { type: 'text', props: { text: 'Neues Team anlegen' }, style: { fontSize: 28, fontWeight: 600 } },
              {
                type: 'text',
                h: 70,
                props: { text: 'Erstelle einen Zugang für dein Team und lade Kolleg:innen ein.' },
                style: { fontSize: 15, color: '#d7e4ff' },
              },
              { type: 'input', props: { placeholder: 'Vorname', inputType: 'text' } },
              { type: 'input', props: { placeholder: 'Nachname', inputType: 'text' } },
              { type: 'input', props: { placeholder: 'Unternehmen oder Team', inputType: 'text' } },
              { type: 'input', props: { placeholder: 'E-Mail', inputType: 'email' } },
              { type: 'input', props: { placeholder: 'Passwort', inputType: 'password' } },
              { type: 'button', props: { label: 'Registrieren', action: 'register' } },
              { type: 'button', props: { label: 'Zurück zum Login', action: 'navigate', targetPage: 'Login' } },
            ],
            { startY: 80 }
          ),
        },
      },
      {
        name: 'Passwort Reset',
        folder: 'Onboarding',
        tree: {
          id: 'root',
          type: 'container',
          props: { bg: 'linear-gradient(135deg,#040b15,#0f1d30)' },
          children: stack(
            [
              { type: 'text', props: { text: 'Passwort vergessen?' }, style: { fontSize: 28, fontWeight: 600 } },
              {
                type: 'text',
                h: 72,
                props: {
                  text: 'Gib deine E-Mail-Adresse ein und wir schicken dir einen Link zum Zurücksetzen.',
                },
                style: { fontSize: 15, color: '#dbeafe' },
              },
              { type: 'input', props: { placeholder: 'E-Mail-Adresse', inputType: 'email' } },
              { type: 'button', props: { label: 'Link senden', action: 'reset-password' } },
              { type: 'button', props: { label: 'Zurück zum Login', action: 'navigate', targetPage: 'Login' } },
            ],
            { startY: 80 }
          ),
        },
      },
    ];

    const dashboardPage: Template['pages'][number] = {
      name: 'Dashboard',
      folder: 'Übersicht',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: defaultBackground },
        children: withNavbar(
          stack(
            [
              {
                type: 'text',
                h: 120,
                w: 560,
                props: { text: 'Unternehmens-Dashboard' },
                style: { fontSize: 34, fontWeight: 700 },
              },
              {
                type: 'text',
                props: {
                  text: 'Wähle die gewünschte Seite und springe direkt in Zeiten, Aufgaben, Mitarbeitertracking, Struktur oder Chat.',
                },
                style: { fontSize: 17, lineHeight: 1.6 },
                h: 132,
                w: 560,
              },
              { type: 'button', props: { label: 'Zu Zeiterfassung', action: 'navigate', targetPage: 'Zeiterfassung' }, w: 240 },
              { type: 'button', props: { label: 'Zu Aufgaben', action: 'navigate', targetPage: 'Aufgaben' }, w: 240 },
              { type: 'button', props: { label: 'Mitarbeiter-Tracking öffnen', action: 'navigate', targetPage: 'Mitarbeiter-Tracking' }, w: 240 },
              { type: 'button', props: { label: 'Projektstruktur öffnen', action: 'navigate', targetPage: 'Projektstruktur' }, w: 240 },
              { type: 'button', props: { label: 'Zum Chat', action: 'navigate', targetPage: 'Chat' }, w: 240 },
            ],
            { startY: 170, gap: 18 }
          ),
          navItems
        ),
      },
    };

    const timePage: Template['pages'][number] = {
      name: 'Zeiterfassung',
      folder: 'Team',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#091322,#152846)' },
        children: withNavbar(
          stack(
            [
              { type: 'button', props: { label: 'Zum Dashboard', action: 'navigate', targetPage: 'Dashboard' }, w: 240 },
              { type: 'text', h: 110, w: 540, props: { text: 'Zeiterfassung pro Projekt' }, style: { fontSize: 32, fontWeight: 700 } },
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
                h: 440,
              },
            ],
            { startY: 170, gap: 20 }
          ),
          navItems
        ),
      },
    };

    const tasksPage: Template['pages'][number] = {
      name: 'Aufgaben',
      folder: 'Team',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#101828,#1f2638)' },
        children: withNavbar(
          stack(
            [
              { type: 'button', props: { label: 'Zurück zum Dashboard', action: 'navigate', targetPage: 'Dashboard' }, w: 240 },
              { type: 'text', h: 110, w: 540, props: { text: 'Aufgaben & Benachrichtigungen' }, style: { fontSize: 32, fontWeight: 700 } },
              {
                type: 'container',
                props: {
                  component: 'task-manager',
                  tasks: [
                    { id: fallbackId(), title: 'Marketing-Kampagne briefen', done: false },
                    { id: fallbackId(), title: 'Feedbackrunde Team', done: false },
                    { id: fallbackId(), title: 'Release freigeben', done: true },
                  ],
                },
                h: 260,
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
            ],
            { startY: 170, gap: 20 }
          ),
          navItems
        ),
      },
    };

    const employeePage: Template['pages'][number] = {
      name: 'Mitarbeiter-Tracking',
      folder: 'Team',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#0b1220,#0f1d32)' },
        children: withNavbar(
          stack(
            [
              { type: 'button', props: { label: 'Zurück zum Dashboard', action: 'navigate', targetPage: 'Dashboard' }, w: 240 },
              { type: 'text', h: 110, w: 540, props: { text: 'Teamstatus & Standorte' }, style: { fontSize: 32, fontWeight: 700 } },
              {
                type: 'container',
                props: {
                  component: 'map',
                  mapLocation: 'Berlin, Germany',
                  mapInfo: 'Letzte Positionen deiner Mitarbeiter',
                  mapActionLabel: 'Live-Standort aktualisieren',
                },
                h: 320,
              },
            ],
            { startY: 170, gap: 20 }
          ),
          navItems
        ),
      },
    };

    const projectStructurePage: Template['pages'][number] = {
      name: 'Projektstruktur',
      folder: 'Projekte',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#0b1220,#111827)' },
        children: withNavbar(
          stack(
            [
              { type: 'button', props: { label: 'Zurück zum Dashboard', action: 'navigate', targetPage: 'Dashboard' }, w: 240 },
              { type: 'text', h: 80, w: 340, props: { text: 'Projektordner & Assets' }, style: { fontSize: 28, fontWeight: 700 } },
              {
                type: 'container',
                props: {
                  component: 'folder-structure',
                  folderTree: [
                    { id: fallbackId(), name: 'Projekt Atlas', children: [{ id: fallbackId(), name: 'Design' }] },
                    { id: fallbackId(), name: 'Projekt Nova', children: [{ id: fallbackId(), name: 'Development' }] },
                    { id: fallbackId(), name: 'Projekt Helix', children: [{ id: fallbackId(), name: 'QA' }] },
                  ],
                },
                h: 320,
              },
              {
                type: 'container',
                props: {
                  component: 'todo',
                  todoItems: [
                    { id: fallbackId(), title: 'Ordnerberechtigungen prüfen', done: false },
                    { id: fallbackId(), title: 'Assets aktualisieren', done: false },
                  ],
                },
                h: 180,
              },
            ],
            { startY: 170, gap: 20 }
          ),
          navItems
        ),
      },
    };

    const chatPage: Template['pages'][number] = {
      name: 'Chat',
      folder: 'Team',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#10172a,#1a1f3b)' },
        children: withNavbar(
          stack(
            [
              { type: 'button', props: { label: 'Zurück zum Dashboard', action: 'navigate', targetPage: 'Dashboard' }, w: 240 },
              { type: 'text', h: 80, w: 340, props: { text: 'Team-Chat & Projektkommunikation' }, style: { fontSize: 28, fontWeight: 700 } },
              { type: 'container', props: { component: 'chat' }, h: 520 },
              { type: 'button', props: { label: 'Bild hochladen', action: 'upload-photo' } },
              {
                type: 'container',
                props: {
                  component: 'support',
                  supportChannel: 'chat',
                  supportTarget: 'support@unternehmen.app',
                },
                h: 180,
              },
            ],
            { startY: 170, gap: 18 }
          ),
          navItems
        ),
      },
    };

    return [
      ...authPages,
      dashboardPage,
      timePage,
      tasksPage,
      employeePage,
      projectStructurePage,
      chatPage,
    ];
  })(),
});

const createChatAppTemplate = (): Template => ({
  id: 'team-chat',
  name: 'Teamchat & Support',
  description: 'Login, Chatfenster, Support-Tickets und Upload-Aktionen in einem Paket.',
  projectName: 'Teamchat',
  pages: [
    {
      name: 'Login',
      folder: 'Onboarding',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(140deg,#050c18,#101b2e)' },
        children: stack([
          {
            type: 'text',
            props: { text: 'Teamchat Login' },
            style: { fontSize: 28, fontWeight: 600 },
          },
          {
            type: 'text',
            h: 72,
            style: { fontSize: 15, color: '#cbd5f5', lineHeight: 1.6 },
            props: { text: 'Melde dich mit deinem Firmenaccount an, um Chats und Supporttickets zu sehen.' },
          },
          { type: 'input', props: { placeholder: 'E-Mail', inputType: 'email' } },
          { type: 'input', props: { placeholder: 'Passwort', inputType: 'password' } },
          { type: 'button', props: { label: 'Login', action: 'login' } },
          { type: 'button', props: { label: 'Invitations-Link anfordern', action: 'support-ticket' } },
        ]),
      },
    },
    {
      name: 'Start',
      folder: 'Übersicht',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(140deg,#0b1120,#1f2a40)' },
        children: withNavbar(
          stack(
            [
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
            ],
            { startY: 160 }
          ),
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
          stack(
            [
              { type: 'text', props: { text: 'Projektchat' }, style: { fontSize: 26, fontWeight: 600 } },
              { type: 'container', props: { component: 'chat' }, h: 280 },
              { type: 'button', props: { label: 'Bild senden', action: 'upload-photo' } },
              { type: 'button', props: { label: 'Audio aufnehmen', action: 'record-audio' } },
            ],
            { startY: 160 }
          ),
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
          stack(
            [
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
            ],
            { startY: 160 }
          ),
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
      name: 'Login',
      folder: 'Team',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#030b15,#111f2f)' },
        children: stack(
          [
            {
              type: 'text',
              props: { text: 'Event Hub Login' },
              style: { fontSize: 28, fontWeight: 600 },
            },
            {
              type: 'text',
              h: 72,
              style: { fontSize: 15, lineHeight: 1.5, color: '#d8e4ff' },
              props: { text: 'Greife auf Teilnehmerverwaltung, Check-in und Community-Komponenten zu.' },
            },
            { type: 'input', props: { placeholder: 'Event-E-Mail', inputType: 'email' } },
            { type: 'input', props: { placeholder: 'Passwort', inputType: 'password' } },
            { type: 'button', props: { label: 'Login', action: 'login' } },
            { type: 'button', props: { label: 'Registrieren', action: 'register' } },
          ],
          { startY: 88 }
        ),
      },
    },
    {
      name: 'Event',
      folder: 'Events',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#0a1424,#1d2b45)' },
        children: withNavbar(
          stack(
            [
              { type: 'text', props: { text: 'Event Hub' }, style: { fontSize: 28, fontWeight: 600 } },
              { type: 'container', props: { component: 'calendar', calendarFocusDate: new Date().toISOString() }, h: 240 },
              { type: 'container', props: { component: 'map', mapLocation: 'Berlin, Germany' }, h: 220 },
              { type: 'container', props: { component: 'qr-code', qrUrl: 'https://example.com/tickets' }, h: 160 },
            ],
            { startY: 160 }
          ),
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
          stack(
            [
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
            ],
            { startY: 160 }
          ),
          [
            { label: 'Event', targetPage: 'Event' },
            { label: 'Tasks', targetPage: 'Orga', icon: '🛠️' },
          ]
        ),
      },
    },
  ],
});

const createConstructionManagerTemplate = (): Template => {
  const boardOptions = [
    { id: fallbackId(), label: 'Planung', description: 'Genehmigung läuft', color: '#38bdf8' },
    { id: fallbackId(), label: 'Im Bau', description: 'Teams vor Ort', color: '#fbbf24' },
    { id: fallbackId(), label: 'Abnahme', description: 'Gutachter eingeplant', color: '#34d399' },
  ];

  const pages: Template['pages'] = [
    {
      name: 'Projektübersicht',
      folder: 'Projekte',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#091326,#14243c)' },
        children: stack([
          { type: 'text', props: { text: 'Alle Baustellen im Blick' }, style: { fontSize: 28, fontWeight: 600 } },
          {
            type: 'container',
            h: 220,
            props: {
              component: 'status-board',
              statusBoard: { title: 'Bauphasen', activeId: boardOptions[1].id, options: boardOptions },
            },
          },
          {
            type: 'container',
            h: 200,
            props: {
              component: 'task-manager',
              tasks: [
                { id: fallbackId(), title: 'Material liefern lassen', done: false },
                { id: fallbackId(), title: 'Gerüst freigeben', done: true },
              ],
            },
          },
          {
            type: 'container',
            h: 180,
            props: { component: 'analytics' },
          },
        ]),
      },
    },
    {
      name: 'Dokumentation',
      folder: 'Projekte',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#0a1424,#17263d)' },
        children: stack([
          { type: 'text', props: { text: 'Pläne & Fotos' }, style: { fontSize: 26, fontWeight: 600 } },
          {
            type: 'container',
            h: 220,
            props: {
              component: 'folder-structure',
              folderTree: [
                { id: fallbackId(), name: 'Rohbau', children: [{ id: fallbackId(), name: 'Statische Pläne' }] },
                { id: fallbackId(), name: 'Innenausbau', children: [{ id: fallbackId(), name: 'Boden' }] },
              ],
            },
          },
          {
            type: 'container',
            h: 200,
            props: { component: 'audio-recorder', audioNotes: [] },
          },
        ]),
      },
    },
    {
      name: 'Bautagebuch',
      folder: 'Projekte',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#101b2e)' },
        children: stack([
          { type: 'text', props: { text: 'Tagesberichte' }, style: { fontSize: 26, fontWeight: 600 } },
          {
            type: 'container',
            h: 220,
            props: {
              component: 'time-tracking',
              timeTracking: {
                entries: [
                  { id: fallbackId(), label: 'Team Nord', seconds: 3600, startedAt: new Date().toISOString() },
                  { id: fallbackId(), label: 'Team Süd', seconds: 5400, endedAt: new Date().toISOString() },
                ],
              },
            },
          },
          {
            type: 'container',
            h: 200,
            props: {
              component: 'todo',
              todoItems: [
                { id: fallbackId(), title: 'Fotos hochladen', done: false },
                { id: fallbackId(), title: 'Wetter protokollieren', done: true },
              ],
            },
          },
        ]),
      },
    },
  ];

  return {
    id: 'construction-manager',
    name: 'Projekt- & Baustellenmanager',
    description: 'Phasenboard, Bautagebuch und Dokumentenablage für Handwerksbetriebe.',
    projectName: 'BauManager',
    pages: withAuthPages('BauManager', pages),
  };
};

const createTimeTrackingTemplate = (): Template => {
  const pages: Template['pages'] = [
    {
      name: 'Timer',
      folder: 'Zeiterfassung',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#0f1f30)' },
        children: stack([
          { type: 'text', props: { text: 'Aufträge starten & stoppen' }, style: { fontSize: 28, fontWeight: 600 } },
          {
            type: 'container',
            h: 220,
            props: {
              component: 'time-tracking',
              timeTracking: {
                entries: [
                  { id: fallbackId(), label: 'Projekt Atlas', seconds: 4200, startedAt: new Date().toISOString() },
                  { id: fallbackId(), label: 'Service Call', seconds: 1800, endedAt: new Date().toISOString() },
                ],
              },
            },
          },
          { type: 'button', props: { label: 'Neuen Timer', action: 'none' } },
        ]),
      },
    },
    {
      name: 'Stundenzettel',
      folder: 'Zeiterfassung',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#0b1220,#142540)' },
        children: stack([
          { type: 'text', props: { text: 'Manuelle Erfassung' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'input', props: { placeholder: 'Datum', inputType: 'date' } },
          { type: 'input', props: { placeholder: 'Projekt' } },
          { type: 'input', props: { placeholder: 'Stunden', inputType: 'number' } },
          { type: 'button', props: { label: 'Eintrag speichern', action: 'none' } },
        ]),
      },
    },
    {
      name: 'Auswertung',
      folder: 'Berichte',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#101828)' },
        children: stack([
          { type: 'text', props: { text: 'Stunden nach Projekt' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'analytics' } },
          {
            type: 'container',
            h: 200,
            props: {
              component: 'todo',
              todoItems: [
                { id: fallbackId(), title: 'Report exportieren', done: false },
                { id: fallbackId(), title: 'Kunde informieren', done: false },
              ],
            },
          },
        ]),
      },
    },
  ];

  return {
    id: 'time-tracking',
    name: 'Zeiterfassung & Stundenzettel',
    description: 'Timer, manuelle Eingaben und schnelle Berichte.',
    projectName: 'ZeitPro',
    pages: withAuthPages('ZeitPro', pages),
  };
};

const createMiniCrmTemplate = (): Template => {
  const pipelineOptions = [
    { id: fallbackId(), label: 'Lead', description: 'Neu eingetroffen', color: '#38bdf8' },
    { id: fallbackId(), label: 'Angebot', description: 'Warten auf Feedback', color: '#fbbf24' },
    { id: fallbackId(), label: 'Vertrag', description: 'Finalisierung', color: '#34d399' },
  ];

  const pages: Template['pages'] = [
    {
      name: 'Kundenliste',
      folder: 'CRM',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#080f1c,#151e33)' },
        children: stack([
          { type: 'text', props: { text: 'Kontakte & Firmen' }, style: { fontSize: 28, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'table' } },
          {
            type: 'container',
            h: 180,
            props: {
              component: 'todo',
              todoItems: [
                { id: fallbackId(), title: 'Lisa zurückrufen', done: false },
                { id: fallbackId(), title: 'Neue Leads importieren', done: true },
              ],
            },
          },
        ]),
      },
    },
    {
      name: 'Pipeline',
      folder: 'CRM',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#0c1627,#172843)' },
        children: stack([
          { type: 'text', props: { text: 'Deal-Status' }, style: { fontSize: 26, fontWeight: 600 } },
          {
            type: 'container',
            h: 220,
            props: { component: 'status-board', statusBoard: { title: 'Pipeline', activeId: pipelineOptions[0].id, options: pipelineOptions } },
          },
          {
            type: 'container',
            h: 200,
            props: {
              component: 'task-manager',
              tasks: [
                { id: fallbackId(), title: 'Pitch Deck updaten', done: false },
                { id: fallbackId(), title: 'Vertrag versenden', done: false },
              ],
            },
          },
        ]),
      },
    },
    {
      name: 'Aktivitäten',
      folder: 'CRM',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#0f1c30)' },
        children: stack([
          { type: 'text', props: { text: 'Notizen & Kommunikation' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'chat' } },
          {
            type: 'container',
            h: 200,
            props: {
              component: 'support',
              supportChannel: 'email',
              supportTarget: 'sales@kontakt.pro',
              supportTickets: [],
            },
          },
        ]),
      },
    },
  ];

  return {
    id: 'mini-crm',
    name: 'Kunden- & Kontaktmanager',
    description: 'Pipeline, Aufgaben und Teamchat für kleine Sales-Teams.',
    projectName: 'KontaktPro',
    pages: withAuthPages('KontaktPro', pages),
  };
};

const createCourseTemplate = (): Template => {
  const pages: Template['pages'] = [
    {
      name: 'Kursplan',
      folder: 'Seminare',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#0b1223,#1a2750)' },
        children: stack([
          { type: 'text', props: { text: 'Nächste Sessions' }, style: { fontSize: 28, fontWeight: 600 } },
          { type: 'container', h: 240, props: { component: 'calendar', calendarFocusDate: new Date().toISOString() } },
          { type: 'button', props: { label: 'Neue Session', action: 'none' } },
        ]),
      },
    },
    {
      name: 'Materialien',
      folder: 'Seminare',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#071022,#101a35)' },
        children: stack([
          { type: 'text', props: { text: 'Bibliothek' }, style: { fontSize: 26, fontWeight: 600 } },
          {
            type: 'container',
            h: 220,
            props: {
              component: 'folder-structure',
              folderTree: [
                { id: fallbackId(), name: 'Präsentationen', children: [{ id: fallbackId(), name: 'Tag 1' }] },
                { id: fallbackId(), name: 'Aufgaben', children: [{ id: fallbackId(), name: 'Templates' }] },
              ],
            },
          },
          { type: 'container', h: 180, props: { component: 'video-player', videoUrl: 'https://example.com/intro' } },
        ]),
      },
    },
    {
      name: 'Feedback',
      folder: 'Seminare',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#0f1c30)' },
        children: stack([
          { type: 'text', props: { text: 'Fragen & Aufgaben' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'input', props: { placeholder: 'Wie lief die Session?' } },
          { type: 'input', props: { placeholder: 'Nächste Schritte', inputType: 'text' } },
          {
            type: 'container',
            h: 200,
            props: {
              component: 'todo',
              todoItems: [
                { id: fallbackId(), title: 'Feedback einsammeln', done: false },
                { id: fallbackId(), title: 'Materialien verschicken', done: true },
              ],
            },
          },
        ]),
      },
    },
  ];

  return {
    id: 'course-app',
    name: 'Kurs- & Seminar-App',
    description: 'Kursplan, Materialien und Feedbackkanäle für Trainer:innen.',
    projectName: 'SeminarFlow',
    pages: withAuthPages('SeminarFlow', pages),
  };
};

const createFieldServiceTemplate = (): Template => {
  const pages: Template['pages'] = [
    {
      name: 'Einsätze',
      folder: 'Service',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#111f32)' },
        children: stack([
          { type: 'text', props: { text: 'Team unterwegs' }, style: { fontSize: 28, fontWeight: 600 } },
          {
            type: 'container',
            h: 220,
            props: {
              component: 'task-manager',
              tasks: [
                { id: fallbackId(), title: 'Wartung Heizwerk', done: false, assignee: 'Team Blau' },
                { id: fallbackId(), title: 'Notfall Köln', done: false, assignee: 'Team Rot' },
              ],
            },
          },
          { type: 'container', h: 200, props: { component: 'analytics' } },
        ]),
      },
    },
    {
      name: 'Routen',
      folder: 'Service',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#071225,#0f1c33)' },
        children: stack([
          { type: 'text', props: { text: 'Einsatzkarte' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 240, props: { component: 'map', mapLocation: 'Deutschland' } },
        ]),
      },
    },
    {
      name: 'Dokumentation',
      folder: 'Service',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#0e1928)' },
        children: stack([
          { type: 'text', props: { text: 'Protokoll & Notizen' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 200, props: { component: 'audio-recorder', audioNotes: [] } },
          { type: 'container', h: 200, props: { component: 'folder-structure', folderTree: [{ id: fallbackId(), name: 'Berichte' }] } },
        ]),
      },
    },
  ];

  return {
    id: 'field-service',
    name: 'Field Service & Wartung',
    description: 'Einsatzplanung, Kartenansicht und Dokumentation für Außendienst-Teams.',
    projectName: 'ServicePro',
    pages: withAuthPages('ServicePro', pages),
  };
};

const createPropertyManagementTemplate = (): Template => {
  const pages: Template['pages'] = [
    {
      name: 'Objekte',
      folder: 'Immobilien',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#070f1c,#101f33)' },
        children: stack([
          { type: 'text', props: { text: 'Portfolio & Standorte' }, style: { fontSize: 28, fontWeight: 600 } },
          { type: 'container', h: 240, props: { component: 'map', mapLocation: 'D/A/CH' } },
          {
            type: 'container',
            h: 180,
            props: {
              component: 'todo',
              todoItems: [
                { id: fallbackId(), title: 'Exposé prüfen', done: true },
                { id: fallbackId(), title: 'Preis kalkulieren', done: false },
              ],
            },
          },
        ]),
      },
    },
    {
      name: 'Besichtigungen',
      folder: 'Immobilien',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#0e1b32)' },
        children: stack([
          { type: 'text', props: { text: 'Kalender & Kontakte' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 240, props: { component: 'calendar', calendarFocusDate: new Date().toISOString() } },
          { type: 'button', props: { label: 'Besichtigung planen', action: 'none' } },
        ]),
      },
    },
    {
      name: 'Anfragen',
      folder: 'Immobilien',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#091424,#132037)' },
        children: stack([
          { type: 'text', props: { text: 'Interessenten-Chat' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'chat' } },
          { type: 'container', h: 200, props: { component: 'support', supportChannel: 'email', supportTarget: 'hello@makler.app' } },
        ]),
      },
    },
  ];

  return {
    id: 'property-suite',
    name: 'Immobilien & Verwaltung',
    description: 'Standorte, Termine und Interessenten-Chat für Makler:innen.',
    projectName: 'MaklerSuite',
    pages: withAuthPages('MaklerSuite', pages),
  };
};

const createFitnessTemplate = (): Template => {
  const statusOptions = [
    { id: fallbackId(), label: 'Aktiv', description: 'Mitglied trainiert', color: '#34d399' },
    { id: fallbackId(), label: 'Pause', description: 'Urlaub oder krank', color: '#fbbf24' },
    { id: fallbackId(), label: 'Neu', description: 'Schnuppermonat', color: '#60a5fa' },
  ];

  const pages: Template['pages'] = [
    {
      name: 'Mitglieder',
      folder: 'Fitness',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#0f1f30)' },
        children: stack([
          { type: 'text', props: { text: 'Community betreuen' }, style: { fontSize: 28, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'status-board', statusBoard: { title: 'Mitgliedsstatus', activeId: statusOptions[0].id, options: statusOptions } } },
          { type: 'container', h: 200, props: { component: 'todo', todoItems: [{ id: fallbackId(), title: 'Willkommensmail senden', done: false }] } },
        ]),
      },
    },
    {
      name: 'Kursplan',
      folder: 'Fitness',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#071225,#131f3a)' },
        children: stack([
          { type: 'text', props: { text: 'Wochenübersicht' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 240, props: { component: 'calendar', calendarFocusDate: new Date().toISOString() } },
        ]),
      },
    },
    {
      name: 'Community',
      folder: 'Fitness',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#101828)' },
        children: stack([
          { type: 'text', props: { text: 'Chat & Betreuung' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'chat' } },
          { type: 'container', h: 200, props: { component: 'support', supportChannel: 'chat', supportTarget: 'coach@studio.fit' } },
        ]),
      },
    },
  ];

  return {
    id: 'fitness-coach',
    name: 'Fitness & Coaching',
    description: 'Mitgliederstatus, Kursplan und Community-Chat für Coaches.',
    projectName: 'CoachFlow',
    pages: withAuthPages('CoachFlow', pages),
  };
};

const createRestaurantTemplate = (): Template => {
  const pages: Template['pages'] = [
    {
      name: 'Bestellungen',
      folder: 'Gastro',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#080f1d,#141f34)' },
        children: stack([
          { type: 'text', props: { text: 'Serviceboard' }, style: { fontSize: 28, fontWeight: 600 } },
          {
            type: 'container',
            h: 220,
            props: {
              component: 'task-manager',
              tasks: [
                { id: fallbackId(), title: 'Tisch 5 - Starter', done: false },
                { id: fallbackId(), title: 'Take-away 021', done: true },
              ],
            },
          },
          { type: 'container', h: 200, props: { component: 'todo', todoItems: [{ id: fallbackId(), title: 'Inventur', done: false }] } },
        ]),
      },
    },
    {
      name: 'Reservierungen',
      folder: 'Gastro',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#0f1d34)' },
        children: stack([
          { type: 'text', props: { text: 'Kalender' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 240, props: { component: 'calendar', calendarFocusDate: new Date().toISOString() } },
        ]),
      },
    },
    {
      name: 'Lieferung',
      folder: 'Gastro',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#101a2b)' },
        children: stack([
          { type: 'text', props: { text: 'Routen & Fahrer' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 240, props: { component: 'map', mapLocation: 'Stadtgebiet' } },
        ]),
      },
    },
  ];

  return {
    id: 'restaurant-suite',
    name: 'Gastro & Catering',
    description: 'Bestellungen, Tischplanung und Lieferübersicht für Restaurants.',
    projectName: 'GastroFlow',
    pages: withAuthPages('GastroFlow', pages),
  };
};

const createMedicalTemplate = (): Template => {
  const pages: Template['pages'] = [
    {
      name: 'Termine',
      folder: 'Praxis',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#0e1c32)' },
        children: stack([
          { type: 'text', props: { text: 'Sprechstunden' }, style: { fontSize: 28, fontWeight: 600 } },
          { type: 'container', h: 240, props: { component: 'calendar', calendarFocusDate: new Date().toISOString() } },
        ]),
      },
    },
    {
      name: 'Akte',
      folder: 'Praxis',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#071124,#0f1f33)' },
        children: stack([
          { type: 'text', props: { text: 'Dokumentenablage' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 240, props: { component: 'folder-structure', folderTree: [{ id: fallbackId(), name: 'Patienten A-L' }] } },
        ]),
      },
    },
    {
      name: 'Nachrichten',
      folder: 'Praxis',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#101a2b)' },
        children: stack([
          { type: 'text', props: { text: 'Teamkommunikation' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'chat' } },
          { type: 'container', h: 200, props: { component: 'support', supportChannel: 'email', supportTarget: 'praxis@health.app' } },
        ]),
      },
    },
  ];

  return {
    id: 'medical-office',
    name: 'Praxis & Termine',
    description: 'Terminierung, Aktenablage und sichere Kommunikation für Praxisteams.',
    projectName: 'PraxisFlow',
    pages: withAuthPages('PraxisFlow', pages),
  };
};

const createInventoryTemplate = (): Template => {
  const pages: Template['pages'] = [
    {
      name: 'Lagerstand',
      folder: 'Inventory',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#070f1d,#111f34)' },
        children: stack([
          { type: 'text', props: { text: 'Bestände prüfen' }, style: { fontSize: 28, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'table' } },
          { type: 'button', props: { label: 'Wareneingang buchen', action: 'none' } },
        ]),
      },
    },
    {
      name: 'Bestellungen',
      folder: 'Inventory',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#0e1a2c)' },
        children: stack([
          { type: 'text', props: { text: 'Nachbestellungen' }, style: { fontSize: 26, fontWeight: 600 } },
          {
            type: 'container',
            h: 220,
            props: {
              component: 'todo',
              todoItems: [
                { id: fallbackId(), title: 'Schrauben M5', done: false },
                { id: fallbackId(), title: 'Etikettenrolle', done: true },
              ],
            },
          },
        ]),
      },
    },
    {
      name: 'Kennzahlen',
      folder: 'Inventory',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#101a2c)' },
        children: stack([
          { type: 'text', props: { text: 'Rotation & Forecast' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'analytics' } },
        ]),
      },
    },
  ];

  return {
    id: 'inventory-tracker',
    name: 'Inventory & Lager',
    description: 'Bestände, Nachbestellungen und Kennzahlen im Griff.',
    projectName: 'LagerPilot',
    pages: withAuthPages('LagerPilot', pages),
  };
};

const createLogisticsTemplate = (): Template => {
  const driverOptions = [
    { id: fallbackId(), label: 'Depot A', description: 'Nordflotte', color: '#38bdf8' },
    { id: fallbackId(), label: 'Depot B', description: 'Südflotte', color: '#fbbf24' },
    { id: fallbackId(), label: 'Depot C', description: 'Express', color: '#34d399' },
  ];

  const pages: Template['pages'] = [
    {
      name: 'Sendungen',
      folder: 'Logistik',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#0f1f31)' },
        children: stack([
          { type: 'text', props: { text: 'Tracking & Karte' }, style: { fontSize: 28, fontWeight: 600 } },
          { type: 'container', h: 240, props: { component: 'map', mapLocation: 'Europa' } },
        ]),
      },
    },
    {
      name: 'Flotte',
      folder: 'Logistik',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#071125,#131f37)' },
        children: stack([
          { type: 'text', props: { text: 'Depots & Fahrer' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'status-board', statusBoard: { title: 'Depots', activeId: driverOptions[0].id, options: driverOptions } } },
          { type: 'container', h: 200, props: { component: 'task-manager', tasks: [{ id: fallbackId(), title: 'Route 12 prüfen', done: false }] } },
        ]),
      },
    },
    {
      name: 'Dokumente',
      folder: 'Logistik',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#0e1a2c)' },
        children: stack([
          { type: 'text', props: { text: 'Lieferscheine' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'folder-structure', folderTree: [{ id: fallbackId(), name: 'KW12' }] } },
        ]),
      },
    },
  ];

  return {
    id: 'logistics-tracker',
    name: 'Logistik & Routen',
    description: 'Sendungen tracken, Flottenstatus checken und Dokumente bündeln.',
    projectName: 'CargoFlow',
    pages: withAuthPages('CargoFlow', pages),
  };
};

const createAgencyTemplate = (): Template => {
  const pages: Template['pages'] = [
    {
      name: 'Briefings',
      folder: 'Agentur',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#111f32)' },
        children: stack([
          { type: 'text', props: { text: 'Projekte priorisieren' }, style: { fontSize: 28, fontWeight: 600 } },
          {
            type: 'container',
            h: 220,
            props: {
              component: 'todo',
              todoItems: [
                { id: fallbackId(), title: 'Moodboard erstellen', done: false },
                { id: fallbackId(), title: 'Offer verschicken', done: true },
              ],
            },
          },
          { type: 'button', props: { label: 'Briefing hinzufügen', action: 'none' } },
        ]),
      },
    },
    {
      name: 'Studio',
      folder: 'Agentur',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#080f1e,#142036)' },
        children: stack([
          { type: 'text', props: { text: 'Auswertung & Ideen' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'analytics' } },
          { type: 'container', h: 200, props: { component: 'video-player', videoUrl: 'https://example.com/showcase' } },
        ]),
      },
    },
    {
      name: 'Kundenchat',
      folder: 'Agentur',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#0f1e34)' },
        children: stack([
          { type: 'text', props: { text: 'Kommunikation' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'chat' } },
          { type: 'container', h: 200, props: { component: 'support', supportChannel: 'email', supportTarget: 'hello@agentur.app' } },
        ]),
      },
    },
  ];

  return {
    id: 'agency-workflow',
    name: 'Agentur & Kundenportal',
    description: 'Briefings, Präsentationen und Kundenkommunikation bündeln.',
    projectName: 'AgencyHub',
    pages: withAuthPages('AgencyHub', pages),
  };
};

const createPhotographyTemplate = (): Template => {
  const pages: Template['pages'] = [
    {
      name: 'Shootings',
      folder: 'Foto',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#0f1f32)' },
        children: stack([
          { type: 'text', props: { text: 'Kalender & Locations' }, style: { fontSize: 28, fontWeight: 600 } },
          { type: 'container', h: 240, props: { component: 'calendar', calendarFocusDate: new Date().toISOString() } },
        ]),
      },
    },
    {
      name: 'Uploads',
      folder: 'Foto',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#080f1e,#141f36)' },
        children: stack([
          { type: 'text', props: { text: 'Dateien & Freigaben' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'folder-structure', folderTree: [{ id: fallbackId(), name: 'Kunde A' }] } },
          { type: 'container', h: 200, props: { component: 'audio-recorder', audioNotes: [] } },
        ]),
      },
    },
    {
      name: 'Kundenbereich',
      folder: 'Foto',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#101a2d)' },
        children: stack([
          { type: 'text', props: { text: 'Freigabe & Support' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'chat' } },
          { type: 'container', h: 200, props: { component: 'qr-code', qrUrl: 'https://clientshots.app' } },
        ]),
      },
    },
  ];

  return {
    id: 'photography-portal',
    name: 'Foto & Media Portal',
    description: 'Shootings planen, Uploads organisieren und Freigaben teilen.',
    projectName: 'ClientShots',
    pages: withAuthPages('ClientShots', pages),
  };
};

const createRetailTemplate = (): Template => {
  const pages: Template['pages'] = [
    {
      name: 'Stores',
      folder: 'Retail',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#0f1f31)' },
        children: stack([
          { type: 'text', props: { text: 'Pop-up Standorte' }, style: { fontSize: 28, fontWeight: 600 } },
          { type: 'container', h: 240, props: { component: 'map', mapLocation: 'Europa' } },
        ]),
      },
    },
    {
      name: 'Teamplan',
      folder: 'Retail',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#071125,#142039)' },
        children: stack([
          { type: 'text', props: { text: 'Besetzungen' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 240, props: { component: 'calendar', calendarFocusDate: new Date().toISOString() } },
        ]),
      },
    },
    {
      name: 'Promotion',
      folder: 'Retail',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#101a2c)' },
        children: stack([
          { type: 'text', props: { text: 'KPIs & Targets' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'analytics' } },
        ]),
      },
    },
  ];

  return {
    id: 'retail-popups',
    name: 'Retail & Pop-up',
    description: 'Standorte, Teamplanung und KPI-Tracking für Retail-Teams.',
    projectName: 'RetailHub',
    pages: withAuthPages('RetailHub', pages),
  };
};

const createNonprofitTemplate = (): Template => {
  const pages: Template['pages'] = [
    {
      name: 'Spenden',
      folder: 'Nonprofit',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#0e1c32)' },
        children: stack([
          { type: 'text', props: { text: 'Impact Dashboard' }, style: { fontSize: 28, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'analytics' } },
          { type: 'container', h: 200, props: { component: 'qr-code', qrUrl: 'https://spenden.app' } },
        ]),
      },
    },
    {
      name: 'Volunteers',
      folder: 'Nonprofit',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#071125,#131f37)' },
        children: stack([
          { type: 'text', props: { text: 'Aufgaben & Schichten' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'todo', todoItems: [{ id: fallbackId(), title: 'Stand aufbauen', done: false }] } },
        ]),
      },
    },
    {
      name: 'Community',
      folder: 'Nonprofit',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#101a2c)' },
        children: stack([
          { type: 'text', props: { text: 'Update & Support' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'chat' } },
          { type: 'container', h: 200, props: { component: 'support', supportChannel: 'email', supportTarget: 'help@impact.org' } },
        ]),
      },
    },
  ];

  return {
    id: 'nonprofit-hub',
    name: 'Nonprofit & Impact',
    description: 'Spendenstatus, Volunteer-Planung und Community-Updates.',
    projectName: 'ImpactHub',
    pages: withAuthPages('ImpactHub', pages),
  };
};

const createTravelTemplate = (): Template => {
  const pages: Template['pages'] = [
    {
      name: 'Reiseideen',
      folder: 'Travel',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#0f1f32)' },
        children: stack([
          { type: 'text', props: { text: 'Destinationen & Karte' }, style: { fontSize: 28, fontWeight: 600 } },
          { type: 'container', h: 240, props: { component: 'map', mapLocation: 'Weltkarte' } },
        ]),
      },
    },
    {
      name: 'Routenplaner',
      folder: 'Travel',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#071125,#132037)' },
        children: stack([
          { type: 'text', props: { text: 'Termine & Abflüge' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 240, props: { component: 'calendar', calendarFocusDate: new Date().toISOString() } },
        ]),
      },
    },
    {
      name: 'Anfragen',
      folder: 'Travel',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#101a2c)' },
        children: stack([
          { type: 'text', props: { text: 'Kundenservice' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'support', supportChannel: 'chat', supportTarget: 'reisen@agency.travel' } },
          { type: 'container', h: 200, props: { component: 'chat' } },
        ]),
      },
    },
  ];

  return {
    id: 'travel-agency',
    name: 'Travel & Routen',
    description: 'Destinationen, Terminplanung und Support für Reisebüros.',
    projectName: 'TravelDesk',
    pages: withAuthPages('TravelDesk', pages),
  };
};

const createCoworkingTemplate = (): Template => {
  const statusOptions = [
    { id: fallbackId(), label: 'Freie Plätze', description: 'Hot Desk verfügbar', color: '#34d399' },
    { id: fallbackId(), label: 'Konferenzraum', description: 'Buchungen offen', color: '#38bdf8' },
    { id: fallbackId(), label: 'Events', description: 'Workshops geplant', color: '#fbbf24' },
  ];

  const pages: Template['pages'] = [
    {
      name: 'Raumbelegung',
      folder: 'Coworking',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#0f1f32)' },
        children: stack([
          { type: 'text', props: { text: 'Kalender & Slots' }, style: { fontSize: 28, fontWeight: 600 } },
          { type: 'container', h: 240, props: { component: 'calendar', calendarFocusDate: new Date().toISOString() } },
        ]),
      },
    },
    {
      name: 'Mitglieder',
      folder: 'Coworking',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#071125,#131f37)' },
        children: stack([
          { type: 'text', props: { text: 'Community Status' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'status-board', statusBoard: { title: 'Spaces', activeId: statusOptions[0].id, options: statusOptions } } },
        ]),
      },
    },
    {
      name: 'Support',
      folder: 'Coworking',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#050c18,#101a2c)' },
        children: stack([
          { type: 'text', props: { text: 'Concierge & Chat' }, style: { fontSize: 26, fontWeight: 600 } },
          { type: 'container', h: 220, props: { component: 'support', supportChannel: 'chat', supportTarget: 'hi@space.app' } },
          { type: 'container', h: 200, props: { component: 'chat' } },
        ]),
      },
    },
  ];

  return {
    id: 'coworking-hub',
    name: 'Coworking & Spaces',
    description: 'Raumbelegung, Mitgliederstatus und Concierge-Desk.',
    projectName: 'SpaceDesk',
    pages: withAuthPages('SpaceDesk', pages),
  };
};

const builtinTemplates: Template[] = [
  createCompanySuiteTemplate(),
  createChatAppTemplate(),
  createEventTemplate(),
  createConstructionManagerTemplate(),
  createTimeTrackingTemplate(),
  createMiniCrmTemplate(),
  createCourseTemplate(),
  createFieldServiceTemplate(),
  createPropertyManagementTemplate(),
  createFitnessTemplate(),
  createRestaurantTemplate(),
  createMedicalTemplate(),
  createInventoryTemplate(),
  createLogisticsTemplate(),
  createAgencyTemplate(),
  createPhotographyTemplate(),
  createRetailTemplate(),
  createNonprofitTemplate(),
  createTravelTemplate(),
  createCoworkingTemplate(),
].map((tpl) => ({ ...tpl, source: 'builtin' as const }));

const safeString = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
const LAST_PROJECT_STORAGE_KEY = 'appschmiede:last-project';

export default function TemplatesPage() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateProjectId, setTemplateProjectId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateProjectName, setTemplateProjectName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u ? { uid: u.uid, email: u.email } : null)), []);

  useEffect(() => {
    const loadCustomTemplates = async () => {
      if (!user) return;
      try {
        const snapshot = await getDocs(collection(db, 'templates_custom'));
        const mapped = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            const name = safeString(data?.name, null as unknown as string);
            const projectName = safeString(data?.projectName, null as unknown as string);
            const description = safeString(data?.description, '');
            if (!name || !projectName || !Array.isArray(data?.pages)) return null;
            return {
              id: docSnap.id,
              name,
              description,
              projectName,
              pages: data.pages || [],
              source: 'custom' as const,
              createdBy: data.createdBy,
            } as Template;
          })
          .filter((tpl): tpl is Template => Boolean(tpl));
        setCustomTemplates(mapped);
      } catch (loadError) {
        console.error('Konnte Custom Templates nicht laden', loadError);
      }
    };

    loadCustomTemplates();
  }, [user]);

  const isTemplateAdmin = useMemo(
    () => (user?.email ? TEMPLATE_ADMIN_EMAILS.includes(user.email) : false),
    [user?.email]
  );

  if (!user)
    return (
      <UnauthenticatedScreen
        badge="Vorlagen"
        description="Melde dich an, um Vorlagen zu kopieren und neue Projekte direkt aus dem Katalog zu erstellen."
      />
    );

  const createFromTemplate = async (tpl: Template) => {
      if (!user) return;
      setError(null);
      setCreatingTemplateId(tpl.id);

      let projectId: string | null = null;

      try {
        projectId = fallbackId();

        await setDoc(doc(db, 'projects', projectId), {
          name: tpl.projectName,
          ownerId: user.uid,
          ownerUid: user.uid,
          members: [user.uid],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (templateError) {
        console.error('Template project creation failed', templateError);
        setError('Projekt konnte nicht erstellt werden. Bitte versuche es erneut.');
        setCreatingTemplateId(null);
        return;
      }

      const pageResults = await Promise.allSettled(
        tpl.pages.map(async (templatePage) => {
          if (!projectId) return;
          const pageId = fallbackId();
          await setDoc(doc(collection(db, 'projects', projectId, 'pages'), pageId), {
            name: templatePage.name,
            folder: templatePage.folder ?? null,
            tree: templatePage.tree,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        })
      );

      const failedPages = pageResults.filter((result) => result.status === 'rejected');
      if (failedPages.length) {
        console.warn('Einige Seiten konnten nicht erstellt werden', failedPages);
        setError(`Projekt erstellt, aber ${failedPages.length} Seite(n) konnten nicht gespeichert werden.`);
      } else {
        setError(null);
      }

      setCreatingTemplateId(null);

      if (!projectId) {
        return;
      }

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(LAST_PROJECT_STORAGE_KEY, projectId);
        } catch (storageError) {
          console.warn('Konnte letztes Projekt nicht speichern', storageError);
        }
        try {
          router.push(`/editor?projectId=${projectId}`);
        } catch (navigationError) {
          console.warn('Router-Navigation fehlgeschlagen, falle auf window.location zurück.', navigationError);
          window.location.href = `/editor?projectId=${projectId}`;
        }
        return;
      }

      router.push(`/editor?projectId=${projectId}`);
    };

  const templatesTourSteps = [
    {
      id: 'templates-intro',
      title: 'Vorlagenbibliothek',
      description: 'Hier findest du kuratierte Projekte, die alle Bausteine des Editors bereits kombiniert verwenden.',
    },
    {
      id: 'templates-grid',
      title: 'Fertige Use-Cases',
      description: 'Jede Karte beschreibt einen kompletten Flow – z. B. Unternehmens-Suite, Chat oder Event-App.',
    },
    {
      id: 'templates-create',
      title: 'Projekt erzeugen',
      description: 'Mit einem Klick wird ein neues Projekt inkl. Seitenstruktur angelegt und direkt im Editor geöffnet.',
    },
  ];

  const visibleTemplates = useMemo(() => {
    const normalize = (tpl: Template): Template | null => {
      const name = safeString(tpl.name, 'Unbenannte Vorlage');
      const description = safeString(tpl.description, '');
      const projectName = safeString(tpl.projectName, name);
      if (!tpl.id || !name) return null;
      return { ...tpl, name, description, projectName };
    };
    const merged = [...builtinTemplates, ...customTemplates]
      .map((tpl) => (tpl ? normalize(tpl) : null))
      .filter((tpl): tpl is Template => Boolean(tpl));
    return merged;
  }, [customTemplates]);

  const saveTemplateFromProject = async () => {
    if (!isTemplateAdmin) return;
    if (!templateProjectId.trim() || !templateName.trim()) {
      setError('Projekt-ID und Vorlagenname dürfen nicht leer sein.');
      return;
    }
    setSavingTemplate(true);
    setError(null);

    try {
      // Lade Projekt-Metadaten
      const projectSnap = await getDoc(doc(db, 'projects', templateProjectId.trim()))
        .catch(() => null);
      const projectData = projectSnap?.exists() ? projectSnap.data() : null;

      // Lade Seiten
      const pagesSnap = await getDocs(collection(db, 'projects', templateProjectId.trim(), 'pages'));
      const pages = pagesSnap.docs
        .map((p) => {
          const data = p.data();
          const name = safeString(data?.name, null as unknown as string);
          if (!data?.tree || !name) return null;
          return {
            name,
            folder: data.folder ?? null,
            tree: data.tree,
          } as Template['pages'][number];
        })
        .filter((page): page is Template['pages'][number] => Boolean(page));

      if (!pages.length) {
        setError('Keine Seiten gefunden. Bitte prüfe die Projekt-ID.');
        setSavingTemplate(false);
        return;
      }

      const targetId = selectedTemplateId && customTemplates.some((tpl) => tpl.id === selectedTemplateId)
        ? selectedTemplateId
        : fallbackId();

      await setDoc(doc(db, 'templates_custom', targetId), {
        name: templateName.trim(),
        description: templateDescription.trim() || 'Benutzerdefinierte Vorlage',
        projectName: templateProjectName.trim() || projectData?.name || templateName.trim(),
        pages,
        createdBy: user?.uid ?? null,
        createdAt: serverTimestamp(),
        source: 'custom',
      });

      // Reload list
      const snapshot = await getDocs(collection(db, 'templates_custom'));
      const mapped = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          const name = safeString(data?.name, null as unknown as string);
          const projectName = safeString(data?.projectName, null as unknown as string);
          const description = safeString(data?.description, '');
          if (!name || !projectName || !Array.isArray(data?.pages)) return null;
          return {
            id: docSnap.id,
            name,
            description,
            projectName,
            pages: data.pages || [],
            source: 'custom' as const,
            createdBy: data.createdBy,
          } as Template;
        })
        .filter((tpl): tpl is Template => Boolean(tpl));
      setCustomTemplates(mapped);

      setTemplateProjectId('');
      setTemplateName('');
      setTemplateDescription('');
      setTemplateProjectName('');
      setSelectedTemplateId(null);
    } catch (saveError: any) {
      console.error('Vorlage konnte nicht gespeichert werden', saveError);
      setError(saveError?.message || 'Vorlage konnte nicht gespeichert werden.');
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <Header />
      <main className="flex-1 w-full px-4 py-10 lg:px-10">
        <div className="flex flex-col gap-6">
          <header className="space-y-1" data-tour-id="templates-intro">
            <h1 className="text-3xl font-semibold">Vorlagenbibliothek</h1>
            <p className="text-sm text-neutral-400">
              Starte schneller mit vorgefertigten Projekten. Jede Vorlage nutzt die gleichen Bausteine wie dein Editor und kann direkt
              weiter angepasst werden.
            </p>
          </header>

          {isTemplateAdmin && (
            <section className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-emerald-100">Admin: Vorlage aus Projekt speichern</h2>
                {savingTemplate && <span className="text-xs text-emerald-100">Speichere…</span>}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm md:col-span-2">
                  <span className="text-neutral-200">Bestehende Custom-Vorlage aktualisieren (optional)</span>
                  <select
                    value={selectedTemplateId ?? ''}
                    onChange={(e) => setSelectedTemplateId(e.target.value || null)}
                    className="rounded-lg border border-white/15 bg-neutral-900 px-3 py-2 text-sm"
                  >
                    <option value="">Neue Vorlage anlegen</option>
                    {customTemplates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                    ))}
                  </select>
                  <span className="text-xs text-neutral-400">Wenn gewählt, werden Meta-Daten und Seiten der ausgewählten Custom-Vorlage überschrieben.</span>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-neutral-200">Projekt-ID</span>
                  <input
                    value={templateProjectId}
                    onChange={(e) => setTemplateProjectId(e.target.value)}
                    className="rounded-lg border border-white/15 bg-neutral-900 px-3 py-2 text-sm"
                    placeholder="projectId"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-neutral-200">Vorlagenname</span>
                  <input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="rounded-lg border border-white/15 bg-neutral-900 px-3 py-2 text-sm"
                    placeholder="z. B. Meine neue Vorlage"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm md:col-span-2">
                  <span className="text-neutral-200">Beschreibung</span>
                  <input
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    className="rounded-lg border border-white/15 bg-neutral-900 px-3 py-2 text-sm"
                    placeholder="Kurzer Teaser für Nutzer"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm md:col-span-2">
                  <span className="text-neutral-200">Anzeigename im Projekt (optional)</span>
                  <input
                    value={templateProjectName}
                    onChange={(e) => setTemplateProjectName(e.target.value)}
                    className="rounded-lg border border-white/15 bg-neutral-900 px-3 py-2 text-sm"
                    placeholder="Name des angelegten Projekts"
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveTemplateFromProject}
                  disabled={savingTemplate}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    savingTemplate
                      ? 'bg-white/5 text-neutral-500 cursor-wait'
                      : 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/50 hover:bg-emerald-500/30'
                  }`}
                >
                  {savingTemplate ? 'Speichere…' : 'Als Vorlage speichern'}
                </button>
              </div>
            </section>
          )}

          <TemplatesErrorBoundary>
            <div className="grid gap-4 md:grid-cols-3" data-tour-id="templates-grid">
              {visibleTemplates.map((tpl) => (
                <div key={tpl.id} className="rounded-2xl border border-white/10 bg-neutral-900/80 p-4 shadow-lg shadow-black/30">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-lg font-medium text-neutral-100">{tpl.name}</div>
                    {tpl.source === 'custom' && <span className="text-[11px] rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-100">Custom</span>}
                  </div>
                  <div className="mt-1 text-sm text-neutral-400">{tpl.description}</div>
                  <button
                    type="button"
                    onClick={() => createFromTemplate(tpl)}
                    disabled={creatingTemplateId === tpl.id}
                    className={`mt-4 w-full rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      creatingTemplateId === tpl.id
                        ? 'bg-white/5 text-neutral-500 cursor-wait'
                        : 'bg-white/10 text-neutral-100 hover:bg-white/20'
                    }`}
                    data-tour-id="templates-create"
                  >
                    {creatingTemplateId === tpl.id ? 'Wird erstellt…' : 'Projekt erstellen'}
                  </button>
                </div>
              ))}
            </div>
          </TemplatesErrorBoundary>
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}
        </div>
      </main>
      <GuidedTour storageKey="tour-templates" steps={templatesTourSteps} restartLabel="Vorlagen Tutorial" />
    </div>
  );
}
