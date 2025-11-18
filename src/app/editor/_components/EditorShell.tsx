'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import CategorizedToolbox from './CategorizedToolbox';
import Header from '@/components/Header';
import type { PageTree, Node as EditorNode, NodeType, NodeProps } from '@/lib/editorTypes';
import { savePage, subscribePages, createPage, deletePage, createPageWithContent } from '@/lib/db-editor';

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

export default function EditorShell({ initialPageId }: Props) {
  const params = useSearchParams();
  const [tree, setTree] = useState<PageTree>(emptyTree);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);
  const suppressAutoCreate = useRef(false);

  // Unterstütze sowohl ?projectId= als auch ?id=
  const _projectId = params.get('projectId') ?? params.get('id') ?? null;
  const [currentPageId, setCurrentPageId] = useState<string | null>(initialPageId ?? null);
  const [pages, setPages] = useState<PageTree[]>([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiReplace, setAiReplace] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<'toolbox' | 'canvas' | 'properties'>('canvas');

  const downloadAnchor = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    return () => {
      if (downloadAnchor.current) {
        downloadAnchor.current.remove();
        downloadAnchor.current = null;
      }
    };
  }, []);

  const onRemove = useCallback((id: string) => {
    setTree((prev) => ({
      ...prev,
      tree: {
        ...prev.tree,
        children: (prev.tree.children ?? []).filter((n) => n.id !== id),
      },
    }));
    setSelectedId((current) => (current === id ? null : current));
    isDirty.current = true;
  }, []);

  const onMove = useCallback((id: string, dx: number, dy: number) => {
    setTree((prev) => ({
      ...prev,
      tree: {
        ...prev.tree,
        children: (prev.tree.children ?? []).map((n) =>
          n.id === id ? { ...n, x: (n.x ?? 0) + dx, y: (n.y ?? 0) + dy } : n
        ),
      },
    }));
    isDirty.current = true;
  }, []);

  const selectedNode = useMemo(
    () => (tree.tree.children ?? []).find((n) => n.id === selectedId) ?? null,
    [tree, selectedId]
  );

  const pageBackground = useMemo(() => {
    const raw = tree.tree.props?.bg;
    return typeof raw === 'string' && raw.trim() ? raw : DEFAULT_PAGE_BACKGROUND;
  }, [tree]);

  const setPageBackground = useCallback((value: string) => {
    const next = typeof value === 'string' && value.trim() ? value : DEFAULT_PAGE_BACKGROUND;
    setTree((prev) => ({
      ...prev,
      tree: {
        ...prev.tree,
        props: { ...(prev.tree.props ?? {}), bg: next },
      },
    }));
    isDirty.current = true;
  }, []);

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
      setTree((prev) => ({
        ...prev,
        tree: {
          ...prev.tree,
          children: (prev.tree.children ?? []).map((n) => {
            if (n.id !== id) return n;
            return {
              ...n,
              ...patch,
              props: patch.props ? { ...(n.props ?? {}), ...patch.props } : n.props,
              style: patch.style ? { ...(n.style ?? {}), ...patch.style } : n.style,
            };
          }),
        },
      }));
      isDirty.current = true;
    },
    []
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
    }

    if (!nodes.length) {
      return false;
    }

    let nextTree: PageTree | null = null;
    setTree((prev) => {
      nextTree = {
        ...prev,
        tree: {
          ...prev.tree,
          props: {
            ...(prev.tree.props ?? {}),
            bg: background ?? prev.tree.props?.bg ?? DEFAULT_PAGE_BACKGROUND,
          },
          children: nodes,
        },
      };
      return nextTree;
    });

    if (_projectId && currentPageId && nextTree) {
      void savePage(_projectId, currentPageId, nextTree);
    }
    setSelectedId(null);
    isDirty.current = true;
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

    setTree((prev) => ({
      ...prev,
      tree: {
        ...prev.tree,
        children: [...(prev.tree.children ?? []), newNode],
      },
    }));
    setSelectedId(newNode.id);
    isDirty.current = true;
  }, [applyTemplate]);

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
          setCurrentPageId(pgs[0]?.id ?? null);
          setTree(pgs[0]);
        } else if (!suppressAutoCreate.current) {
          (async () => {
            const id = await createPage(_projectId, 'Seite 1');
            setCurrentPageId(id);
          })();
        }
      } else {
        const sel = pgs.find((p) => p.id === currentPageId);
        if (sel) setTree(sel);
      }
    });
    return () => off();
  }, [_projectId, currentPageId]);

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
    setAiBusy(true);
    setAiError(null);
    try {
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
        setTree(emptyTree);
        setSelectedId(null);
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
    } catch (error) {
      console.error('AI generation failed', error);
      setAiError(error instanceof Error ? error.message : 'Unbekannter Fehler bei der KI-Erstellung.');
    } finally {
      suppressAutoCreate.current = false;
      setAiBusy(false);
    }
  }, [_projectId, aiPrompt, aiReplace, pages]);

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
    if (sel) setTree(sel);
  }, [pages]);

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
              <div className="flex items-center justify-between gap-2">
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
                  Canvas
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
                Beschreibe, welche App du brauchst, z. B. „Erstelle mir eine Chat-App mit Registrierung und Übersicht, wer online ist“.
              </p>
            </div>
            <textarea
              value={aiPrompt}
              onChange={(event) => {
                setAiPrompt(event.target.value);
                if (aiError) setAiError(null);
              }}
              placeholder="Was soll erstellt werden?"
              className="h-32 w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 focus:border-emerald-400 focus:outline-none"
            />
            <label className="mt-4 flex items-center gap-2 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={aiReplace}
                onChange={(event) => setAiReplace(event.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-neutral-900"
              />
              Bestehende Seiten ersetzen
            </label>
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
                {aiBusy ? 'Erstelle…' : 'Seiten erzeugen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

