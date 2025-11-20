import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import type { Node, PageTree } from '@/lib/editorTypes';

type GeneratedPage = Omit<PageTree, 'id' | 'createdAt' | 'updatedAt'>;

type Palette = {
  background: string;
  highlight: string;
};

type StackInput = {
  type: Node['type'];
  props?: Node['props'];
  style?: Node['style'];
  width?: number;
  height?: number;
};

const palettes: Palette[] = [
  {
    background: 'linear-gradient(135deg, #091322, #16263B)',
    highlight: '#38BDF8',
  },
  {
    background: 'linear-gradient(135deg, #0F172A, #312E81)',
    highlight: '#818CF8',
  },
  {
    background: 'linear-gradient(135deg, #111827, #1F2937)',
    highlight: '#F472B6',
  },
  {
    background: 'linear-gradient(135deg, #0B1120, #1B1F3B)',
    highlight: '#34D399',
  },
  {
    background: 'linear-gradient(150deg, #16040b, #330b1b, #5a0f2c, #a8164a)',
    highlight: '#FF7AB8',
  },
];

const defaultWidths: Record<Node['type'], number> = {
  text: 296,
  button: 240,
  image: 296,
  input: 296,
  container: 296,
};

const defaultHeights: Record<Node['type'], number> = {
  text: 60,
  button: 52,
  image: 180,
  input: 52,
  container: 160,
};

function makeId() {
  return randomUUID();
}

function pickPalette(prompt: string): Palette {
  if (/sexy|romant|passion|verf(?:\w*)|glam|pink/i.test(prompt)) {
    return palettes[palettes.length - 1];
  }
  if (!prompt) return palettes[0];
  const score = [...prompt].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palettes[score % (palettes.length - 1)];
}

function makeNode(type: Node['type'], overrides: Partial<Node>): Node {
  const width = overrides.w ?? overrides.width ?? defaultWidths[type];
  const height = overrides.h ?? overrides.height ?? defaultHeights[type];
  return {
    id: makeId(),
    type,
    x: overrides.x ?? 32,
    y: overrides.y ?? 48,
    w: width,
    h: height,
    props: overrides.props ?? {},
    style: overrides.style ?? {},
    children: overrides.children,
  };
}

function stackNodes(inputs: StackInput[], options?: { startY?: number; gap?: number }): Node[] {
  const startY = options?.startY ?? 48;
  const gap = options?.gap ?? 24;
  let cursor = startY;
  return inputs.map((input) => {
    const node = makeNode(input.type, {
      y: cursor,
      x: input.props?.component === 'navbar' ? 24 : undefined,
      w: input.width,
      h: input.height,
      props: input.props,
      style: input.style,
    });
    cursor += (node.h ?? defaultHeights[input.type]) + gap;
    return node;
  });
}

function page(name: string, palette: Palette, children: Node[], folder?: string | null): GeneratedPage {
  return {
    name,
    folder: folder ?? null,
    tree: {
      id: 'root',
      type: 'container',
      props: { bg: palette.background },
      children,
    },
  };
}

type NavEntry = {
  label: string;
  targetPage: string;
  icon?: string;
};

function createNavItems(entries: NavEntry[]) {
  return entries.map((entry) => ({
    id: makeId(),
    label: entry.label,
    action: 'navigate',
    target: `#${entry.targetPage.toLowerCase()}`,
    targetPage: entry.targetPage,
    icon: entry.icon,
  }));
}

function buildAuthPages(prompt: string, palette: Palette): GeneratedPage[] {
  const normalized = prompt.toLowerCase();
  const pages: GeneratedPage[] = [];
  const wantsRegister = /register|registrier|signup|anmeldung|konto/.test(normalized);
  const wantsLogin = /login|anmelden|signin/.test(normalized) || wantsRegister;
  const wantsPasswordReset = /passwort|password|reset/.test(normalized);

  if (wantsLogin) {
    const nodes = stackNodes([
      {
        type: 'text',
        props: { text: 'Willkommen zurück!' },
        style: { fontSize: 28, fontWeight: 600 },
      },
      {
        type: 'input',
        props: { placeholder: 'E-Mail-Adresse', inputType: 'email' },
      },
      {
        type: 'input',
        props: { placeholder: 'Passwort', inputType: 'password' },
      },
      {
        type: 'button',
        props: { label: 'Anmelden', action: 'login' },
      },
      {
        type: 'button',
        props: {
          label: 'Passwort vergessen',
          action: 'navigate',
          target: 'passwort',
          targetPage: 'Passwort',
        },
      },
      {
        type: 'button',
        props: {
          label: 'Konto erstellen',
          action: 'navigate',
          target: 'registrierung',
          targetPage: 'Registrierung',
        },
      },
    ]);
    pages.push(page('Login', palette, nodes, 'Authentifizierung'));
  }

  if (wantsRegister) {
    const nodes = stackNodes([
      {
        type: 'text',
        props: { text: 'Konto erstellen' },
        style: { fontSize: 26, fontWeight: 600 },
      },
      {
        type: 'input',
        props: { placeholder: 'Vollständiger Name', inputType: 'text' },
      },
      {
        type: 'input',
        props: { placeholder: 'E-Mail-Adresse', inputType: 'email' },
      },
      {
        type: 'input',
        props: { placeholder: 'Passwort', inputType: 'password' },
      },
      {
        type: 'input',
        props: { placeholder: 'Passwort bestätigen', inputType: 'password' },
      },
      {
        type: 'button',
        props: { label: 'Registrieren', action: 'navigate', target: 'login', targetPage: 'Login' },
      },
    ]);
    pages.push(page('Registrierung', palette, nodes, 'Authentifizierung'));
  }

  if (wantsPasswordReset) {
    const nodes = stackNodes([
      {
        type: 'text',
        props: { text: 'Passwort zurücksetzen' },
        style: { fontSize: 26, fontWeight: 600 },
      },
      {
        type: 'text',
        props: {
          text: 'Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.',
        },
        style: { fontSize: 16, lineHeight: 1.45 },
        height: 96,
      },
      {
        type: 'input',
        props: { placeholder: 'E-Mail-Adresse', inputType: 'email' },
      },
      {
        type: 'button',
        props: { label: 'Link senden', action: 'email', target: 'support@example.com' },
      },
      {
        type: 'button',
        props: { label: 'Zurück zum Login', action: 'navigate', target: 'login', targetPage: 'Login' },
      },
    ]);
    pages.push(page('Passwort', palette, nodes, 'Authentifizierung'));
  }

  return pages;
}

function buildChatPages(prompt: string, palette: Palette): GeneratedPage[] {
  if (!/chat|messag|support|nachrichten?/.test(prompt.toLowerCase())) return [];
  const nodes = [
    makeNode('text', {
      y: 40,
      props: { text: 'Teamchat' },
      style: { fontSize: 28, fontWeight: 600 },
    }),
    makeNode('container', {
      y: 96,
      h: 260,
      props: { component: 'chat' },
    }),
    makeNode('input', {
      y: 372,
      props: { placeholder: 'Nachricht schreiben...', inputType: 'text' },
    }),
    makeNode('button', {
      y: 440,
      props: { label: 'Senden', action: 'chat' },
    }),
  ];

  return [page('Chat', palette, nodes, 'Kommunikation')];
}

function buildPresencePage(prompt: string, palette: Palette): GeneratedPage[] {
  if (!/online|anwesenheit|status/.test(prompt.toLowerCase())) return [];
  const chips = ['Melanie • aktiv', 'Jonas • in Meeting', 'Alex • abwesend', 'Priya • aktiv'];
  const nodes: Node[] = [
    makeNode('text', {
      y: 40,
      props: { text: 'Aktive Benutzer:innen' },
      style: { fontSize: 26, fontWeight: 600 },
    }),
  ];
  chips.forEach((label, index) => {
    nodes.push(
      makeNode('text', {
        y: 108 + index * 56,
        h: 48,
        props: { text: label },
        style: {
          fontSize: 18,
          fontWeight: 500,
          background: 'rgba(148, 163, 184, 0.15)',
          padding: '12px 16px',
          borderRadius: '12px',
        },
      })
    );
  });
  nodes.push(
    makeNode('container', {
      y: 330,
      h: 120,
      props: { component: 'time-tracking' },
    })
  );

  return [page('Online', palette, nodes, 'Kommunikation')];
}

function buildLocationPage(prompt: string, palette: Palette): GeneratedPage[] {
  const normalized = prompt.toLowerCase();
  if (!/standort|karte|map|maps|gps|location/.test(normalized)) return [];

  const statusChips = ['Design Team · Berlin', 'Support · München', 'Projektleitung · Hamburg'];

  const nodes: Node[] = [
    makeNode('text', {
      y: 40,
      props: { text: 'Standort & Online-Status' },
      style: { fontSize: 26, fontWeight: 600 },
    }),
    makeNode('text', {
      y: 92,
      h: 64,
      props: {
        text: 'Live-Map mit allen Teams. Sichtbar ist, wer online ist und wo gerade gearbeitet wird.',
      },
      style: { fontSize: 15, lineHeight: 1.5, color: '#f9c2dc' },
    }),
    makeNode('container', {
      y: 168,
      h: 220,
      props: {
        component: 'map',
        mapLocation: 'Team-Standorte',
        mapPins: statusChips.map((chip) => ({ id: makeId(), label: chip })),
      },
    }),
    makeNode('container', {
      y: 404,
      h: 140,
      props: {
        component: 'folder-structure',
        folderTree: statusChips.map((chip) => ({ id: makeId(), name: chip, children: [] })),
      },
    }),
  ];

  statusChips.forEach((label, index) => {
    nodes.push(
      makeNode('text', {
        y: 560 + index * 44,
        h: 36,
        props: { text: `${label} • online` },
        style: {
          fontSize: 14,
          fontWeight: 500,
          background: 'rgba(255, 255, 255, 0.08)',
          padding: '8px 12px',
          borderRadius: '999px',
        },
      })
    );
  });

  return [page('Standort', palette, nodes, 'Kommunikation')];
}

function buildHomePage(prompt: string, palette: Palette): GeneratedPage {
  const normalized = prompt.toLowerCase();
  const wantsChat = /chat/.test(normalized);
  const wantsRegister = /register|registrier|signup/.test(normalized);
  const wantsLogin = /login|signin|anmelden/.test(normalized);

  const navbar = makeNode('container', {
    y: 32,
    h: 64,
    props: {
      component: 'navbar',
      navItems: createNavItems([
        { label: 'Dashboard', targetPage: 'Start', icon: '🏠' },
        wantsRegister ? { label: 'Registrieren', targetPage: 'Registrierung', icon: '📝' } : null,
        wantsLogin ? { label: 'Login', targetPage: 'Login', icon: '🔐' } : null,
        wantsChat ? { label: 'Chat', targetPage: 'Chat', icon: '💬' } : null,
      ].filter(Boolean) as NavEntry[]),
    },
  });

  const nodes = [
    navbar,
    ...stackNodes(
      [
        {
          type: 'text',
          props: { text: 'Deine App, erstellt von KI' },
          style: { fontSize: 30, fontWeight: 600 },
        },
        {
          type: 'text',
          props: {
            text: 'Erkunde Seiten, verwalte Benutzer und arbeite in Echtzeit zusammen – alles aus einer Oberfläche.',
          },
          style: { fontSize: 17, lineHeight: 1.5 },
          height: 96,
        },
        wantsRegister
          ? {
              type: 'button',
              props: { label: 'Registrieren', action: 'navigate', target: 'registrierung', targetPage: 'Registrierung' },
              width: 220,
            }
          : null,
        wantsLogin
          ? {
              type: 'button',
              props: { label: 'Login', action: 'navigate', target: 'login', targetPage: 'Login' },
              width: 220,
            }
          : null,
        wantsChat
          ? {
              type: 'button',
              props: { label: 'Zum Chat', action: 'navigate', target: 'chat', targetPage: 'Chat' },
              width: 220,
            }
          : null,
        {
          type: 'image',
          props: {
            src: 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=800&q=80',
          },
          height: 200,
        },
      ].filter(Boolean) as StackInput[],
      { startY: 128 }
    ),
  ];

  return page('Start', palette, nodes, 'Übersicht');
}

function buildDefaultPages(palette: Palette): GeneratedPage[] {
  const analyticsNodes = [
    makeNode('text', {
      y: 40,
      props: { text: 'Kennzahlen' },
      style: { fontSize: 26, fontWeight: 600 },
    }),
    makeNode('container', {
      y: 104,
      h: 180,
      props: { component: 'analytics' },
    }),
    makeNode('container', {
      y: 300,
      h: 140,
      props: { component: 'todo' },
    }),
  ];

  return [page('Dashboard', palette, analyticsNodes, 'Übersicht')];
}

function buildCompanySuitePages(prompt: string, palette: Palette): GeneratedPage[] {
  const normalized = prompt.toLowerCase();
  const mentionsCompany = /unternehmen|firma|team|belegschaft|business/.test(normalized);
  const mentionsProjects = /projekt/.test(normalized);
  const mentionsTime = /zeit|time|stunden|arbeitszeit|tracking/.test(normalized);
  const mentionsTasks = /aufgabe|task|todo|verteilung/.test(normalized);
  const mentionsNotifications = /benachrichtig|notification|hinweis/.test(normalized);
  const mentionsChat = /chat|kommunikation|messag|talk/.test(normalized);

  if (!(mentionsCompany || mentionsProjects || mentionsTime || mentionsTasks || mentionsChat)) {
    return [];
  }

  const navEntries: NavEntry[] = [
    { label: 'Dashboard', targetPage: 'Unternehmen' },
  ];
  if (mentionsTime) navEntries.push({ label: 'Zeiten', targetPage: 'Zeiterfassung', icon: '⏱️' });
  if (mentionsTasks) navEntries.push({ label: 'Aufgaben', targetPage: 'Aufgaben', icon: '✅' });
  if (mentionsChat) navEntries.push({ label: 'Kommunikation', targetPage: 'Kommunikation', icon: '💬' });
  if (mentionsProjects) navEntries.push({ label: 'Projekte', targetPage: 'Projekte', icon: '📁' });

  const navbar = makeNode('container', {
    y: 32,
    h: 64,
    props: {
      component: 'navbar',
      navItems: createNavItems(navEntries),
      supportTarget: 'support@unternehmen.app',
    },
  });

  const dashboardNodes: Node[] = [
    navbar,
    ...stackNodes(
      [
        {
          type: 'text',
          props: { text: 'Unternehmensübersicht' },
          style: { fontSize: 28, fontWeight: 600 },
        },
        {
          type: 'text',
          props: {
            text: 'Aktuelle Projekte, Team-Updates und Benachrichtigungen auf einen Blick.',
          },
          style: { fontSize: 16, lineHeight: 1.5 },
          height: 72,
        },
        mentionsTime
          ? {
              type: 'container',
              props: {
                component: 'time-tracking',
                timeTracking: {
                  entries: [
                    { id: makeId(), label: 'Projekt Alpha', seconds: 3600, startedAt: new Date().toISOString() },
                    { id: makeId(), label: 'Projekt Beta', seconds: 5400, endedAt: new Date().toISOString() },
                  ],
                },
              },
              height: 180,
            }
          : null,
        mentionsTasks
          ? {
              type: 'container',
              props: {
                component: 'task-manager',
                tasks: [
                  { id: makeId(), title: 'Onboarding vorbereiten', done: false },
                  { id: makeId(), title: 'Projektstatus prüfen', done: true },
                ],
              },
              height: 180,
            }
          : null,
        mentionsNotifications
          ? {
              type: 'container',
              props: {
                component: 'todo',
                todoItems: [
                  { id: makeId(), title: 'HR-Update veröffentlichen', done: false },
                  { id: makeId(), title: 'Budgetfreigabe prüfen', done: false },
                ],
              },
              height: 160,
            }
          : null,
      ].filter(Boolean) as StackInput[],
      { startY: 124 }
    ),
  ];

  const pages: GeneratedPage[] = [page('Unternehmen', palette, dashboardNodes, 'Übersicht')];

  if (mentionsTime) {
    const timeNodes = [
      navbar,
      ...stackNodes(
        [
          {
            type: 'text',
            props: { text: 'Zeiterfassung nach Projekt' },
            style: { fontSize: 26, fontWeight: 600 },
          },
          {
            type: 'container',
            props: {
              component: 'time-tracking',
              timeTracking: {
                entries: [
                  {
                    id: makeId(),
                    label: 'Projekt Alpha - UX Konzept',
                    seconds: 7200,
                    startedAt: new Date(Date.now() - 7200 * 1000).toISOString(),
                    endedAt: new Date().toISOString(),
                  },
                  {
                    id: makeId(),
                    label: 'Projekt Beta - API Entwicklung',
                    seconds: 3600,
                    startedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
                  },
                ],
              },
            },
            height: 220,
          },
          mentionsProjects
            ? {
                type: 'container',
                props: {
                  component: 'folder-structure',
                  folderTree: [
                    { id: makeId(), name: 'Projekt Alpha', children: [{ id: makeId(), name: 'Sprint 1' }] },
                    { id: makeId(), name: 'Projekt Beta', children: [{ id: makeId(), name: 'QA' }] },
                  ],
                },
                height: 200,
              }
            : null,
          {
            type: 'text',
            props: {
              text: 'Starte oder stoppe deine Zeit – jede Session landet automatisch im passenden Projektordner.',
            },
            style: { fontSize: 14, lineHeight: 1.4, color: '#fbcfe8' },
            height: 60,
          },
          {
            type: 'button',
            props: { label: 'Start', action: 'time-tracking-start' },
            width: 140,
          },
          {
            type: 'button',
            props: { label: 'Stop', action: 'time-tracking-stop' },
            width: 140,
          },
        ].filter(Boolean) as StackInput[],
        { startY: 124 }
      ),
    ];
    pages.push(page('Zeiterfassung', palette, timeNodes, 'Team')); // folder Team
  }

  if (mentionsTasks || mentionsNotifications) {
    const taskNodes = [
      navbar,
      ...stackNodes(
        [
          {
            type: 'text',
            props: { text: 'Aufgaben & Benachrichtigungen' },
            style: { fontSize: 26, fontWeight: 600 },
          },
          mentionsTasks
            ? {
                type: 'container',
                props: {
                  component: 'task-manager',
                  tasks: [
                    { id: makeId(), title: 'Projekt Kickoff planen', done: false },
                    { id: makeId(), title: 'Design-Review freigeben', done: false },
                    { id: makeId(), title: 'Sprintabschluss bestätigen', done: true },
                  ],
                },
                height: 220,
              }
            : null,
          mentionsNotifications
            ? {
                type: 'container',
                props: {
                  component: 'todo',
                  todoItems: [
                    { id: makeId(), title: 'Benachrichtigung: Neue Aufgabe für Alex', done: false },
                    { id: makeId(), title: 'Reminder: Stundenzettel einreichen', done: false },
                  ],
                },
                height: 180,
              }
            : null,
          {
            type: 'button',
            props: { label: 'Neue Aufgabe zuweisen', action: 'support-ticket', supportTarget: 'tasks@unternehmen.app' },
          },
        ].filter(Boolean) as StackInput[],
        { startY: 124 }
      ),
    ];
    pages.push(page('Aufgaben', palette, taskNodes, 'Team'));
  }

  if (mentionsChat) {
    const chatNodes = [
      navbar,
      ...stackNodes(
        [
          {
            type: 'text',
            props: { text: 'Teamkommunikation' },
            style: { fontSize: 26, fontWeight: 600 },
          },
          {
            type: 'container',
            props: { component: 'chat' },
            height: 240,
          },
          {
            type: 'button',
            props: { label: 'Bild hochladen', action: 'upload-photo' },
          },
          {
            type: 'container',
            props: {
              component: 'support',
              supportChannel: 'chat',
              supportTarget: 'support@unternehmen.app',
            },
            height: 160,
          },
        ] as StackInput[],
        { startY: 124 }
      ),
    ];
    pages.push(page('Kommunikation', palette, chatNodes, 'Team'));
  }

  if (mentionsProjects) {
    const projectNodes = [
      navbar,
      ...stackNodes(
        [
          {
            type: 'text',
            props: { text: 'Projektübersicht' },
            style: { fontSize: 26, fontWeight: 600 },
          },
          {
            type: 'text',
            props: {
              text: 'Ordnerstruktur mit direkter Verknüpfung zur Zeiterfassung – jede Stunde landet im passenden Ordner.',
            },
            style: { fontSize: 15, lineHeight: 1.4, color: '#f9a8d4' },
            height: 72,
          },
          {
            type: 'container',
            props: {
              component: 'folder-structure',
              folderTree: [
                {
                  id: makeId(),
                  name: 'Projekt Alpha',
                  children: [
                    { id: makeId(), name: 'Design' },
                    { id: makeId(), name: 'Umsetzung' },
                  ],
                },
                {
                  id: makeId(),
                  name: 'Projekt Beta',
                  children: [
                    { id: makeId(), name: 'Sprint 1' },
                    { id: makeId(), name: 'Sprint 2' },
                  ],
                },
              ],
            },
            height: 240,
          },
          mentionsNotifications
            ? {
                type: 'container',
                props: {
                  component: 'support',
                  supportChannel: 'ticket',
                  supportTarget: 'pm@unternehmen.app',
                  supportTickets: [
                    {
                      id: makeId(),
                      subject: 'Statusupdate Projekt Alpha',
                      message: 'Bitte Marketing-Slider aktualisieren.',
                      createdAt: new Date().toISOString(),
                      channel: 'ticket',
                    },
                  ],
                },
                height: 180,
              }
            : null,
        ].filter(Boolean) as StackInput[],
        { startY: 124 }
      ),
    ];
    pages.push(page('Projekte', palette, projectNodes, 'Übersicht'));
  }

  return pages;
}

function buildPages(prompt: string): GeneratedPage[] {
  const palette = pickPalette(prompt);
  const result: GeneratedPage[] = [];

  result.push(buildHomePage(prompt, palette));
  buildDefaultPages(palette).forEach((p) => result.push(p));
  buildCompanySuitePages(prompt, palette).forEach((p) => result.push(p));
  buildAuthPages(prompt, palette).forEach((p) => result.push(p));
  buildChatPages(prompt, palette).forEach((p) => result.push(p));
  buildLocationPage(prompt, palette).forEach((p) => result.push(p));
  buildPresencePage(prompt, palette).forEach((p) => result.push(p));

  const seen = new Set<string>();
  return result.filter((item) => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
}

type GenerateBody = {
  prompt?: unknown;
};

export async function POST(request: Request) {
  let body: GenerateBody = {};
  try {
    body = await request.json();
  } catch (error) {
    body = {};
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt : '';
  const pages = buildPages(prompt.trim());

  return NextResponse.json({
    pages,
  });
}
