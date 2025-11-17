'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import CategorizedToolbox from './CategorizedToolbox';
import Header from '@/components/Header';
import type { PageTree, Node as EditorNode, NodeType } from '@/lib/editorTypes';
import { savePage, subscribePages, createPage, deletePage, createPageWithContent } from '@/lib/db-editor';

const emptyTree: PageTree = {
  id: 'local',
  name: 'Seite 1',
  tree: {
    id: 'root',
    type: 'container',
    props: {},
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
    setSelectedId((s) => (s === id ? null : s));
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

  const updateNode = useCallback(
    (id: string, patch: Partial<EditorNode>) => {
      setTree((prev) => ({
        ...prev,
        tree: {
          ...prev.tree,
          children: (prev.tree.children ?? []).map((n) =>
            n.id === id ? { ...n, ...patch } : n
          ),
        },
      }));
      isDirty.current = true;
    },
    []
  );

  const addNode = useCallback((type: NodeType, defaultProps: Record<string, any> = {}) => {
    const newNode: EditorNode = {
      id: crypto.randomUUID(),
      type,
      x: 100,
      y: 100,
      w: 240,
      h: type === 'text' ? 60 : type === 'button' ? 40 : 120,
      props: { ...defaultProps },
    };
    setTree((t) => ({
      ...t,
      tree: {
        ...t.tree,
        children: [...(t.tree.children ?? []), newNode],
      },
    }));
    setSelectedId(newNode.id);
    isDirty.current = true;
  }, []);

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

  // Seitenliste abonnieren und initiale Seite setzen
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const target = e.target as HTMLElement | null;
      if (target && (target.closest('input, textarea') || target.contentEditable === 'true')) {
        return;
      }
      e.preventDefault();
      onRemove(selectedId);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, onRemove]);

  const runAiGenerator = useCallback(async () => {
    if (!(_projectId && aiPrompt.trim())) {
      setAiError('Bitte gib eine Beschreibung ein.');
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

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-[#222] flex flex-col bg-[#0b0b0f]/90 backdrop-blur-sm">
          <div className="p-4 border-b border-[#222] space-y-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md bg-white/10 hover:bg-white/20 px-3 py-2 text-sm transition"
            >
              <span className="text-lg">←</span>
              <span>Zurück zum Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <select
                className="flex-1 bg-neutral-900 border border-[#333] rounded px-2 py-1 text-sm"
                value={currentPageId ?? ''}
                onChange={(e) => {
                  const id = e.target.value || null;
                  setCurrentPageId(id);
                  const sel = pages.find((p) => p.id === id);
                  if (sel) setTree(sel);
                }}
              >
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                className="text-xs px-2 py-1 rounded bg-rose-500/20 border border-rose-500/40 text-rose-200 hover:bg-rose-500/30 disabled:opacity-40"
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
                Entfernen
              </button>
              <button
                className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                onClick={async () => {
                  if (!_projectId) return;
                  const idx = pages.length + 1;
                  const id = await createPage(_projectId, `Seite ${idx}`);
                  setCurrentPageId(id ?? null);
                }}
              >+ Seite</button>
              <button
                className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                onClick={() => onExport()}
                disabled={!pages.length}
              >Exportieren</button>
              <button
                className="text-xs px-2 py-1 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30"
                onClick={() => {
                  setAiError(null);
                  setAiOpen(true);
                }}
              >KI Generator</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <CategorizedToolbox onAdd={addNode} />
          </div>
        </div>

      <div className="flex-1">
        <Canvas
          tree={tree}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRemove={onRemove}
          onMove={onMove}
          onResize={(id, patch) => updateNode(id, patch)}
        />
      </div>

      <div className="w-80 border-l border-[#222] bg-[#0b0b0f]/90 backdrop-blur-sm">
        <PropertiesPanel
          node={selectedNode}
          onUpdate={(patch) => {
            if (selectedId) updateNode(selectedId, patch);
          }}
        />
      </div>
      </div>

      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0d101b] p-6 shadow-2xl">
            <div className="space-y-2 pb-4">
              <h2 className="text-xl font-semibold text-neutral-100">KI-Seitengenerator</h2>
              <p className="text-sm text-neutral-400">
                Beschreibe, welche App du brauchst, z.&nbsp;B. „Erstelle mir eine Chat-App mit Registrierung und Übersicht, wer online ist“.
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
              >Abbrechen</button>
              <button
                type="button"
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-60"
                onClick={() => runAiGenerator()}
                disabled={aiBusy}
              >{aiBusy ? 'Erstelle…' : 'Seiten erzeugen'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
