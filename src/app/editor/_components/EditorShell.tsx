'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import CategorizedToolbox from './CategorizedToolbox';
import Header from '@/components/Header';
import type { PageTree, Node as EditorNode, NodeType } from '@/lib/editorTypes';
import { savePage, subscribePages, createPage } from '@/lib/db-editor';

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

  // Unterstütze sowohl ?projectId= als auch ?id=
  const _projectId = params.get('projectId') ?? params.get('id') ?? null;
  const [currentPageId, setCurrentPageId] = useState<string | null>(initialPageId ?? null);
  const [pages, setPages] = useState<Array<{ id: string; name: string; tree?: any }>>([]);

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
      setPages(pgs as any);
      if (!currentPageId) {
        if (pgs.length > 0) {
          setCurrentPageId(pgs[0].id ?? null);
          setTree(pgs[0] as any);
        } else {
          (async () => {
            const id = await createPage(_projectId, 'Seite 1');
            setCurrentPageId(id);
          })();
        }
      } else {
        const sel = pgs.find((p) => p.id === currentPageId);
        if (sel) setTree(sel as any);
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
                  if (sel) setTree(sel as any);
                }}
              >
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                onClick={async () => {
                  if (!_projectId) return;
                  const idx = pages.length + 1;
                  const id = await createPage(_projectId, `Seite ${idx}`);
                  setCurrentPageId(id ?? null);
                }}
              >+ Seite</button>
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
    </div>
  );
}
