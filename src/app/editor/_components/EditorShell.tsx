'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import { savePage, loadPage } from '@/lib/db-editor';
import type { PageTree } from '@/lib/db-editor';
import { useI18n } from '@/components/I18nProviderClient';

const makeId = () => Math.random().toString(36).slice(2, 9);

const emptyTree: PageTree = {
  id: 'local',
  name: 'Seite 1',
  tree: { id: 'root', type: 'container', props: { bg: '#0a0e1a' }, children: [] as any[] },
};

export default function EditorShell({ initialPageId }: { initialPageId?: string | null }) {
  const params = useSearchParams();
  const { t } = useI18n();
  const [tree, setTree] = useState<PageTree>(emptyTree);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saved, setSaved] = useState<boolean>(false);
  const saveTimeout = useRef<null | ReturnType<typeof setTimeout>>(null);
  const isDirty = useRef(false);

  const _projectId = params.get('projectId') ?? null;
  const pageId = initialPageId ?? params.get('p') ?? null;

  // Load page on mount
  useEffect(() => {
    if (!(_projectId && pageId)) return;
    (async () => {
      try {
        const loaded = await loadPage(_projectId, pageId);
        if (loaded) setTree(loaded);
      } catch (err) {
        console.error('Load page failed', err);
      }
    })();
  }, [_projectId, pageId]);

  const pushNode = useCallback((node: any) => {
    setTree((prev) => ({ ...prev, tree: { ...prev.tree, children: [...(prev.tree.children ?? []), node] } }));
    isDirty.current = true;
  }, []);

  const addText = useCallback(() => {
    const id = makeId();
    pushNode({ id, type: 'text', x: 20, y: 40, w: 120, h: 30, props: { text: 'Neuer Text', color: '#ffffff', fontSize: 16 } });
    setSelectedId(id);
  }, [pushNode]);

  const addButton = useCallback(() => {
    const id = makeId();
    pushNode({ id, type: 'button', x: 40, y: 120, w: 100, h: 40, props: { label: 'Button', bg: '#8b5cf6', color: '#ffffff' } });
    setSelectedId(id);
  }, [pushNode]);

  const addImage = useCallback(() => {
    const id = makeId();
    pushNode({ id, type: 'image', x: 60, y: 200, w: 120, h: 80, props: { src: '', alt: 'Bild' } });
    setSelectedId(id);
  }, [pushNode]);

  const addInput = useCallback(() => {
    const id = makeId();
    pushNode({ id, type: 'input', x: 80, y: 300, w: 140, h: 36, props: { placeholder: 'Eingabe' } });
    setSelectedId(id);
  }, [pushNode]);

  const addContainer = useCallback(() => {
    const id = makeId();
    pushNode({ id, type: 'container', x: 100, y: 400, w: 200, h: 100, props: { bg: 'rgba(139, 92, 246, 0.15)' } });
    setSelectedId(id);
  }, [pushNode]);

  const onRemove = useCallback((id: string) => {
    setTree((prev) => ({ ...prev, tree: { ...prev.tree, children: (prev.tree.children ?? []).filter((n: any) => n.id !== id) } }));
    setSelectedId((s) => (s === id ? null : s));
    isDirty.current = true;
  }, []);

  const onMove = useCallback((id: string, dx: number, dy: number) => {
    setTree((prev) => ({ ...prev, tree: { ...prev.tree, children: (prev.tree.children ?? []).map((n: any) => (n.id === id ? { ...n, x: (n.x ?? 0) + dx, y: (n.y ?? 0) + dy } : n)) } }));
    isDirty.current = true;
  }, []);

  const selectedNode = useMemo(() => (tree.tree.children ?? []).find((n: any) => n.id === selectedId) ?? null, [tree, selectedId]);

  const onChangeSelected = useCallback((patch: any) => {
    if (!selectedId) return;
    setTree((prev) => ({ ...prev, tree: { ...prev.tree, children: (prev.tree.children ?? []).map((n: any) => (n.id === selectedId ? { ...n, ...patch } : n)) } }));
    isDirty.current = true;
  }, [selectedId]);

  // AUTOSAVE
  useEffect(() => {
    if (!(_projectId && pageId)) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        await savePage(_projectId, pageId, tree);
        setSaved(true);
        isDirty.current = false;
        setTimeout(() => setSaved(false), 1500);
      } catch (err) {
        console.error('Autosave failed', err);
      }
    }, 800);
    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [tree, _projectId, pageId]);

  return (
    <div className="editor-grid container">
      <aside className="panel">
        <div className="kicker mb-3">{t('editor.blocks')}</div>
        <div className="flex flex-col gap-2">
          <button onClick={addText} className="btn">{t('editor.addText')}</button>
          <button onClick={addButton} className="btn">{t('editor.addButton')}</button>
          <button onClick={addImage} className="btn">{t('editor.addImage')}</button>
          <button onClick={addInput} className="btn">+ Eingabefeld</button>
          <button onClick={addContainer} className="btn">+ Container</button>
        </div>
        <div className="mt-4 text-xs text-muted">{saved ? t('editor.saved') : isDirty.current ? t('editor.changes') : 'Keine Änderungen'}</div>
      </aside>

      <main className="panel">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="phone-mock">
            <Canvas tree={tree} selectedId={selectedId} onSelect={setSelectedId} onRemove={onRemove} onMove={onMove} />
          </div>
        </div>
      </main>

      <aside className="panel">
        <PropertiesPanel selected={selectedNode} onChange={onChangeSelected} />
      </aside>
    </div>
  );
}
