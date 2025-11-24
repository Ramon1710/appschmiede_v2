'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import CategorizedToolbox from './CategorizedToolbox';
import QRCodeButton from '../_extensions/QRCodeButton';
import Header from '@/components/Header';
import type { PageTree, Node as EditorNode, NodeType, NodeProps } from '@/lib/editorTypes';
import { savePage, subscribePages, createPage, deletePage, renamePage } from '@/lib/db-editor';
import useAuth from '@/hooks/useAuth';
import type { Project } from '@/lib/db-projects';
import { subscribeProjects } from '@/lib/db-projects';

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

const hashPage = (page?: PageTree | null): string => {
  if (!page) return '';
  return JSON.stringify({
    id: page.id ?? '',
    name: page.name ?? '',
    folder: page.folder ?? null,
    tree: page.tree ?? emptyTree.tree,
  });
};

type Props = {
  initialPageId?: string | null;
};

type AppTemplateDefinition = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  template: string;
  gradient: string;
};

const APP_TEMPLATES: AppTemplateDefinition[] = [
  {
    id: 'tpl-login',
    title: 'Login',
    subtitle: 'Authentifizierung',
    description: 'Formulare mit Passwort-Logik und Buttons.',
    icon: '🔐',
    template: 'login',
    gradient: 'from-purple-500/40 via-indigo-500/20 to-cyan-500/40',
  },
  {
    id: 'tpl-register',
    title: 'Registrierung',
    subtitle: 'Onboarding',
    description: 'Mehrere Eingabefelder und CTA-Buttons.',
    icon: '📝',
    template: 'register',
    gradient: 'from-emerald-500/40 via-cyan-500/20 to-blue-500/40',
  },
  {
    id: 'tpl-password',
    title: 'Passwort Reset',
    subtitle: 'Support',
    description: 'Reset-Erklärung, Eingabefeld & Call-to-Action.',
    icon: '🔑',
    template: 'password-reset',
    gradient: 'from-amber-500/40 via-orange-500/20 to-rose-500/40',
  },
  {
    id: 'tpl-chat',
    title: 'Chat',
    subtitle: 'Kommunikation',
    description: 'Chatfenster plus Eingabefeld & Aktionen.',
    icon: '💬',
    template: 'chat',
    gradient: 'from-emerald-500/40 via-teal-500/20 to-sky-500/40',
  },
];

const LAST_PROJECT_KEY = 'appschmiede:last-project';

export default function EditorShell({ initialPageId }: Props) {
  const searchParams = useSearchParams();
  const routeParams = useParams<{ projectId?: string; pageId?: string }>();
  const [tree, setTree] = useState<PageTree>(() => sanitizePage(emptyTree));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);
  const latestTree = useRef<PageTree>(sanitizePage(emptyTree));
  const pendingSyncHash = useRef<string | null>(null);
  const { user, loading } = useAuth();

  // Unterstütze sowohl ?projectId= als auch ?id=
  const [storedProjectId, setStoredProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(LAST_PROJECT_KEY);
    if (saved) {
      setStoredProjectId(saved);
    }
  }, []);

  const queryProjectId = searchParams.get('projectId') ?? searchParams.get('id');
  const paramsProjectId = typeof routeParams?.projectId === 'string' ? routeParams.projectId : null;
  const [manualProjectId, setManualProjectId] = useState<string | null>(null);
  const derivedProjectId = queryProjectId ?? paramsProjectId ?? storedProjectId ?? null;
  const _projectId = manualProjectId ?? derivedProjectId ?? null;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!_projectId) return;
    window.localStorage.setItem(LAST_PROJECT_KEY, _projectId);
    if (storedProjectId !== _projectId) {
      setStoredProjectId(_projectId);
    }
  }, [_projectId, storedProjectId]);

  const queryPageId = searchParams.get('pageId') ?? searchParams.get('p');
  const paramsPageId = typeof routeParams?.pageId === 'string' ? routeParams.pageId : null;

  const [currentPageId, setCurrentPageId] = useState<string | null>(initialPageId ?? paramsPageId ?? queryPageId ?? null);
  const [projects, setProjects] = useState<Project[]>([]);
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
          pendingSyncHash.current = hashPage(snapshot);
          isDirty.current = false;
        } catch (err) {
          console.error('Flush before leave failed', err);
        }
      })();
    };
  }, [_projectId, currentPageId]);

  useEffect(() => {
    if (!user?.uid) {
      setProjects([]);
      return;
    }
    const off = subscribeProjects(user.uid, (next) => setProjects(next));
    return () => off();
  }, [user?.uid]);

  useEffect(() => {
    if (derivedProjectId || manualProjectId || !projects.length) return;
    const fallbackId = projects[0]?.id;
    if (fallbackId) {
      setManualProjectId(fallbackId);
    }
  }, [derivedProjectId, manualProjectId, projects]);

  useEffect(() => {
    if (!_projectId || !projects.length) return;
    if (projects.some((p) => p.id === _projectId)) return;
    const fallbackId = projects[0]?.id ?? null;
    setManualProjectId(fallbackId);
  }, [_projectId, projects]);

  const [pages, setPages] = useState<PageTree[]>([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const [toolboxOpen, setToolboxOpen] = useState(true);
  const [toolboxTab, setToolboxTab] = useState<'components' | 'templates'>('components');
  const [mobilePanel, setMobilePanel] = useState<'toolbox' | 'canvas' | 'properties'>('canvas');
  const [templateSelectValue, setTemplateSelectValue] = useState('');
  const [templateNotice, setTemplateNotice] = useState<string | null>(null);

  useEffect(() => {
    if (_projectId && currentPageId) {
      setTemplateNotice(null);
    }
  }, [_projectId, currentPageId]);

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

  const setProjectId = useCallback(
    (nextId: string | null) => {
      setManualProjectId(nextId);
      setCurrentPageId(null);
      setPages([]);
      setSelectedId(null);
      setTemplateSelectValue('');
      setTemplateNotice(null);
      applyTreeUpdate(() => sanitizePage(emptyTree), { markDirty: false });
      pendingSyncHash.current = null;
      isDirty.current = false;
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (nextId) {
          url.searchParams.set('id', nextId);
        } else {
          url.searchParams.delete('id');
        }
        url.searchParams.delete('p');
        url.searchParams.delete('pageId');
        window.history.replaceState(null, '', url.toString());
      }
    },
    [applyTreeUpdate, setCurrentPageId, setManualProjectId, setPages, setSelectedId, setTemplateNotice, setTemplateSelectValue]
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

  const project = useMemo(() => projects.find((p) => p.id === _projectId) ?? null, [projects, _projectId]);
  const currentPageMeta = useMemo(() => pages.find((p) => p.id === currentPageId) ?? null, [pages, currentPageId]);

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
    if (!_projectId) {
      setTemplateNotice('Bitte wähle zuerst ein Projekt oder lege eines im Dashboard an.');
      return false;
    }
    if (!currentPageId) {
      setTemplateNotice('Seiten werden noch geladen. Bitte einen Moment warten.');
      return false;
    }
    setTemplateNotice(null);

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

    const preservedName = currentPageMeta?.name ?? tree.name ?? 'Unbenannte Seite';

    const nextTree = applyTreeUpdate((prev) => ({
      ...prev,
      name: preservedName,
      tree: {
        ...prev.tree,
        props: {
          ...(prev.tree.props ?? {}),
          bg: background ?? prev.tree.props?.bg ?? DEFAULT_PAGE_BACKGROUND,
        },
        children: nodes,
      },
    }));

    if (!nextTree) return false;

    setPages((prev) => {
      const existing = prev.find((page) => page.id === currentPageId) ?? null;
      const updatedPage: PageTree = existing
        ? { ...existing, tree: nextTree.tree }
        : {
            id: currentPageId,
            name: nextTree.name,
            tree: nextTree.tree,
            folder: nextTree.folder ?? null,
          };
      if (existing) {
        return prev.map((page) => (page.id === currentPageId ? updatedPage : page));
      }
      return [...prev, updatedPage];
    });

    if (_projectId && currentPageId && nextTree) {
      const payload = { ...nextTree, name: preservedName };
      latestTree.current = payload;
      (async () => {
        try {
          await savePage(_projectId, currentPageId, payload);
          pendingSyncHash.current = hashPage(payload);
          isDirty.current = false;
        } catch (err) {
          console.error('Template save failed', err);
          isDirty.current = true;
          setTemplateNotice('Vorlage konnte nicht gespeichert werden. Bitte versuche es erneut.');
        }
      })();
    }
    setSelectedId(null);
    return true;
  }, [_projectId, currentPageId, applyTreeUpdate, setPages, setTemplateNotice, currentPageMeta, tree.name]);

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
        pendingSyncHash.current = hashPage(tree);
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
            pendingSyncHash.current = null;
            isDirty.current = false;
          }
        } else {
          (async () => {
            const id = await createPage(_projectId, 'Seite 1');
            setCurrentPageId(id);
          })();
        }
      } else {
        const sel = pgs.find((p) => p.id === currentPageId);
        if (!sel) return;
        const expectedHash = pendingSyncHash.current;
        const incomingHash = hashPage(sel);
        if (expectedHash) {
          if (incomingHash !== expectedHash) {
            return;
          }
          pendingSyncHash.current = null;
          isDirty.current = false;
          applyTreeUpdate(() => sel, { markDirty: false });
          return;
        }
        if (!isDirty.current) {
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
    if (!currentPageId) {
      setAiError('Bitte wähle eine Seite aus, damit die KI sie anpassen kann.');
      return;
    }
    setAiBusy(true);
    setAiError(null);
    try {
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

      const updatedTree = applyTreeUpdate((prev) => {
        const stableName = currentPageMeta?.name ?? prev.name ?? tree.name ?? 'Unbenannte Seite';
        return {
          ...prev,
          name: stableName,
          tree: data.page?.tree ?? prev.tree,
        };
      });
      const preservedName = updatedTree.name ?? currentPageMeta?.name ?? tree.name ?? 'Unbenannte Seite';
      setSelectedId(null);

      await savePage(_projectId, currentPageId, { ...updatedTree, name: preservedName });
      pendingSyncHash.current = hashPage(updatedTree);
      isDirty.current = false;

      setAiPrompt('');
      setAiOpen(false);
    } catch (error) {
      console.error('AI generation failed', error);
      setAiError(error instanceof Error ? error.message : 'Unbekannter Fehler bei der KI-Erstellung.');
    } finally {
      setAiBusy(false);
    }
  }, [_projectId, currentPageId, aiPrompt, applyTreeUpdate, tree.name, currentPageMeta]);

  const promptRenamePage = useCallback(async () => {
    if (!(_projectId && currentPageId)) return;
    const currentName = currentPageMeta?.name ?? tree.name ?? '';
    const nextName = window.prompt('Neuer Seitenname', currentName)?.trim();
    if (!nextName || nextName === currentName) return;
    try {
      await renamePage(_projectId, currentPageId, nextName);
      setPages((prev) => prev.map((p) => (p.id === currentPageId ? { ...p, name: nextName } : p)));
      applyTreeUpdate((prev) => ({ ...prev, name: nextName }), { markDirty: false });
    } catch (error) {
      console.error('renamePage failed', error);
      alert('Seite konnte nicht umbenannt werden.');
    }
  }, [_projectId, currentPageId, currentPageMeta, tree.name, applyTreeUpdate]);

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

  const flushPendingSave = useCallback(async () => {
    if (!(_projectId && currentPageId)) return;
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }
    if (!isDirty.current) return;
    const snapshot = latestTree.current;
    try {
      await savePage(_projectId, currentPageId, snapshot);
      pendingSyncHash.current = hashPage(snapshot);
      isDirty.current = false;
    } catch (error) {
      console.error('Flush preview save failed', error);
      isDirty.current = true;
    }
  }, [_projectId, currentPageId]);

  const handlePageSelection = useCallback((id: string | null) => {
    setCurrentPageId(id);
    const sel = pages.find((p) => p.id === id);
    if (sel) {
      applyTreeUpdate(() => sel, { markDirty: false });
      pendingSyncHash.current = null;
      isDirty.current = false;
    }
  }, [pages, applyTreeUpdate]);

  const templateControlsDisabled = !_projectId || !currentPageId;

  const templateContent = (
    <>
      <p className="text-xs text-neutral-400">
        Ersetzt die aktuell geöffnete Seite mit einer kuratierten Vorlage.
      </p>
      <div className="mt-3 space-y-2">
        <label className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Dropdown Auswahl</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-400 focus:outline-none disabled:opacity-40"
            value={templateSelectValue}
            disabled={templateControlsDisabled}
            onChange={(event) => {
              setTemplateSelectValue(event.target.value);
              if (event.target.value) {
                setTemplateNotice(null);
              }
            }}
          >
            <option value="">Vorlage wählen…</option>
            {APP_TEMPLATES.map((tpl) => (
              <option key={tpl.id} value={tpl.template}>{tpl.title}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={templateControlsDisabled}
            onClick={() => {
              if (!templateSelectValue) {
                setTemplateNotice('Bitte wähle eine Vorlage aus.');
                return;
              }
              const applied = applyTemplate(templateSelectValue);
              if (applied) {
                setTemplateSelectValue('');
                setTemplateNotice(null);
              }
            }}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              templateControlsDisabled
                ? 'cursor-not-allowed border-white/10 bg-white/5 text-neutral-500'
                : 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25'
            }`}
          >
            Dropdown anwenden
          </button>
        </div>
        {templateNotice && (
          <p className="text-xs text-rose-300">{templateNotice}</p>
        )}
      </div>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {APP_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            disabled={templateControlsDisabled}
            onClick={() => {
              if (templateControlsDisabled) {
                setTemplateNotice('Bitte öffne oder lade ein Projekt, bevor du Vorlagen nutzt.');
                return;
              }
              const applied = applyTemplate(tpl.template);
              if (applied) {
                setTemplateSelectValue('');
                setTemplateNotice(null);
              }
            }}
            className={`group relative min-w-[13rem] rounded-2xl border px-4 py-3 text-left transition ${
              templateControlsDisabled
                ? 'cursor-not-allowed border-white/5 bg-white/5 text-neutral-500'
                : 'border-white/10 bg-white/5 hover:border-emerald-400/50 hover:bg-white/10'
            }`}
          >
            <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${tpl.gradient} px-3 py-1 text-[11px] font-semibold text-white`}>
              <span>{tpl.icon}</span>
              <span>{tpl.subtitle}</span>
            </div>
            <div className="mt-3 text-lg font-semibold text-white">{tpl.title}</div>
            <p className="text-sm text-neutral-300">{tpl.description}</p>
            <span className="mt-2 inline-flex items-center text-[11px] font-semibold text-emerald-300">
              Vorlage anwenden
              <span className="ml-1 transition group-hover:translate-x-1">→</span>
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={openTemplatesWindow}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-100 transition hover:bg-white/10"
      >
        Mehr Vorlagen im eigenen Fenster öffnen
      </button>
    </>
  );

  const toolboxContent = (
    <div className="max-h-[440px] overflow-y-auto pr-1">
      <CategorizedToolbox onAdd={addNode} />
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#05070e] text-white">
        <Header />
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-sm text-neutral-400">Lade Benutzerstatus…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-[#05070e] text-white">
        <Header />
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Editor</p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Bitte anmelden</h1>
            <p className="text-base text-neutral-200">
              Der Editor steht nur angemeldeten Accounts zur Verfügung. Melde dich an, um deine Projekte zu laden oder neue Apps zu erstellen.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <Link
              href="/login"
              className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:from-cyan-400 hover:to-blue-400"
            >
              Zum Login
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white/90 hover:bg-white/10"
            >
              Noch kein Konto? Registrieren
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#05070e]">
      <Header />
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
          <aside className="hidden w-[24rem] flex-shrink-0 flex-col border-r border-[#222] bg-[#05070e]/70 backdrop-blur-sm lg:flex">
            <div className="flex h-full flex-col">
              <div className="border-b border-[#111]/60 bg-[#0b0b0f]/95 px-4 py-4">
                <div className="flex items-center justify-between">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200 transition hover:bg-white/10"
                  >
                    <span className="text-lg" aria-hidden="true">←</span>
                    <span>Dashboard</span>
                  </Link>
                  <span className="text-xs uppercase tracking-[0.35em] text-neutral-500">Editor</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold transition hover:bg-white/10 disabled:opacity-40"
                    onClick={onExport}
                    disabled={!pages.length}
                  >
                    Export
                  </button>
                  <QRCodeButton
                    projectId={_projectId}
                    pageId={currentPageId}
                    onBeforeOpen={flushPendingSave}
                    className="flex-1"
                  />
                  <button
                    className="flex-1 rounded border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
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
                      className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold transition hover:bg-white/10"
                    >
                      ⚙️ Einstellungen
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-400"
                    >
                      ⚙️ Einstellungen
                    </button>
                  )}
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-500">Projekt</p>
                  <div className="mt-2 text-sm font-semibold text-neutral-50">{project?.name ?? 'Projekt wählen'}</div>
                  <p className="text-xs text-neutral-400">{project?.description ?? 'Keine Beschreibung'}</p>
                  <div className="mt-3">
                    <select
                      className="w-full rounded-xl border border-[#333] bg-neutral-900 px-3 py-2 text-sm"
                      value={_projectId ?? ''}
                      onChange={(event) => setProjectId(event.target.value || null)}
                    >
                      <option value="">Projekt auswählen</option>
                      {projects.map((projectOption) => (
                        <option key={projectOption.id ?? 'none'} value={projectOption.id ?? ''}>
                          {projectOption.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {pages.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      <select
                        className="w-full rounded-xl border border-[#333] bg-neutral-900 px-3 py-2 text-sm"
                        value={currentPageId ?? ''}
                        onChange={(event) => handlePageSelection(event.target.value || null)}
                      >
                        {pages.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={promptRenamePage}
                        className="rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-semibold text-neutral-200 transition hover:bg-white/10"
                        disabled={!currentPageId}
                      >
                        Umbenennen
                      </button>
                    </div>
                  )}
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
                          pendingSyncHash.current = null;
                          isDirty.current = false;
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
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-4">
                  <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <button
                      type="button"
                      onClick={() => setToolboxOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Werkzeuge</p>
                        <p className="text-sm font-semibold text-neutral-100">Vorlagen, KI & Bausteine</p>
                      </div>
                      <span className="text-xl text-neutral-400">{toolboxOpen ? '−' : '+'}</span>
                    </button>
                    {toolboxOpen && (
                      <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                          {[
                            { id: 'components', label: 'Bausteine' },
                            { id: 'templates', label: 'Vorlagen' },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setToolboxTab(tab.id as 'components' | 'templates')}
                              className={`rounded-lg border px-3 py-2 transition ${
                                toolboxTab === tab.id
                                  ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100'
                                  : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                        <div>
                          {toolboxTab === 'components' && <div>{toolboxContent}</div>}
                          {toolboxTab === 'templates' && <div className="space-y-3">{templateContent}</div>}
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              </div>
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
                  className="rounded border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20 disabled:opacity-40"
                  onClick={onExport}
                  disabled={!pages.length}
                >
                  Export
                </button>
                <QRCodeButton
                  projectId={_projectId}
                  pageId={currentPageId}
                  onBeforeOpen={flushPendingSave}
                  className="rounded"
                />
                <button
                  className="rounded border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
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
                    className="inline-flex items-center justify-center rounded border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20"
                  >
                    ⚙️ Einstellungen
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-400"
                  >
                    ⚙️ Einstellungen
                  </button>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <select
                  className="w-full rounded border border-[#333] bg-neutral-900 px-3 py-2 text-sm"
                  value={currentPageId ?? ''}
                  onChange={(event) => handlePageSelection(event.target.value || null)}
                >
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={promptRenamePage}
                  className="rounded border border-white/15 bg-white/5 px-3 text-xs font-semibold text-neutral-200"
                  disabled={!currentPageId}
                >
                  ✏️
                </button>
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
                      pendingSyncHash.current = null;
                      isDirty.current = false;
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

            <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
              {mobilePanel === 'toolbox' && (
                <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 lg:hidden">
                  <div className="rounded-2xl border border-white/10 bg-[#070a13]/80 p-4 shadow-2xl">
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                      {[
                        { id: 'components', label: 'Bausteine' },
                        { id: 'templates', label: 'Vorlagen' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setToolboxTab(tab.id as 'components' | 'templates')}
                          className={`rounded-lg border px-3 py-2 transition ${
                            toolboxTab === tab.id
                              ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100'
                              : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 space-y-3">
                      {toolboxTab === 'components' && <CategorizedToolbox onAdd={addNode} />}
                      {toolboxTab === 'templates' && templateContent}
                    </div>
                  </div>
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
            <p className="text-sm text-neutral-300">
              Die KI aktualisiert ausschließlich die aktuell geöffnete Seite. Beschreibe kurz, was angepasst oder ergänzt werden soll – Layout, Texte, Abschnitte oder Call-to-Actions.
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
                {aiBusy ? 'Erstelle…' : 'Seite aktualisieren'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

