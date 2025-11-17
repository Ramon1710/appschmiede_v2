'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import PageSidebar from './PageSidebar';
import type { PageTree, Node as EditorNode, NodeType } from '@/lib/editorTypes';
import { savePage } from '@/lib/db-editor';

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
  const [saved, setSaved] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);

  const _projectId = params.get('projectId') ?? null;
  const pageId = initialPageId ?? null;

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
    if (!(_projectId && pageId)) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        await savePage(_projectId, pageId, tree);
        setSaved(true);
        isDirty.current = false;
        setTimeout(() => setSaved(false), 1600);
      } catch (err) {
        console.error('Autosave failed', err);
      }
    }, 900);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [tree, _projectId, pageId]);

  return (
    <div className="flex h-screen bg-[#0b0b0f]">
      <div className="w-64 border-r border-[#222] flex flex-col">
        <div className="p-4 border-b border-[#222]">
          <h2 className="text-sm font-semibold text-white">Projekt: {tree.name}</h2>
          {saved && <div className="text-xs text-green-500 mt-1">Gespeichert</div>}
        </div>
        <div className="flex-1 overflow-y-auto">
          <PageSidebar onAdd={addNode} />
        </div>
      </div>

      <div className="flex-1">
        <Canvas
          tree={tree}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRemove={onRemove}
          onMove={onMove}
        />
      </div>

      {selectedId && selectedNode && (
        <div className="w-80 border-l border-[#222]">
          <PropertiesPanel
            node={selectedNode}
            onUpdate={(patch) => updateNode(selectedId, patch)}
          />
        </div>
      )}
    </div>
  );
}
