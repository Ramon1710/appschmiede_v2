'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import CategorizedToolbox from './CategorizedToolbox';
import Header from '@/components/Header';
import type { PageTree, Node as EditorNode, NodeType, NodeProps } from '@/lib/editorTypes';
import { savePage, subscribePages, createPage, deletePage, createPageWithContent } from '@/lib/db-editor';

type MutableNode = Omit<EditorNode, 'props' | 'style' | 'children'> & {
  props?: Record<string, unknown>;
  style?: Record<string, unknown>;
  children?: EditorNode[];
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const sanitizeValue = (value: unknown): unknown => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeValue(item))
      .filter((item) => item !== undefined);
  }
  if (isPlainObject(value)) {
    return sanitizeRecord(value as Record<string, unknown>);
  }
  return value;
};

const sanitizeRecord = (input?: Record<string, unknown> | null): Record<string, unknown> | undefined => {
  if (!input) return undefined;
  const entries: Array<[string, unknown]> = [];
  for (const [key, rawValue] of Object.entries(input)) {
    const cleaned = sanitizeValue(rawValue);
    if (cleaned !== undefined) {
      entries.push([key, cleaned]);
    }
  }
  if (!entries.length) return undefined;
  return Object.fromEntries(entries);
};

const sanitizeNode = (node: EditorNode): EditorNode => {
  const mutable: MutableNode = {
    id: node.id,
    type: node.type,
  };
  if (node.x !== undefined) mutable.x = node.x;
  if (node.y !== undefined) mutable.y = node.y;
  if (node.w !== undefined) mutable.w = node.w;
  if (node.h !== undefined) mutable.h = node.h;
  const props = sanitizeRecord(node.props as Record<string, unknown> | undefined);
  if (props) mutable.props = props;
  const style = sanitizeRecord(node.style as Record<string, unknown> | undefined);
  if (style) mutable.style = style;
  const children = (node.children ?? []).map(sanitizeNode);
  mutable.children = children;
  return mutable as EditorNode;
};

const sanitizePage = (page: PageTree): PageTree => ({
  ...page,
  tree: sanitizeNode(page.tree),
});

const DEFAULT_PAGE_BACKGROUND = 'linear-gradient(140deg,#0b0b0f,#111827)';

const emptyTree: PageTree = {
  id: 'local',
  name: 'Seite 1',
  tree: {
    id: 'root',
    type: 'container',
    props: { bg: DEFAULT_PAGE_BACKGROUND },
    children: [],
  },
};

type Props = {
  initialPageId?: string | null;
};

type AiToolId = 'chat' | 'speaker' | 'calc' | 'image' | 'video';

type AiTool = {
  id: AiToolId;
  label: string;
  icon: string;
  description: string;
  status?: 'beta' | 'soon';
  action?: 'open-generator';
};

const AI_MENU_ITEMS: AiTool[] = [
  {
    id: 'chat',
    label: 'KI Chat',
    icon: '💬',
    description: 'Ideen austauschen und Inhalte generieren lassen.',
    status: 'soon',
  },
  {
    id: 'speaker',
    label: 'KI Sprecher',
    icon: '🎤',
    description: 'Text-to-Speech Stimmen für Prototypen vorbereiten.',
    status: 'soon',
  },
  {
    id: 'calc',
    label: 'KI Berechnung',
    icon: '🧮',
    description: 'Smarte Formeln und Automatisierungen testen.',
    status: 'soon',
  },
  {
    id: 'image',
    label: 'KI Bildgenerator',
    icon: '🖼️',
    description: 'Neue Seitenideen aus Beschreibungen erstellen.',
    status: 'beta',
    action: 'open-generator',
  },
  {
    id: 'video',
    label: 'KI Videogenerator',
    icon: '🎬',
    description: 'Onboarding-Videos automatisch skizzieren.',
    status: 'soon',
  },
];

export default function EditorShell({ initialPageId }: Props) {
  const searchParams = useSearchParams();
  const routeParams = useParams<{ projectId?: string; pageId?: string }>();
  const [tree, setTree] = useState<PageTree>(() => sanitizePage(emptyTree));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);
  const latestTree = useRef<PageTree>(sanitizePage(emptyTree));
  const suppressAutoCreate = useRef(false);

  // Unterstütze sowohl ?projectId= als auch ?id=
  const queryProjectId = searchParams.get('projectId') ?? searchParams.get('id');
  const paramsProjectId = typeof routeParams?.projectId === 'string' ? routeParams.projectId : null;
  const _projectId = queryProjectId ?? paramsProjectId ?? null;

  const queryPageId = searchParams.get('pageId') ?? searchParams.get('p');
  const paramsPageId = typeof routeParams?.pageId === 'string' ? routeParams.pageId : null;

  const [currentPageId, setCurrentPageId] = useState<string | null>(initialPageId ?? paramsPageId ?? queryPageId ?? null);
  useEffect(() => {
    latestTree.current = tree;
  }, [tree]);

  useEffect(() => {
    const nextResolved = initialPageId ?? paramsPageId ?? queryPageId ?? null;
    if (!nextResolved) return;
    setCurrentPageId((prev) => (prev === nextResolved ? prev : nextResolved));
  }, [initialPageId, paramsPageId, queryPageId]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        saveTimeout.current = null;
      }
      if (!(_projectId && currentPageId)) return;
      if (!isDirty.current) return;
      const snapshot = latestTree.current;
      (async () => {
        try {
          await savePage(_projectId, currentPageId, snapshot);
          isDirty.current = false;
        } catch (err) {
          console.error('Flush before leave failed', err);
        }
      })();
    };
  }, [_projectId, currentPageId]);

  const [pages, setPages] = useState<PageTree[]>([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiReplace, setAiReplace] = useState(true);
  const [aiMode, setAiMode] = useState<'app' | 'page'>('app');
  const [selectedAiTool, setSelectedAiTool] = useState<AiToolId>('chat');
  const [aiMenuOpen, setAiMenuOpen] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<'toolbox' | 'canvas' | 'properties'>('canvas');

  const downloadAnchor = useRef<HTMLAnchorElement | null>(null);

  const applyTreeUpdate = useCallback(
    (updater: (prev: PageTree) => PageTree, options?: { markDirty?: boolean }): PageTree => {
      let nextState: PageTree | undefined;
      setTree((prev) => {
        const updated = sanitizePage(updater(prev));
        nextState = updated;
        latestTree.current = updated;
        return updated;
      });
      if (options?.markDirty !== false) {
        isDirty.current = true;
      }
      return nextState ?? latestTree.current;
    },
    []
  );

  const openTemplatesWindow = useCallback(() => {
    const url = '/tools/templates';
    if (typeof window === 'undefined') return;
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.href = url;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (downloadAnchor.current) {
        downloadAnchor.current.remove();
        downloadAnchor.current = null;
      }
    };
  }, []);

  const onRemove = useCallback((id: string) => {
    applyTreeUpdate((prev) => ({
      ...prev,
      tree: {
        ...prev.tree,
        children: (prev.tree.children ?? []).filter((n) => n.id !== id),
      },
    }));
    setSelectedId((current) => (current === id ? null : current));
  }, [applyTreeUpdate]);

  const onMove = useCallback((id: string, dx: number, dy: number) => {
    applyTreeUpdate((prev) => ({
      ...prev,
      tree: {
        ...prev.tree,
        children: (prev.tree.children ?? []).map((n) =>
          n.id === id ? { ...n, x: (n.x ?? 0) + dx, y: (n.y ?? 0) + dy } : n
        ),
      },
    }));
  }, [applyTreeUpdate]);

  const selectedNode = useMemo(
    () => (tree.tree.children ?? []).find((n) => n.id === selectedId) ?? null,
    [tree, selectedId]
  );

  const selectedAiToolData = useMemo(
    () => AI_MENU_ITEMS.find((item) => item.id === selectedAiTool) ?? AI_MENU_ITEMS[0],
    [selectedAiTool]
  );

  const settingsHref = useMemo(() => (_projectId ? `/editor/settings?projectId=${_projectId}` : null), [_projectId]);

  const pageBackground = useMemo(() => {
    const raw = tree.tree.props?.bg;
    return typeof raw === 'string' && raw.trim() ? raw : DEFAULT_PAGE_BACKGROUND;
  }, [tree]);

  const setPageBackground = useCallback((value: string) => {
    const next = typeof value === 'string' && value.trim() ? value : DEFAULT_PAGE_BACKGROUND;
    applyTreeUpdate((prev) => ({
      ...prev,
      tree: {
        ...prev.tree,
        props: { ...(prev.tree.props ?? {}), bg: next },
      },
    }));
  }, [applyTreeUpdate]);

  const generatePageBackground = useCallback((description: string) => {
    const colors = ['#38BDF8', '#6366F1', '#F472B6', '#22D3EE', '#F97316', '#A855F7'];
    const hash = [...description].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const first = colors[hash % colors.length];
    const second = colors[(hash + 3) % colors.length];
    const third = colors[(hash + 5) % colors.length];
    const gradient = `linear-gradient(140deg, ${first}, ${second}, ${third})`;
    setPageBackground(gradient);
  }, [setPageBackground]);

  const resetPageBackground = useCallback(() => {
    setPageBackground(DEFAULT_PAGE_BACKGROUND);
  }, [setPageBackground]);

  const updateNode = useCallback(
    (id: string, patch: Partial<EditorNode>) => {
      applyTreeUpdate((prev) => ({
        ...prev,
        tree: {
          ...prev.tree,
          children: (prev.tree.children ?? []).map((n) => {
            if (n.id !== id) return n;
            const nextProps = patch.props ? { ...(n.props ?? {}), ...patch.props } : n.props;
            const nextStyle = patch.style ? { ...(n.style ?? {}), ...patch.style } : n.style;
            return {
              ...n,
              ...patch,
              props: nextProps,
              style: nextStyle,
            };
          }),
        },
      }));
    },
    [applyTreeUpdate]
  );

  const applyTemplate = useCallback((template: string) => {
    const defaultWidths: Record<NodeType, number> = {
      text: 296,
      button: 240,
      image: 296,
      input: 296,
      container: 296,
    };

    const defaultHeights: Record<NodeType, number> = {
      text: 60,
      button: 48,
      image: 200,
      input: 52,
      container: 200,
    };

    const createNode = (type: NodeType, overrides: Partial<EditorNode> = {}): EditorNode => ({
      id: crypto.randomUUID(),
      type,
      x: overrides.x ?? 32,
      y: overrides.y ?? 96,
      w: overrides.w ?? defaultWidths[type],
      h: overrides.h ?? defaultHeights[type],
      props: overrides.props ?? {},
      style: overrides.style ?? {},
      children: overrides.children,
    });

    const stack = (
      items: Array<{ type: NodeType; node?: Partial<EditorNode> }>,
      startY = 96,
      gap = 24
    ) => {
      let cursor = startY;
      return items.map(({ type, node }) => {
        const next = createNode(type, { ...node, y: node?.y ?? cursor });
        cursor += (next.h ?? defaultHeights[type]) + gap;
        return next;
      });
    };

    let nodes: EditorNode[] = [];
    let background: string | undefined;

    if (template === 'login') {
      background = 'linear-gradient(155deg,#0b1220,#142238)';
      nodes = stack([
        {
          type: 'text',
          node: {
            props: { text: 'Willkommen zurück!' },
            style: { fontSize: 28, fontWeight: 600 },
          },
        },
        {
          type: 'text',
          node: {
            h: 72,
            style: { fontSize: 15, lineHeight: 1.5, color: '#cbd5f5' },
            props: { text: 'Melde dich mit deinem Konto an, um deine Projekte zu bearbeiten.' },
          },
        },
        {
          type: 'input',
          node: { props: { placeholder: 'Benutzername oder E-Mail', inputType: 'text' } },
        },
        {
          type: 'input',
          node: { props: { placeholder: 'Passwort', inputType: 'password' } },
        },
        {
          type: 'button',
          node: { props: { label: 'Anmelden', action: 'login' } },
        },
        {
          type: 'button',
          node: {
            w: 260,
            props: {
              label: 'Zur Registrierung',
              action: 'navigate',
              target: 'registrierung',
              targetPage: 'Registrierung',
            },
          },
        },
        {
          type: 'button',
          node: {
            w: 260,
            props: {
              label: 'Passwort vergessen?',
              action: 'navigate',
              target: 'passwort',
              targetPage: 'Passwort',
            },
          },
        },
      ]);
    } else if (template === 'register') {
      background = 'linear-gradient(160deg,#101b32,#172a45)';
      nodes = stack([
        {
          type: 'text',
          node: {
            props: { text: 'Registrierung' },
            style: { fontSize: 27, fontWeight: 600 },
          },
        },
        {
          type: 'text',
          node: {
            h: 72,
            style: { fontSize: 15, lineHeight: 1.5, color: '#cbd5f5' },
            props: { text: 'Lege dein Konto an und starte direkt mit der App-Erstellung.' },
          },
        },
        {
          type: 'input',
          node: { props: { placeholder: 'Vorname', inputType: 'text' } },
        },
        {
          type: 'input',
          node: { props: { placeholder: 'Name', inputType: 'text' } },
        },
        {
          type: 'input',
          node: { props: { placeholder: 'Adresse', inputType: 'text' } },
        },
        {
          type: 'input',
          node: { props: { placeholder: 'Unternehmen', inputType: 'text' } },
        },
        {
          type: 'input',
          node: { props: { placeholder: 'E-Mail-Adresse', inputType: 'email' } },
        },
        {
          type: 'input',
          node: { props: { placeholder: 'Passwort', inputType: 'password' } },
        },
        {
          type: 'button',
          node: { props: { label: 'Bild hochladen', action: 'upload-photo' } },
        },
        {
          type: 'button',
          node: {
            props: {
              label: 'Registrieren',
              action: 'register',
              target: 'login',
              targetPage: 'Login',
            },
          },
        },
      ]);
    } else if (template === 'password-reset') {
      background = 'linear-gradient(170deg,#0d172b,#1c2d4a)';
      nodes = stack([
        {
          type: 'text',
          node: {
            props: { text: 'Passwort zurücksetzen' },
            style: { fontSize: 26, fontWeight: 600 },
          },
        },
        {
          type: 'text',
          node: {
            h: 72,
            style: { fontSize: 15, lineHeight: 1.55, color: '#cbd5f5' },
            props: {
              text: 'Gib deine E-Mail-Adresse ein. Wir senden dir einen Link, um ein neues Passwort festzulegen.',
            },
          },
        },
        {
          type: 'input',
          node: { props: { placeholder: 'E-Mail-Adresse', inputType: 'email' } },
        },
        {
          type: 'button',
          node: {
            props: {
              label: 'Neues Passwort senden',
              action: 'reset-password',
            },
          },
        },
        {
          type: 'button',
          node: {
            props: {
              label: 'Zurück zum Login',
              action: 'navigate',
              target: 'login',
              targetPage: 'Login',
            },
          },
        },
      ]);
    } else if (template === 'chat') {
      background = 'linear-gradient(155deg,#0a1224,#141f3b)';
      nodes = stack([
        {
          type: 'text',
          node: {
            props: { text: 'Teamchat' },
            style: { fontSize: 28, fontWeight: 600 },
          },
        },
        {
          type: 'text',
          node: {
            h: 72,
            style: { fontSize: 15, lineHeight: 1.5, color: '#cbd5f5' },
            props: { text: 'Bleib mit deinem Projektteam verbunden, tausche Sprachnachrichten aus und teile Bilder.' },
          },
        },
        {
          type: 'container',
          node: {
            h: 320,
            props: { component: 'chat' },
          },
        },
        {
          type: 'input',
          node: {
            h: 56,
            props: { placeholder: 'Nachricht eingeben...' },
          },
        },
        {
          type: 'button',
          node: {
            w: 180,
            props: { label: 'Senden', action: 'chat', target: '+491234567890' },
          },
        },
      ]);
    }

    if (!nodes.length) {
      return false;
    }

    const nextTree = applyTreeUpdate((prev) => ({
      ...prev,
      tree: {
        ...prev.tree,
        props: {
          ...(prev.tree.props ?? {}),
          bg: background ?? prev.tree.props?.bg ?? DEFAULT_PAGE_BACKGROUND,
        },
        children: nodes,
      },
    }));

    if (_projectId && currentPageId && nextTree) {
      const payload = nextTree;
      latestTree.current = payload;
      (async () => {
        try {
          await savePage(_projectId, currentPageId, payload);
          isDirty.current = false;
        } catch (err) {
          console.error('Template save failed', err);
          isDirty.current = true;
        }
      })();
    }
    setSelectedId(null);
    return true;
  }, [_projectId, currentPageId]);

  const addNode = useCallback((type: NodeType, defaultProps: NodeProps = {}) => {
    if (typeof defaultProps.template === 'string') {
      const applied = applyTemplate(defaultProps.template);
      if (applied) {
        return;
      }
    }

    const nodeProps = { ...defaultProps } as NodeProps;
    if ('template' in nodeProps) {
      delete nodeProps.template;
    }

    const newNode: EditorNode = {
      id: crypto.randomUUID(),
      type,
      x: 100,
      y: 100,
      w: 240,
      h: type === 'text' ? 60 : type === 'button' ? 40 : 120,
      props: nodeProps,
    };

    applyTreeUpdate((prev) => ({
      ...prev,
      tree: {
        ...prev.tree,
        children: [...(prev.tree.children ?? []), newNode],
      },
    }));
    setSelectedId(newNode.id);
  }, [applyTemplate, applyTreeUpdate]);

  useEffect(() => {
    if (!(_projectId && currentPageId)) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        await savePage(_projectId, currentPageId, tree);
        isDirty.current = false;
        console.log('✅ Autosave successful');
      } catch (err) {
        console.error('❌ Autosave failed', err);
      }
    }, 2000);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [tree, _projectId, currentPageId]);

  useEffect(() => {
    if (!_projectId) return;
    const off = subscribePages(_projectId, (pgs) => {
      setPages(pgs);
      if (!currentPageId) {
        if (pgs.length > 0) {
          const first = pgs[0];
          setCurrentPageId(first?.id ?? null);
          if (first) {
            applyTreeUpdate(() => first, { markDirty: false });
          }
        } else if (!suppressAutoCreate.current) {
          (async () => {
            const id = await createPage(_projectId, 'Seite 1');
            setCurrentPageId(id);
          })();
        }
      } else {
        const sel = pgs.find((p) => p.id === currentPageId);
        if (sel && !isDirty.current) {
          applyTreeUpdate(() => sel, { markDirty: false });
        }
      }
    });
    return () => off();
  }, [_projectId, currentPageId, applyTreeUpdate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedId) return;
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      const target = event.target as HTMLElement | null;
      if (target && (target.closest('input, textarea') || target.contentEditable === 'true')) {
        return;
      }
      event.preventDefault();
      onRemove(selectedId);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, onRemove]);

  const runAiGenerator = useCallback(async () => {
    if (!aiPrompt.trim()) {
      setAiError('Bitte gib eine Beschreibung ein.');
      return;
    }
    if (!_projectId) {
      setAiError('Bitte öffne zuerst ein Projekt oder speichere dein aktuelles Projekt, bevor du die KI nutzt.');
      return;
    }
    if (aiMode === 'page' && !currentPageId) {
      setAiError('Bitte wähle eine Seite aus, damit die KI sie anpassen kann.');
      return;
    }
    setAiBusy(true);
    setAiError(null);
    try {
      if (aiMode === 'app') {
        const response = await fetch('/api/ai/generate-pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: aiPrompt }),
        });
        if (!response.ok) {
          throw new Error('Die KI konnte keine Seiten erzeugen.');
        }
        const data = (await response.json()) as { pages?: Array<Omit<PageTree, 'id' | 'createdAt' | 'updatedAt'>> };
        if (!data.pages || data.pages.length === 0) {
          throw new Error('Keine Seiten-Vorschläge gefunden.');
        }

        const generated = data.pages;
        suppressAutoCreate.current = aiReplace;

        if (aiReplace) {
          const idsToRemove = pages.map((p) => p.id).filter((id): id is string => Boolean(id));
          for (const id of idsToRemove) {
            await deletePage(_projectId, id);
          }
          setCurrentPageId(null);
          applyTreeUpdate(() => emptyTree, { markDirty: false });
          setSelectedId(null);
          isDirty.current = false;
        }

        const createdIds: string[] = [];
        for (const pagePayload of generated) {
          const newId = await createPageWithContent(_projectId, pagePayload);
          createdIds.push(newId);
        }

        if (createdIds.length > 0) {
          setCurrentPageId(createdIds[0]);
        }

        setAiPrompt('');
        setAiOpen(false);
      } else {
        const response = await fetch('/api/ai/generate-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: aiPrompt, pageName: tree.name ?? undefined }),
        });
        if (!response.ok) {
          throw new Error('Die KI konnte die Seite nicht aktualisieren.');
        }
        const data = (await response.json()) as { page?: PageTree };
        if (!data.page || !data.page.tree) {
          throw new Error('Keine Seitenergebnisse erhalten.');
        }

        const updatedTree = applyTreeUpdate((prev) => ({
          ...prev,
          name: data.page?.name ?? prev.name,
          tree: data.page?.tree ?? prev.tree,
        }));
        setSelectedId(null);

        if (_projectId && currentPageId) {
          await savePage(_projectId, currentPageId, updatedTree);
          isDirty.current = false;
        }

        setAiPrompt('');
        setAiOpen(false);
      }
    } catch (error) {
      console.error('AI generation failed', error);
      setAiError(error instanceof Error ? error.message : 'Unbekannter Fehler bei der KI-Erstellung.');
    } finally {
      suppressAutoCreate.current = false;
      setAiBusy(false);
    }
  }, [_projectId, currentPageId, aiPrompt, aiMode, aiReplace, pages, applyTreeUpdate, tree.name]);

  const onExport = useCallback(() => {
    if (!(_projectId && pages.length)) {
      return;
    }

    const payload = {
      projectId: _projectId,
      exportedAt: new Date().toISOString(),
      pages: pages.map(({ id, name, folder, tree }) => ({ id, name, folder: folder ?? null, tree })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    if (!downloadAnchor.current) {
      downloadAnchor.current = document.createElement('a');
      downloadAnchor.current.style.display = 'none';
      document.body.appendChild(downloadAnchor.current);
    }

    downloadAnchor.current.href = url;
    downloadAnchor.current.download = `appschmiede-${_projectId}.json`;
    downloadAnchor.current.click();
    URL.revokeObjectURL(url);
  }, [_projectId, pages]);

  const handlePageSelection = useCallback((id: string | null) => {
    setCurrentPageId(id);
    const sel = pages.find((p) => p.id === id);
    if (sel) applyTreeUpdate(() => sel, { markDirty: false });
  }, [pages, applyTreeUpdate]);

  const handleAiMenuAction = useCallback(
    (toolId: AiToolId) => {
      if (toolId === 'image') {
        setAiError(null);
        setAiOpen(true);
      }
    },
    [setAiError, setAiOpen]
  );

  return (
    <div className="flex h-screen flex-col bg-[#05070e]">
      <Header />
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
          <aside className="hidden w-[19rem] flex-shrink-0 flex-col border-r border-[#222] bg-[#0b0b0f]/90 backdrop-blur-sm lg:flex">
            <div className="space-y-3 border-b border-[#222] p-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20"
              >
                <span className="text-lg">←</span>
                <span>Zurück zum Dashboard</span>
              </Link>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded bg-white/10 px-2 py-1 text-xs transition hover:bg-white/20 disabled:opacity-40"
                  onClick={onExport}
                  disabled={!pages.length}
                >
                  Exportieren
                </button>
                <button
                  className="rounded border border-emerald-400/40 bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200 transition hover:bg-emerald-500/30"
                  onClick={() => {
                    setAiError(null);
                    setAiOpen(true);
                  }}
                >
                  KI Generator
                </button>
                {settingsHref ? (
                  <Link
                    href={settingsHref}
                    className="rounded border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/10"
                  >
                    ⚙️ Projekt-Einstellungen
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="rounded border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/50"
                  >
                    ⚙️ Projekt-Einstellungen
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="flex-1 rounded border border-[#333] bg-neutral-900 px-2 py-1 text-sm"
                  value={currentPageId ?? ''}
                  onChange={(event) => handlePageSelection(event.target.value || null)}
                >
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  className="rounded border border-rose-500/40 bg-rose-500/20 px-2 py-1 text-xs text-rose-200 transition hover:bg-rose-500/30 disabled:opacity-40"
                  disabled={!_projectId || !currentPageId || pages.length <= 1}
                  onClick={async () => {
                    if (!(_projectId && currentPageId) || pages.length <= 1) return;
                    const confirmed = window.confirm('Seite wirklich löschen?');
                    if (!confirmed) return;
                    try {
                      await deletePage(_projectId, currentPageId);
                      setSelectedId(null);
                      setCurrentPageId(null);
                    } catch (err) {
                      console.error('Seite konnte nicht gelöscht werden', err);
                    }
                  }}
                >
                  - Seite
                </button>
                <button
                  className="rounded bg-white/10 px-2 py-1 text-xs transition hover:bg-white/20"
                  onClick={async () => {
                    if (!_projectId) return;
                    const idx = pages.length + 1;
                    const id = await createPage(_projectId, `Seite ${idx}`);
                    handlePageSelection(id ?? null);
                  }}
                >
                  + Seite
                </button>
              </div>
            </div>
            <div className="border-b border-[#111]/60 p-4">
              <button
                type="button"
                onClick={() => setAiMenuOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 transition hover:bg-white/10"
              >
                <span>KI Menü</span>
                <span className="text-base text-neutral-300">{aiMenuOpen ? 'v' : '>'}</span>
              </button>
              {aiMenuOpen && (
                <>
                  <div className="mt-3 space-y-2">
                    {AI_MENU_ITEMS.map((item) => {
                      const isActive = item.id === selectedAiTool;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedAiTool(item.id)}
                          className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                            isActive
                              ? 'border-emerald-400/60 bg-emerald-500/15 shadow-inner'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg" aria-hidden="true">{item.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-sm font-semibold text-neutral-100">
                                <span>{item.label}</span>
                                {item.status === 'beta' && (
                                  <span className="text-[10px] uppercase tracking-wide text-emerald-300">Beta</span>
                                )}
                                {item.status === 'soon' && (
                                  <span className="text-[10px] uppercase tracking-wide text-neutral-400">Bald</span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-400">{item.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {selectedAiToolData && (
                    <div className="mt-3 rounded-xl border border-emerald-400/40 bg-[#0b1512] p-3 shadow-lg">
                      <p className="text-sm font-semibold text-neutral-100">{selectedAiToolData.label}</p>
                      <p className="mt-1 text-xs text-neutral-400">{selectedAiToolData.description}</p>
                      {selectedAiToolData.action === 'open-generator' ? (
                        <button
                          type="button"
                          onClick={() => handleAiMenuAction(selectedAiToolData.id)}
                          className="mt-3 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-3 py-2 text-xs font-semibold text-white shadow-md transition hover:from-emerald-400 hover:to-cyan-400"
                        >
                          KI-Seitengenerator öffnen
                        </button>
                      ) : (
                        <p className="mt-3 text-[11px] uppercase tracking-wide text-neutral-500">In Vorbereitung</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              <CategorizedToolbox onAdd={addNode} />
            </div>
          </aside>

          <main className="flex flex-1 min-h-0 flex-col overflow-hidden">
            <div className="border-b border-[#111] bg-[#0b0b0f]/95 px-4 py-3 shadow-inner lg:hidden">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20"
                >
                  <span className="text-lg">←</span>
                  <span>Dashboard</span>
                </Link>
                <button
                  className="rounded border border-white/10 bg-white/10 px-3 py-2 text-xs transition hover:bg-white/20 disabled:opacity-40"
                  onClick={onExport}
                  disabled={!pages.length}
                >
                  Export
                </button>
                <button
                  className="rounded border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 text-xs text-emerald-200 transition hover:bg-emerald-500/30"
                  onClick={() => {
                    setAiError(null);
                    setAiOpen(true);
                  }}
                >
                  KI
                </button>
                {settingsHref ? (
                  <Link
                    href={settingsHref}
                    className="inline-flex items-center justify-center rounded border border-white/10 bg-white/10 px-3 py-2 text-xs transition hover:bg-white/20"
                  >
                    ⚙️ Einstellungen
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs text-neutral-400"
                  >
                    ⚙️ Einstellungen
                  </button>
                )}
              </div>
              <div className="mt-3">
                <select
                  className="w-full rounded border border-[#333] bg-neutral-900 px-3 py-2 text-sm"
                  value={currentPageId ?? ''}
                  onChange={(event) => handlePageSelection(event.target.value || null)}
                >
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  className="flex-1 rounded border border-rose-500/40 bg-rose-500/20 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/30 disabled:opacity-40"
                  disabled={!_projectId || !currentPageId || pages.length <= 1}
                  onClick={async () => {
                    if (!(_projectId && currentPageId) || pages.length <= 1) return;
                    const confirmed = window.confirm('Seite wirklich löschen?');
                    if (!confirmed) return;
                    try {
                      await deletePage(_projectId, currentPageId);
                      setSelectedId(null);
                      setCurrentPageId(null);
                    } catch (err) {
                      console.error('Seite konnte nicht gelöscht werden', err);
                    }
                  }}
                >
                  - Seite
                </button>
                <button
                  className="flex-1 rounded border border-white/10 bg-white/10 px-3 py-2 text-xs transition hover:bg-white/20"
                  onClick={async () => {
                    if (!_projectId) return;
                    const idx = pages.length + 1;
                    const id = await createPage(_projectId, `Seite ${idx}`);
                    handlePageSelection(id ?? null);
                  }}
                >
                  + Seite
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <button
                  type="button"
                  className={`rounded-lg border px-3 py-2 font-medium transition ${
                    mobilePanel === 'toolbox'
                      ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100'
                      : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                  onClick={() => setMobilePanel('toolbox')}
                >
                  Werkzeuge
                </button>
                <button
                  type="button"
                  className={`rounded-lg border px-3 py-2 font-medium transition ${
                    mobilePanel === 'canvas'
                      ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100'
                      : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                  onClick={() => setMobilePanel('canvas')}
                >
                  Website Vorschau
                </button>
                <button
                  type="button"
                  className={`rounded-lg border px-3 py-2 font-medium transition ${
                    mobilePanel === 'properties'
                      ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100'
                      : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                  onClick={() => setMobilePanel('properties')}
                >
                  Eigenschaften
                </button>
              </div>
            </div>

            <div className="border-b border-[#111]/60 bg-[#05070e]/90 px-4 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">App-Vorlagen</p>
                  <p className="text-xs text-neutral-400">
                    Die Vorlagen öffnen sich jetzt in einem eigenen Fenster. Nach der Auswahl startet automatisch der Editor mit dem neuen Projekt.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openTemplatesWindow}
                  className="inline-flex items-center justify-center rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/25"
                >
                  Vorlagen-Fenster öffnen
                </button>
              </div>
              <p className="mt-3 text-[11px] text-neutral-500">
                Tipp: Du findest die Bibliothek auch jederzeit unter <Link className="underline decoration-dotted" href="/tools/templates">/tools/templates</Link>.
              </p>
            </div>

            <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
              {mobilePanel === 'toolbox' && (
                <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 lg:hidden">
                  <CategorizedToolbox onAdd={addNode} />
                </div>
              )}
              {mobilePanel === 'canvas' && (
                <div className="flex flex-1 min-h-0 flex-col overflow-auto px-4 py-4 lg:hidden">
                  <div className="flex flex-1 overflow-auto rounded-2xl border border-white/10 bg-[#070a13]/80 p-3 shadow-2xl">
                    <Canvas
                      tree={tree}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onRemove={onRemove}
                      onMove={onMove}
                      onResize={(id, patch) => updateNode(id, patch)}
                      onUpdateNode={(id, patch) => updateNode(id, patch)}
                    />
                  </div>
                </div>
              )}
              {mobilePanel === 'properties' && (
                <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 lg:hidden">
                  <div className="rounded-2xl border border-white/10 bg-[#070a13]/80 p-4 shadow-2xl">
                    <PropertiesPanel
                      node={selectedNode}
                      onUpdate={(patch) => {
                        if (selectedId) updateNode(selectedId, patch);
                      }}
                      pageBackground={pageBackground}
                      onChangeBackground={setPageBackground}
                      onGenerateBackground={generatePageBackground}
                      onResetBackground={resetPageBackground}
                    />
                  </div>
                </div>
              )}

              <div className="hidden flex-1 min-h-0 overflow-auto p-6 lg:flex">
                <div className="flex flex-1 overflow-auto rounded-2xl border border-white/10 bg-[#070a13]/80 p-4 shadow-2xl">
                  <Canvas
                    tree={tree}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onRemove={onRemove}
                    onMove={onMove}
                    onResize={(id, patch) => updateNode(id, patch)}
                    onUpdateNode={(id, patch) => updateNode(id, patch)}
                  />
                </div>
              </div>
            </div>
          </main>

          <aside className="hidden w-[22rem] flex-shrink-0 flex-col border-l border-[#222] bg-[#0b0b0f]/90 backdrop-blur-sm lg:flex">
            <div className="flex-1 overflow-y-auto p-4">
              <PropertiesPanel
                node={selectedNode}
                onUpdate={(patch) => {
                  if (selectedId) updateNode(selectedId, patch);
                }}
                pageBackground={pageBackground}
                onChangeBackground={setPageBackground}
                onGenerateBackground={generatePageBackground}
                onResetBackground={resetPageBackground}
              />
            </div>
          </aside>
        </div>
      </div>

      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0d101b] p-6 shadow-2xl">
            <div className="space-y-2 pb-4">
              <h2 className="text-xl font-semibold text-neutral-100">KI-Seitengenerator</h2>
              <p className="text-sm text-neutral-400">
                Beschreibe, was angepasst werden soll – egal ob komplette App oder nur die aktuelle Seite.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { id: 'app', title: 'Gesamte App', description: 'Erstellt neue Seiten' },
                { id: 'page', title: 'Aktuelle Seite', description: 'passt den Screen an' },
              ].map((mode) => {
                const active = aiMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setAiMode(mode.id as 'app' | 'page');
                      setAiError(null);
                    }}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      active
                        ? 'border-emerald-400/60 bg-emerald-500/15 text-white'
                        : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-sm font-semibold">{mode.title}</div>
                    <p className="text-xs text-neutral-400">{mode.description}</p>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-neutral-400">
              {aiMode === 'app'
                ? 'Erstellt mehrere Seiten und kann dein Projekt ersetzen oder ergänzen.'
                : 'Bleibt in der aktuellen Seite und ersetzt deren Inhalte durch einen neuen Vorschlag.'}
            </p>
            <textarea
              value={aiPrompt}
              onChange={(event) => {
                setAiPrompt(event.target.value);
                if (aiError) setAiError(null);
              }}
              placeholder="Was soll erstellt werden?"
              className="h-32 w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 focus:border-emerald-400 focus:outline-none"
            />
            {aiMode === 'app' && (
              <label className="mt-4 flex items-center gap-2 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  checked={aiReplace}
                  onChange={(event) => setAiReplace(event.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-neutral-900"
                />
                Bestehende Seiten ersetzen
              </label>
            )}
            {aiError && (
              <div className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {aiError}
              </div>
            )}
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100"
                onClick={() => (!aiBusy ? setAiOpen(false) : null)}
                disabled={aiBusy}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-60"
                onClick={runAiGenerator}
                disabled={aiBusy}
              >
                {aiBusy ? 'Erstelle…' : aiMode === 'app' ? 'App erzeugen' : 'Seite aktualisieren'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

