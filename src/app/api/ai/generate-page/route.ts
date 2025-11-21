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

function pickBackground(seed = 'login') {
  const checksum = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
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

function buildStandardLoginPage(desiredName?: string): PageTree {
  const hero = stack(
    [
      {
        type: 'text',
        props: { text: 'Melde dich an' },
        style: { fontSize: 30, fontWeight: 600 },
      },
      {
        type: 'text',
        props: {
          text: 'Nutze deine Zugangsdaten, um dein Projekt weiterzuführen oder neue Ideen zu testen.',
        },
        style: { fontSize: 15, lineHeight: 1.5, color: '#cbd5f5' },
        h: 72,
      },
    ],
    96,
    18
  );

  const formStart = (hero.at(-1)?.y ?? 96) + (hero.at(-1)?.h ?? 60) + 32;
  const form = stack(
    [
      { type: 'input', props: { placeholder: 'E-Mail-Adresse', inputType: 'email' } },
      { type: 'input', props: { placeholder: 'Passwort', inputType: 'password' } },
      { type: 'button', props: { label: 'Anmelden', action: 'login' } },
    ],
    formStart,
    18
  );

  const sections: Node[] = [...hero, ...form];

  const background = pickBackground();

  return {
    name: desiredName?.trim() || 'Login',
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

  const pageName = typeof body.pageName === 'string' ? body.pageName : undefined;

  const singlePage = buildStandardLoginPage(pageName);

  return NextResponse.json({ page: singlePage });
}
