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
];

const defaultWidths: Record<Node['type'], number> = {
  text: 296,
  button: 240,
  image: 296,
  input: 296,
  container: 296,
  chat: 296,
  'qr-code': 296,
  'time-tracking': 296,
  calendar: 296,
  todo: 296,
  map: 296,
  video: 296,
  table: 296,
  navbar: 296,
  dropdown: 296,
  game: 296,
  avatar: 296,
};

const defaultHeights: Record<Node['type'], number> = {
  text: 60,
  button: 52,
  image: 180,
  input: 52,
  container: 160,
  chat: 200,
  'qr-code': 160,
  'time-tracking': 160,
  calendar: 180,
  todo: 140,
  map: 200,
  video: 180,
  table: 180,
  navbar: 80,
  dropdown: 80,
  game: 200,
  avatar: 180,
};

function makeId() {
  return randomUUID();
}

function pickPalette(prompt: string): Palette {
  if (!prompt) return palettes[0];
  const score = [...prompt].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palettes[score % palettes.length];
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

function buildAuthPages(prompt: string, palette: Palette): GeneratedPage[] {
  const pages: GeneratedPage[] = [];
  const wantsRegister = /register|registrier|signup|anmeldung|konto/.test(prompt);
  const wantsLogin = /login|anmelden|signin/.test(prompt) || wantsRegister;
  const wantsPasswordReset = /passwort|password|reset/.test(prompt);

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
  if (!/chat|messag|support|nachrichten?/.test(prompt)) return [];
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
  if (!/online|anwesenheit|status/.test(prompt)) return [];
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

function buildHomePage(prompt: string, palette: Palette): GeneratedPage {
  const wantsChat = /chat/.test(prompt);
  const wantsRegister = /register|registrier|signup/.test(prompt);
  const wantsLogin = /login|signin|anmelden/.test(prompt);

  const nodes = stackNodes(
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
    ].filter(Boolean) as StackInput[]
  );

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

function buildPages(prompt: string): GeneratedPage[] {
  const palette = pickPalette(prompt);
  const result: GeneratedPage[] = [];

  result.push(buildHomePage(prompt, palette));
  buildDefaultPages(palette).forEach((p) => result.push(p));
  buildAuthPages(prompt, palette).forEach((p) => result.push(p));
  buildChatPages(prompt, palette).forEach((p) => result.push(p));
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
