// path: src/app/editor/_components/EditorShell.tsx
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import type { PageTree, Node as EditorNode } from '@/lib/editorTypes';

const emptyTree: PageTree = {
  id: 'local',
  name: 'Seite 1',
  tree: {
    id: 'root',
    type: 'container',
    props: { bg: '#0b0b0f' },
    children: [] as EditorNode[],
  },
};

type Props = {
  initialPageId?: string | null;
};

export default function EditorShell({ initialPageId }: Props) {
  const params = useSearchParams();
  const initial = useMemo(() => emptyTree, []);
  const [tree, setTree] = useState<PageTree>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const _projectId = params.get('projectId') ?? null;

  const onRemove = useCallback((id: string) => {
    setTree((prev) => ({
      ...prev,
      tree: {
        ...prev.tree,
        children: (prev.tree.children ?? []).filter((n) => n.id !== id),
      },
    }));
    setSelectedId((s) => (s === id ? null : s));
  }, []);

  const onMove = useCallback((id: string, dx: number, dy: number) => {
    setTree((prev) => ({
      ...prev,
      tree: {
        ...prev.tree,
        children: (prev.tree.children ?? []).map((n) =>
          n.id === id
            ? {
                ...n,
                x: (n.x ?? 0) + dx,
                y: (n.y ?? 0) + dy,
              }
            : n
        ),
      },
    }));
  }, []);

  const selectedNode = useMemo(
    () => (tree.tree.children ?? []).find((n) => n.id === selectedId) ?? null,
    [tree, selectedId]
  );

  const onChangeSelected = useCallback(
    (patch: Partial<EditorNode>) => {
      if (!selectedId) return;
      setTree((prev) => ({
        ...prev,
        tree: {
          ...prev.tree,
          children: (prev.tree.children ?? []).map((n) =>
            n.id === selectedId ? ({ ...n, ...patch } as EditorNode) : n
          ),
        },
      }));
    },
    [selectedId]
  );

  return (
    <div className="grid grid-cols-[420px_1fr_360px] gap-4 p-4">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-3">
        <div className="text-sm text-neutral-400">Projekt: {_projectId ?? '–'}</div>
        <div className="mt-3 text-neutral-300">Palette (coming soon)</div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-4">
        <Canvas
          tree={tree}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRemove={onRemove}
          onMove={onMove}
        />
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50">
        <PropertiesPanel selected={selectedNode} onChange={onChangeSelected} />
      </div>
    </div>
  );
}
