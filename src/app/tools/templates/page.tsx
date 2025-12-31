// src/app/tools/templates/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import Header from '@/components/Header';
import UnauthenticatedScreen from '@/components/UnauthenticatedScreen';
import GuidedTour from '@/components/GuidedTour';
import { auth, db } from '@/lib/firebase';
import type { PageTree } from '@/lib/editorTypes';
import { useI18n } from '@/lib/i18n';
import { isAdminEmail } from '@/lib/user-utils';

const BUILD_TAG = process.env.NEXT_PUBLIC_BUILD_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? 'local-dev';
const LAST_PROJECT_STORAGE_KEY = 'appschmiede:last-project';

type Template = {
  id: string;
  name: string;
  description: string;
  projectName: string;
  pages: Array<Omit<PageTree, 'id' | 'createdAt' | 'updatedAt'>>;
  createdBy?: string | null;
};

const fallbackId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;

const safeString = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);

function TemplatesPageComponent() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { lang } = useI18n();

  const copy = useMemo(
    () =>
      lang === 'en'
        ? {
            badge: 'Templates',
            unauthDesc: 'Sign in to copy templates and create projects directly from the catalog.',
            headerTitle: 'Template Library',
            headerDesc:
              'Templates are loaded from Firebase. Create your own project in the editor and save it as an app template (admin).',
            tourTitle: 'Template Library',
            tourGrid: 'All templates come from Firebase (no hardcoded templates).',
            tourCreate: 'Create a project in one click and open it in the editor.',
            createProject: 'Create project',
            creatingProject: 'Creating…',
            deleteTemplate: 'Delete template',
            deletingTemplate: 'Deleting…',
            empty: 'No templates available yet.',
            confirmDelete: 'Delete this template permanently?',
            deleteFailed: 'Template could not be deleted. Please try again.',
          }
        : {
            badge: 'Vorlagen',
            unauthDesc: 'Melde dich an, um Vorlagen zu kopieren und neue Projekte direkt aus dem Katalog zu erstellen.',
            headerTitle: 'Vorlagenbibliothek',
            headerDesc:
              'Vorlagen werden aus Firebase geladen. Erstelle im Editor ein Projekt und speichere es als App-Vorlage (Admin).',
            tourTitle: 'Vorlagenbibliothek',
            tourGrid: 'Alle Vorlagen kommen aus Firebase (keine hardcodierten Vorlagen).',
            tourCreate: 'Mit einem Klick Projekt anlegen und direkt im Editor öffnen.',
            createProject: 'Projekt erstellen',
            creatingProject: 'Wird erstellt…',
            deleteTemplate: 'Vorlage löschen',
            deletingTemplate: 'Wird gelöscht…',
            empty: 'Noch keine Vorlagen verfügbar.',
            confirmDelete: 'Diese Vorlage wirklich dauerhaft löschen?',
            deleteFailed: 'Vorlage konnte nicht gelöscht werden. Bitte versuche es erneut.',
          },
    [lang]
  );

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u ? { uid: u.uid, email: u.email } : null);
        setAuthReady(true);
      }),
    []
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!user) {
      setTemplates([]);
      return;
    }

    let cancelled = false;
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const snap = await getDocs(collection(db, 'templates'));
        const next: Template[] = snap.docs
          .map((docSnap) => {
            const data = docSnap.data() as any;
            const pagesRaw = Array.isArray(data?.pages) ? data.pages : [];
            const pages = pagesRaw
              .map((p: any) => {
                if (!p || typeof p !== 'object') return null;
                if (!p.tree || typeof p.tree !== 'object') return null;
                return {
                  name: safeString(p.name, 'Seite'),
                  folder: typeof p.folder === 'string' || p.folder === null ? p.folder : null,
                  tree: p.tree as PageTree['tree'],
                } satisfies Omit<PageTree, 'id' | 'createdAt' | 'updatedAt'>;
              })
              .filter(Boolean) as Array<Omit<PageTree, 'id' | 'createdAt' | 'updatedAt'>>;

            const name = safeString(data?.name, 'Vorlage');
            return {
              id: docSnap.id,
              name,
              description: safeString(data?.description, ''),
              projectName: safeString(data?.projectName, name),
              pages,
              createdBy: typeof data?.createdBy === 'string' ? data.createdBy : null,
            } satisfies Template;
          })
          .filter((tpl) => Boolean(tpl.id) && tpl.pages.length > 0);

        if (!cancelled) setTemplates(next);
      } catch (e) {
        console.warn('Konnte Templates nicht laden', e);
        if (!cancelled) setTemplates([]);
      } finally {
        if (!cancelled) setLoadingTemplates(false);
      }
    };

    void loadTemplates();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const templatesTourSteps = useMemo(
    () => [
      {
        id: 'templates-intro',
        title: copy.tourTitle,
        description:
          lang === 'en'
            ? 'Templates are loaded from Firebase so you can manage them centrally.'
            : 'Vorlagen werden aus Firebase geladen und lassen sich zentral verwalten.',
      },
      {
        id: 'templates-grid',
        title: copy.tourGrid,
        description:
          lang === 'en'
            ? 'Save templates from the editor (admin) and they appear here for everyone.'
            : 'Speichere Vorlagen im Editor (Admin) und sie erscheinen hier für alle Nutzer.',
      },
      {
        id: 'templates-create',
        title: copy.tourCreate,
        description:
          lang === 'en'
            ? 'Create a new project from any template.'
            : 'Erstelle aus jeder Vorlage ein neues Projekt.',
      },
    ],
    [copy.tourCreate, copy.tourGrid, copy.tourTitle, lang]
  );

  const createFromTemplate = async (tpl: Template) => {
    if (!user) return;
    setError(null);
    setCreatingTemplateId(tpl.id);

    const projectId = fallbackId();

    try {
      await setDoc(doc(db, 'projects', projectId), {
        name: tpl.projectName,
        ownerId: user.uid,
        ownerUid: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await Promise.all(
        tpl.pages.map(async (templatePage) => {
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

      try {
        window.localStorage.setItem(LAST_PROJECT_STORAGE_KEY, projectId);
      } catch {
        // ignore
      }

      const adminMode = isAdminEmail(user.email);
      const suffix = adminMode ? `&appTemplateId=${encodeURIComponent(tpl.id)}` : '';
      router.push(`/editor?projectId=${projectId}${suffix}`);
    } catch (e) {
      console.error('Template project creation failed', e);
      setError(lang === 'en' ? 'Project could not be created. Please try again.' : 'Projekt konnte nicht erstellt werden. Bitte versuche es erneut.');
    } finally {
      setCreatingTemplateId(null);
    }
  };

  const isAdmin = isAdminEmail(user?.email);

  const deleteTemplate = async (tpl: Template) => {
    if (!user) return;
    if (!isAdmin) return;
    if (!tpl.id) return;

    setError(null);
    const confirmed = typeof window !== 'undefined' ? window.confirm(copy.confirmDelete) : false;
    if (!confirmed) return;

    setDeletingTemplateId(tpl.id);
    try {
      await deleteDoc(doc(db, 'templates', tpl.id));
      setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
    } catch (e) {
      console.error('Template delete failed', e);
      setError(copy.deleteFailed);
    } finally {
      setDeletingTemplateId(null);
    }
  };

  if (!mounted || !authReady) {
    return null;
  }

  if (!user) {
    return <UnauthenticatedScreen badge={copy.badge} description={copy.unauthDesc} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <Header />
      <main className="flex-1 w-full px-4 py-10 lg:px-10">
        <div className="flex flex-col gap-6">
          <header className="space-y-1" data-tour-id="templates-intro">
            <h1 className="text-3xl font-semibold">{copy.headerTitle}</h1>
            <p className="text-sm text-neutral-400">{copy.headerDesc}</p>
            <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Build: {BUILD_TAG}</p>
          </header>

          <GuidedTour storageKey="tour-templates" steps={templatesTourSteps} restartLabel="Vorlagen Tutorial" />

          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
          )}

          {loadingTemplates ? (
            <p className="text-xs text-neutral-500">Lade gespeicherte Vorlagen…</p>
          ) : templates.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4 text-sm text-neutral-300">{copy.empty}</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3" data-tour-id="templates-grid">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="rounded-2xl border border-white/10 bg-neutral-900/80 p-4 shadow-lg shadow-black/30"
                >
                  <div className="text-lg font-medium text-neutral-100">{tpl.name}</div>
                  <div className="mt-1 text-sm text-neutral-400">{tpl.description}</div>
                  <button
                    type="button"
                    onClick={() => void createFromTemplate(tpl)}
                    disabled={creatingTemplateId === tpl.id || deletingTemplateId === tpl.id}
                    className={`mt-4 w-full rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      creatingTemplateId === tpl.id || deletingTemplateId === tpl.id
                        ? 'bg-white/5 text-neutral-500 cursor-wait'
                        : 'bg-white/10 text-neutral-100 hover:bg-white/20'
                    }`}
                    data-tour-id="templates-create"
                  >
                    {creatingTemplateId === tpl.id ? copy.creatingProject : copy.createProject}
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => void deleteTemplate(tpl)}
                      disabled={creatingTemplateId === tpl.id || deletingTemplateId === tpl.id}
                      className={`mt-2 w-full rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        creatingTemplateId === tpl.id || deletingTemplateId === tpl.id
                          ? 'bg-white/5 text-neutral-500 cursor-wait'
                          : 'bg-rose-500/10 text-rose-100 hover:bg-rose-500/20'
                      }`}
                    >
                      {deletingTemplateId === tpl.id ? copy.deletingTemplate : copy.deleteTemplate}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const TemplatesPage = dynamic(() => Promise.resolve(TemplatesPageComponent), { ssr: false });
export default TemplatesPage;

/*
LEGACY (hardcodierte Vorlagen) wurde entfernt.
Die Vorlagenbibliothek lädt jetzt ausschließlich aus Firestore: collection('templates').

Der restliche alte Code bleibt hier temporär auskommentiert, damit der PR-Diff klein bleibt.
Wenn du willst, entferne ich den Block komplett in einem separaten Cleanup.

---

text: { w: 296, h: 60 },
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
        targetPage: entry.targetPage,
      })),
    },
  }),
  ...children,
];

const stack = (
  items: Array<Partial<Node> & { type: Node['type'] }>,
  options?: { startY?: number; gap?: number }
): Node[] => {
  let currentY = options?.startY ?? 120;
  const gap = options?.gap ?? 16;

  return items.map((item) => {
    const node = makeNode(item.type, { ...item, y: currentY });
    currentY += node.h + gap;
    return node;
  });
};

const withAuthPages = (
  appName: string,
  pages: Template['pages'],
  options?: { background?: string }
): Template['pages'] => {
  const background = options?.background ?? defaultBackground;

  const authPages: Template['pages'] = [
    {
      name: 'Login',
      folder: 'Onboarding',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: background },
        children: stack(
          [
            { type: 'text', props: { text: `${appName} Login` }, style: { fontSize: 28, fontWeight: 700 } },
            { type: 'input', props: { placeholder: 'E-Mail', inputType: 'email' } },
            { type: 'input', props: { placeholder: 'Passwort', inputType: 'password' } },
            { type: 'button', props: { label: 'Einloggen', action: 'login' } },
            { type: 'button', props: { label: 'Registrieren', action: 'navigate', targetPage: 'Registrierung' } },
          ],
          { startY: 140 }
        ),
      },
    },
    {
      name: 'Registrierung',
      folder: 'Onboarding',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: background },
        children: stack(
          [
            { type: 'text', props: { text: `${appName} Registrierung` }, style: { fontSize: 28, fontWeight: 700 } },
            { type: 'input', props: { placeholder: 'Vorname' } },
            { type: 'input', props: { placeholder: 'E-Mail', inputType: 'email' } },
            { type: 'input', props: { placeholder: 'Passwort', inputType: 'password' } },
            { type: 'button', props: { label: 'Account anlegen', action: 'register' } },
            { type: 'button', props: { label: 'Zum Login', action: 'navigate', targetPage: 'Login' }, w: 200 },
          ],
          { startY: 140 }
        ),
      },
    },
    {
      name: 'Passwort zurücksetzen',
      folder: 'Onboarding',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: background },
        children: stack(
          [
            { type: 'text', props: { text: 'Passwort zurücksetzen' }, style: { fontSize: 26, fontWeight: 700 } },
            { type: 'input', props: { placeholder: 'E-Mail', inputType: 'email' } },
            { type: 'button', props: { label: 'Reset-Link senden', action: 'reset-password' } },
            { type: 'button', props: { label: 'Zum Login', action: 'navigate', targetPage: 'Login' }, w: 200 },
          ],
          { startY: 140 }
        ),
      },
    },
  ];

  return [...authPages, ...pages];
};

const createCompanySuiteTemplate = (): Template => {
  const navItems = [
    { label: 'Dashboard', targetPage: 'Dashboard', icon: '📊' },
    { label: 'Aufgaben', targetPage: 'Aufgaben', icon: '✅' },
    { label: 'Chat', targetPage: 'Chat', icon: '💬' },
  ];

  const pages: Template['pages'] = [
    {
      name: 'Dashboard',
      folder: 'Übersicht',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: defaultBackground },
        children: withNavbar(
          stack(
            [
              { type: 'text', props: { text: 'Unternehmens-Dashboard' }, style: { fontSize: 30, fontWeight: 700 } },
              { type: 'container', h: 220, props: { component: 'analytics' } },
              { type: 'button', props: { label: 'Aufgaben öffnen', action: 'navigate', targetPage: 'Aufgaben' }, w: 220 },
              { type: 'button', props: { label: 'Zum Chat', action: 'navigate', targetPage: 'Chat' }, w: 220 },
            ],
            { startY: 140 }
          ),
          navItems
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
          stack(
            [
              { type: 'text', props: { text: 'Aufgaben & Todos' }, style: { fontSize: 28, fontWeight: 700 } },
              {
                type: 'container',
                props: {
                  component: 'task-manager',
                  tasks: [
                    { id: fallbackId(), title: 'Release freigeben', done: true },
                    { id: fallbackId(), title: 'Feedback einsammeln', done: false },
                  ],
                },
                h: 260,
              },
              {
                type: 'container',
                props: {
                  component: 'todo',
                  todoItems: [
                    { id: fallbackId(), title: 'Vertrieb anrufen', done: false },
                    { id: fallbackId(), title: 'Projektplan aktualisieren', done: false },
                  ],
                },
                h: 200,
              },
            ],
            { startY: 140, gap: 20 }
          ),
          navItems
        ),
      },
    },
    {
      name: 'Chat',
      folder: 'Kommunikation',
      tree: {
        id: 'root',
        type: 'container',
        props: { bg: 'linear-gradient(135deg,#10172a,#1a1f3b)' },
        children: withNavbar(
          stack(
            [
              { type: 'text', props: { text: 'Team-Chat & Support' }, style: { fontSize: 28, fontWeight: 700 } },
              { type: 'container', props: { component: 'chat' }, h: 420 },
              { type: 'button', props: { label: 'Bild hochladen', action: 'upload-photo' } },
            ],
            { startY: 140, gap: 18 }
          ),
          navItems
        ),
      },
    },
  ];

  return {
    id: 'company-suite',
    name: 'Unternehmens-App',
    description: 'Dashboard, Aufgaben und Chat für dein Team.',
    projectName: 'Unternehmens-App',
    pages: withAuthPages('Unternehmens-App', pages, { background: defaultBackground }),
  };
};
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

const visibleBuiltinTemplates: Template[] = builtinTemplates
  .map((tpl) => {
    const name = safeString(tpl.name, 'Unbenannte Vorlage');
    const description = safeString(tpl.description, '');
    const projectName = safeString(tpl.projectName, name);
    if (!tpl.id || !name) return null;
    return { ...tpl, name, description, projectName } as Template;
  })
  .filter((tpl): tpl is Template => Boolean(tpl));
const LAST_PROJECT_STORAGE_KEY = 'appschmiede:last-project';

function TemplatesPageComponent() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [savedTemplatesById, setSavedTemplatesById] = useState<Record<string, Template>>({});
  const [loadingSavedTemplates, setLoadingSavedTemplates] = useState(false);
  const router = useRouter();
  const { lang } = useI18n();

  const copy = useMemo(
    () =>
      lang === 'en'
        ? {
            badge: 'Templates',
            unauthDesc: 'Sign in to copy templates and create projects directly from the catalog.',
            headerTitle: 'Template Library',
            headerDesc:
              'Start faster with curated projects. Every template uses the same building blocks as your editor and can be customized instantly.',
            tourTitle: 'Template Library',
            tourGrid: 'Ready-to-use flows like company suite, chat or event app.',
            tourCreate: 'Create a project in one click and open it in the editor.',
            createProject: 'Create project',
            creatingProject: 'Creating…',
          }
        : {
            badge: 'Vorlagen',
            unauthDesc: 'Melde dich an, um Vorlagen zu kopieren und neue Projekte direkt aus dem Katalog zu erstellen.',
            headerTitle: 'Vorlagenbibliothek',
            headerDesc:
              'Starte schneller mit vorgefertigten Projekten. Jede Vorlage nutzt die gleichen Bausteine wie dein Editor und kann direkt weiter angepasst werden.',
            tourTitle: 'Vorlagenbibliothek',
            tourGrid: 'Fertige Use-Cases wie Unternehmens-Suite, Chat oder Event-App.',
            tourCreate: 'Mit einem Klick Projekt anlegen und direkt im Editor öffnen.',
            createProject: 'Projekt erstellen',
            creatingProject: 'Wird erstellt…',
          },
    [lang]
  );

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u ? { uid: u.uid, email: u.email } : null);
        setAuthReady(true);
      }),
    []
  );

  useEffect(() => {
    if (!user) {
      setSavedTemplatesById({});
      return;
    }
    let cancelled = false;
    const loadSavedTemplates = async () => {
      setLoadingSavedTemplates(true);
      try {
        const snap = await getDocs(collection(db, 'templates'));
        const next: Record<string, Template> = {};
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const name = safeString(data?.name, 'Vorlage');
          const description = safeString(data?.description, '');
          const projectName = safeString(data?.projectName, name);
          const pagesRaw = Array.isArray(data?.pages) ? data.pages : [];
          const pages = pagesRaw
            .map((p: any) => {
              if (!p || typeof p !== 'object') return null;
              if (!p.tree || typeof p.tree !== 'object') return null;
              return {
                name: safeString(p.name, 'Seite'),
                folder: typeof p.folder === 'string' || p.folder === null ? p.folder : null,
                tree: p.tree as PageTree['tree'],
              } satisfies Omit<PageTree, 'id' | 'createdAt' | 'updatedAt'>;
            })
            .filter(Boolean) as Array<Omit<PageTree, 'id' | 'createdAt' | 'updatedAt'>>;

          next[docSnap.id] = {
            id: docSnap.id,
            name,
            description,
            projectName,
            pages,
            source: 'custom',
            createdBy: typeof data?.createdBy === 'string' ? data.createdBy : null,
          };
        });
        if (!cancelled) {
          setSavedTemplatesById(next);
        }
      } catch (e) {
        console.warn('Konnte gespeicherte Templates nicht laden', e);
        if (!cancelled) {
          setSavedTemplatesById({});
        }
      } finally {
        if (!cancelled) setLoadingSavedTemplates(false);
      }
    };
    void loadSavedTemplates();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    console.info('templates build', BUILD_TAG);
  }, []);

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

      const adminMode = isAdminEmail(user.email);
      if (adminMode) {
        try {
          const templateRef = doc(db, 'templates', tpl.id);
          const snap = await getDoc(templateRef);
          if (!snap.exists()) {
            await setDoc(templateRef, {
              name: tpl.name,
              description: tpl.description,
              projectName: tpl.projectName,
              pages: tpl.pages,
              source: tpl.source ?? 'builtin',
              createdBy: user.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (seedError) {
          console.warn('Konnte Vorlage nicht initial in Firestore anlegen', seedError);
        }
      }

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(LAST_PROJECT_STORAGE_KEY, projectId);
        } catch (storageError) {
          console.warn('Konnte letztes Projekt nicht speichern', storageError);
        }
        try {
          const suffix = adminMode ? `&appTemplateId=${encodeURIComponent(tpl.id)}` : '';
          router.push(`/editor?projectId=${projectId}${suffix}`);
        } catch (navigationError) {
          console.warn('Router-Navigation fehlgeschlagen, falle auf window.location zurück.', navigationError);
          const suffix = adminMode ? `&appTemplateId=${encodeURIComponent(tpl.id)}` : '';
          window.location.href = `/editor?projectId=${projectId}${suffix}`;
        }
        return;
      }

      const suffix = adminMode ? `&appTemplateId=${encodeURIComponent(tpl.id)}` : '';
      router.push(`/editor?projectId=${projectId}${suffix}`);
    };

  const templatesTourSteps = [
    {
      id: 'templates-intro',
      title: copy.tourTitle,
      description:
        lang === 'en'
          ? 'Here you find curated projects that already combine all editor blocks.'
          : 'Hier findest du kuratierte Projekte, die alle Bausteine des Editors bereits kombiniert verwenden.',
    },
    {
      id: 'templates-grid',
      title: copy.tourGrid,
      description:
        lang === 'en'
          ? 'Each card describes a full flow – e.g. company suite, chat or event app.'
          : 'Jede Karte beschreibt einen kompletten Flow – z. B. Unternehmens-Suite, Chat oder Event-App.',
    },
    {
      id: 'templates-create',
      title: copy.tourCreate,
      description:
        lang === 'en'
          ? 'With one click you create a project including page structure and open it in the editor.'
          : 'Mit einem Klick wird ein neues Projekt inkl. Seitenstruktur angelegt und direkt im Editor geöffnet.',
    },
  ];
  const templateMeta = useMemo(
    () => ({
      en: {
        'company-suite': {
          name: 'Company Suite',
          description: 'Dashboard, tasks and chat for your team.',
          projectName: 'Company App',
          pages: {
            Dashboard: 'Dashboard',
            Aufgaben: 'Tasks',
            Chat: 'Chat',
          },
        },
        'team-chat': {
          name: 'Team Chat & Support',
          description: 'Login, chat window, support tickets and uploads.',
          projectName: 'Team Chat',
          pages: {
            Login: 'Login',
            Start: 'Home',
            Chat: 'Chat',
            Support: 'Support',
          },
        },
        'event-planner': {
          name: 'Event Planner',
          description: 'Landing, agenda, tasks and team chat for events.',
          projectName: 'Event Planner',
        },
        'construction-manager': {
          name: 'Construction Manager',
          description: 'Project overview, tasks, files and time tracking.',
          projectName: 'Build Manager',
        },
        'time-tracking': {
          name: 'Time Tracking',
          description: 'Track work, timers and approvals.',
          projectName: 'TimePro',
        },
        'mini-crm': {
          name: 'Mini CRM',
          description: 'Contacts, deals and notes.',
          projectName: 'Mini CRM',
        },
        'course-app': {
          name: 'Course App',
          description: 'Lessons, progress and community chat.',
          projectName: 'Course App',
        },
        'field-service': {
          name: 'Field Service',
          description: 'Tickets, dispatch and chat for crews.',
          projectName: 'Field Service',
        },
        'property-suite': {
          name: 'Property Suite',
          description: 'Listings, visits and documents.',
          projectName: 'Property Suite',
        },
        'fitness-coach': {
          name: 'Fitness Coach',
          description: 'Plans, progress and check-ins.',
          projectName: 'CoachFlow',
        },
        'restaurant-suite': {
          name: 'Restaurant Suite',
          description: 'Menu, reservations and loyalty.',
          projectName: 'Restaurant',
        },
        'medical-suite': {
          name: 'Medical Suite',
          description: 'Appointments, records and chat.',
          projectName: 'Clinic App',
        },
        'inventory-suite': {
          name: 'Inventory Suite',
          description: 'Stock, movements and alerts.',
          projectName: 'Inventory',
        },
        'logistics-suite': {
          name: 'Logistics Suite',
          description: 'Shipments, tracking and status.',
          projectName: 'Logistics',
        },
        'agency-suite': {
          name: 'Agency Suite',
          description: 'Pipeline, tasks and reports for agencies.',
          projectName: 'Agency',
        },
        'photo-portfolio': {
          name: 'Photo Portfolio',
          description: 'Showcase, bookings and client area.',
          projectName: 'Photo Portfolio',
        },
        'retail-suite': {
          name: 'Retail Suite',
          description: 'Catalog, orders and support.',
          projectName: 'Retail',
        },
        'nonprofit-suite': {
          name: 'Nonprofit Suite',
          description: 'Donations, events and members.',
          projectName: 'Nonprofit',
        },
        'travel-suite': {
          name: 'Travel Suite',
          description: 'Trips, bookings and chat.',
          projectName: 'Travel Desk',
        },
        'coworking-suite': {
          name: 'Coworking Suite',
          description: 'Spaces, bookings and members.',
          projectName: 'Space Desk',
        },
      },
    }),
    []
  );

  const visibleTemplates: Template[] = useMemo(() => {
    const merged = visibleBuiltinTemplates.map((tpl) => savedTemplatesById[tpl.id] ?? tpl);

    if (lang !== 'en') return merged;

    return merged.map((tpl) => {
      const meta = templateMeta.en[tpl.id];
      if (!meta) return tpl;
      const pageTranslations = meta.pages ?? {};
      const pages = tpl.pages.map((p) => ({
        ...p,
        name: pageTranslations[p.name as keyof typeof pageTranslations] ?? p.name,
        folder: p.folder && pageTranslations[p.folder as keyof typeof pageTranslations]
          ? (pageTranslations[p.folder as keyof typeof pageTranslations] as string)
          : p.folder,
      }));
      return {
        ...tpl,
        name: meta.name ?? tpl.name,
        description: meta.description ?? tpl.description,
        projectName: meta.projectName ?? tpl.projectName,
        pages,
      };
    });
  }, [lang, templateMeta, savedTemplatesById]);

  if (!mounted || !authReady) {
    return null;
  }

  if (!user)
    return (
      <UnauthenticatedScreen
        badge={copy.badge}
        description={copy.unauthDesc}
      />
    );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <Header />
      <main className="flex-1 w-full px-4 py-10 lg:px-10">
        <div className="flex flex-col gap-6">
          <header className="space-y-1" data-tour-id="templates-intro">
            <h1 className="text-3xl font-semibold">{copy.headerTitle}</h1>
            <p className="text-sm text-neutral-400">{copy.headerDesc}</p>
            <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Build: {BUILD_TAG}</p>
          </header>

          {loadingSavedTemplates && (
            <p className="text-xs text-neutral-500">Lade gespeicherte Vorlagen…</p>
          )}

          <div className="grid gap-4 md:grid-cols-3" data-tour-id="templates-grid">
            {visibleTemplates.map((tpl) => (
              <div key={tpl.id} className="rounded-2xl border border-white/10 bg-neutral-900/80 p-4 shadow-lg shadow-black/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-lg font-medium text-neutral-100">{tpl.name ?? (lang === 'en' ? 'Template' : 'Vorlage')}</div>
                </div>
                <div className="mt-1 text-sm text-neutral-400">{tpl.description ?? ''}</div>
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
                  {creatingTemplateId === tpl.id ? copy.creatingProject : copy.createProject}
                </button>
              </div>
            ))}
          </div>
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

const TemplatesPage = dynamic(() => Promise.resolve(TemplatesPageComponent), { ssr: false });

export default TemplatesPage;

*/
