import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import type { PageTree, Node, NodeProps } from '@/lib/editorTypes';

const defaultWidths: Record<Node['type'], number> = {
  text: 296,
  button: 240,
  image: 296,
  input: 296,
  container: 320,
};

const defaultHeights: Record<Node['type'], number> = {
  text: 60,
  button: 52,
  image: 180,
  input: 52,
  container: 200,
};

const gradients = [
  'linear-gradient(135deg,#0b1220,#14263d)',
  'linear-gradient(135deg,#10172a,#1f2c46)',
  'linear-gradient(145deg,#0c111d,#1c1f36)',
  'linear-gradient(150deg,#07121f,#122131)',
];

function makeId() {
  return randomUUID();
}

function pickBackground(prompt: string) {
  if (!prompt) return gradients[0];
  const checksum = [...prompt].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[checksum % gradients.length];
}

function createNode(type: Node['type'], overrides: Partial<Node> = {}): Node {
  const width = overrides.w ?? defaultWidths[type];
  const height = overrides.h ?? defaultHeights[type];
  return {
    id: overrides.id ?? makeId(),
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

function stack(nodes: Array<{ type: Node['type']; props?: NodeProps; style?: Node['style']; h?: number }>, startY = 96, gap = 24) {
  let cursor = startY;
  return nodes.map((entry) => {
    const instance = createNode(entry.type, {
      y: cursor,
      h: entry.h,
      props: entry.props,
      style: entry.style,
    });
    cursor += (instance.h ?? defaultHeights[entry.type]) + gap;
    return instance;
  });
}

function buildSinglePage(prompt: string, desiredName?: string): PageTree {
  const normalized = prompt.toLowerCase();
  const wantsForm = /(registrier|sign|formular|form|login|kontakt)/.test(normalized);
  const wantsChat = /(chat|support|nachrichten|team)/.test(normalized);
  const wantsStats = /(analyse|analytics|zahlen|dashboard|report)/.test(normalized);
  const wantsTasks = /(aufgabe|todo|tasks|liste)/.test(normalized);
  const wantsMedia = /(bild|image|foto|gallery|hero)/.test(normalized);

  const hero = stack([
    {
      type: 'text',
      props: {
        text: prompt.trim() ? prompt.trim().slice(0, 80) : 'Neue Seite',
      },
      style: { fontSize: 28, fontWeight: 600 },
    },
    {
      type: 'text',
      props: {
        text: 'Die KI hat diese Seite auf Basis deiner Beschreibung erstellt. Du kannst jedes Element weiterbearbeiten.',
      },
      style: { fontSize: 15, lineHeight: 1.5, color: '#cbd5f5' },
      h: 72,
    },
  ]);

  const sections: Node[] = [...hero];

  if (wantsForm) {
    sections.push(
      ...stack(
        [
          { type: 'input', props: { placeholder: 'Vorname', inputType: 'text' } },
          { type: 'input', props: { placeholder: 'E-Mail-Adresse', inputType: 'email' } },
          { type: 'input', props: { placeholder: wantsChat ? 'Nachricht' : 'Passwort', inputType: wantsChat ? 'text' : 'password' } },
          { type: 'button', props: { label: wantsChat ? 'Anfrage senden' : 'Account erstellen', action: wantsChat ? 'support-ticket' : 'register' } },
        ],
        sections.at(-1)?.y ? (sections.at(-1)?.y ?? 96) + (sections.at(-1)?.h ?? 60) + 40 : 220
      )
    );
  }

  if (wantsChat) {
    sections.push(
      createNode('container', {
        y: sections.at(-1)?.y ? (sections.at(-1)?.y ?? 96) + (sections.at(-1)?.h ?? 60) + 48 : 280,
        h: 260,
        props: { component: 'chat' },
      })
    );
  }

  if (wantsStats) {
    sections.push(
      createNode('container', {
        y: sections.at(-1)?.y ? (sections.at(-1)?.y ?? 96) + (sections.at(-1)?.h ?? 60) + 48 : 320,
        h: 200,
        props: { component: 'analytics' },
      })
    );
  }

  if (wantsTasks) {
    sections.push(
      createNode('container', {
        y: sections.at(-1)?.y ? (sections.at(-1)?.y ?? 96) + (sections.at(-1)?.h ?? 60) + 48 : 360,
        h: 200,
        props: {
          component: 'task-manager',
          tasks: [
            { id: makeId(), title: 'Kickoff vorbereiten', done: false },
            { id: makeId(), title: 'Design überprüfen', done: true },
          ],
        },
      })
    );
  }

  if (wantsMedia) {
    sections.push(
      createNode('image', {
        y: sections.at(-1)?.y ? (sections.at(-1)?.y ?? 96) + (sections.at(-1)?.h ?? 60) + 40 : 260,
        h: 220,
        props: {
          src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
        },
      })
    );
  }

  if (!wantsForm) {
    sections.push(
      createNode('button', {
        y: sections.at(-1)?.y ? (sections.at(-1)?.y ?? 96) + (sections.at(-1)?.h ?? 60) + 40 : 260,
        props: { label: 'Jetzt starten', action: 'navigate', target: 'support', targetPage: 'Support' },
      })
    );
  }

  const background = pickBackground(prompt);

  return {
    name: desiredName?.trim() || 'Aktuelle Seite',
    tree: {
      id: 'root',
      type: 'container',
      props: { bg: background },
      children: sections,
    },
  };
}

type GeneratePageBody = {
  prompt?: unknown;
  pageName?: unknown;
};

export async function POST(request: Request) {
  let body: GeneratePageBody = {};
  try {
    body = await request.json();
  } catch (error) {
    body = {};
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt : '';
  const pageName = typeof body.pageName === 'string' ? body.pageName : undefined;

  const singlePage = buildSinglePage(prompt.trim(), pageName);

  return NextResponse.json({ page: singlePage });
}
