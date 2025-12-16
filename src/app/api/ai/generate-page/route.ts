import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import type { PageTree, Node, NodeProps } from '@/lib/editorTypes';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

function safeParseTree(raw: unknown): PageTree | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as any;
  if (!candidate.tree || typeof candidate.tree !== 'object') return null;
  return {
    name: typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name.trim() : 'KI-Layout',
    tree: candidate.tree as PageTree['tree'],
  } satisfies PageTree;
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

function buildSimpleChatPage(prompt: string): PageTree {
  const background = pickBackground('chat');
  const headline = prompt && prompt.length > 3 ? prompt : 'Team Chat';
  const hero = stack(
    [
      {
        type: 'text',
        props: { text: headline },
        style: { fontSize: 30, fontWeight: 700 },
      },
      {
        type: 'text',
        props: { text: 'Nachrichten, Dateien und Support an einem Ort.' },
        style: { fontSize: 15, lineHeight: 1.5, color: '#cbd5f5' },
        h: 70,
      },
    ],
    86,
    16
  );

  const chatStart = (hero.at(-1)?.y ?? 86) + (hero.at(-1)?.h ?? 60) + 24;
  const chatArea = stack(
    [
      {
        type: 'container',
        props: { component: 'chat' },
        h: 360,
      },
      {
        type: 'input',
        props: { placeholder: 'Nachricht schreiben…', inputType: 'text' },
      },
      {
        type: 'button',
        props: { label: 'Senden', action: 'chat' },
      },
    ],
    chatStart,
    14
  );

  const sections: Node[] = [
    ...hero,
    ...chatArea,
  ];

  return {
    name: 'Chat',
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
  const userPrompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

  // Fallback ohne OpenAI oder ohne Prompt, aber mit Heuristik auf Chat
  if (!OPENAI_API_KEY || !userPrompt) {
    const normalized = userPrompt.toLowerCase();
    const wantsChat = /chat|messag|support|konversation|unterhaltung/.test(normalized);
    const singlePage = wantsChat
      ? buildSimpleChatPage(pageName ?? userPrompt)
      : buildStandardLoginPage(pageName ?? userPrompt);
    return NextResponse.json({ page: singlePage, source: 'fallback' });
  }

  try {
    const systemPrompt = `Du bist ein Layout-Generator für eine No-Code-App (AppSchmiede). Erzeuge ein JSON-Objekt vom Typ PageTree mit folgenden Regeln:
- id des Root-Knotens muss 'root' sein.
- Erlaubte Node-Typen: text, button, image, input, container.
- Props-Beispiele: text.text, button.label, button.action (login|register|reset-password|navigate|chat|none), button.targetPage (optional), input.placeholder, input.inputType (text|email|password|number|tel), container.component (navbar|chat|time-tracking optional), navbars dürfen navItems (label,targetPage,target) haben.
- Setze sinnvolle x,y,w,h (max 360) und einen Hintergrund unter tree.props.bg.
  - Antworte NUR mit JSON im Format {"name":"...","tree":{...}} ohne Markdown oder Kommentare.
  - Bevorzuge die geforderten Inhalte aus dem Nutzerprompt. Erzeuge KEINE Login- oder Auth-Seite, sofern der Nutzer nicht explizit nach Login/Registration fragt.
  - Falls der Nutzer nach einer Chat-Seite fragt, muss mindestens ein container mit component: "chat" enthalten sein und ein Eingabefeld für Nachrichten.`;

    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        max_tokens: 900,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Baue eine Seite für: ${userPrompt}. Seitentitel: ${pageName ?? 'Seite'}. Verwende nur Login/Registrierung, wenn im Prompt gefordert. Wenn Chat gewünscht ist, füge eine Chat-Komponente, Eingabe und Senden-Button hinzu.`,
          },
        ],
      }),
    });

    if (!completion.ok) {
      const errText = await completion.text();
      console.error('OpenAI error', errText);
      throw new Error('OpenAI konnte keine Seite erzeugen.');
    }

    const result = (await completion.json()) as any;
    const content = result?.choices?.[0]?.message?.content;
    let parsed: PageTree | null = null;
    if (typeof content === 'string') {
      try {
        parsed = safeParseTree(JSON.parse(content));
      } catch (error) {
        console.warn('Konnte OpenAI-Antwort nicht parsen, nutze Fallback', error);
      }
    }

    const normalized = userPrompt.toLowerCase();
    const wantsChat = /chat|messag|support|konversation|unterhaltung/.test(normalized);
    const page = parsed ?? (wantsChat ? buildSimpleChatPage(pageName ?? userPrompt) : buildStandardLoginPage(pageName ?? userPrompt));

    return NextResponse.json({ page, source: 'openai' });
  } catch (error) {
    console.error('AI generation failed, falling back', error);
    const normalized = userPrompt.toLowerCase();
    const wantsChat = /chat|messag|support|konversation|unterhaltung/.test(normalized);
    const fallback = wantsChat
      ? buildSimpleChatPage(pageName ?? userPrompt)
      : buildStandardLoginPage(pageName ?? userPrompt);
    return NextResponse.json({ page: fallback, source: 'fallback' });
  }
}
