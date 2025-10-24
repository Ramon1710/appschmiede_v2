"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, RefreshCw, Smartphone, Save, Info } from "lucide-react";
import { getPageTree, savePageTree } from "../../../lib/db-editor";
import type { PageTree, Node as EditorNode, NodeType } from "../../../lib/editorTypes";
import Canvas from "./Canvas";
import PropertiesPanel from "./PropertiesPanel";
import PageSidebar from "./PageSidebar";

type DirtyState = "idle" | "saving" | "saved" | "error";

function useDebounced<T extends (...args: any[]) => void>(fn: T, delay = 600) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  return React.useCallback((...args: Parameters<T>) => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]) as T;
}

const EditorShell: React.FC = () => {
  const { projectId, pageId } = useParams() as { projectId: string; pageId: string };

  const [tree, setTree] = useState<PageTree | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState<DirtyState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dbg, setDbg] = useState<string>("init");

  const log = (m: string) => setDbg((d) => `${d}\n${new Date().toISOString()} ${m}`);

  const load = useCallback(async () => {
    setError(null);
    setTree(null);
    setSelectedId(null);
    log(`load:start p=${projectId} page=${pageId}`);
    try {
      const t = await getPageTree(pageId);
      if (!t) {
        const fresh: PageTree = {
          projectId,
          pageId,
          tree: { id: "root", type: "container", props: { bg: "#0b1220" }, children: [] },
          updatedAt: Date.now(),
        };
        setTree(fresh);
        setDirty("saving");
        await savePageTree(pageId, fresh);
        setDirty("saved");
      } else {
        setTree(t);
        setDirty("idle");
      }
      log("load:done");
    } catch (e: any) {
      setError(e?.message || "Konnte Seite nicht laden.");
      setTree({
        projectId,
        pageId,
        tree: { id: "root", type: "container", props: { bg: "#0b1220" }, children: [] },
        updatedAt: Date.now(),
      });
      setDirty("error");
      log(`load:error ${e?.message || e}`);
    }
  }, [pageId, projectId]);

  useEffect(() => { load(); }, [load]);

  const persist = useCallback(async (next: PageTree) => {
    setDirty("saving");
    try {
      await savePageTree(pageId, next);
      setDirty("saved");
      setTimeout(() => setDirty("idle"), 800);
    } catch (e: any) {
      setDirty("error");
      setError(e?.message || "Speichern fehlgeschlagen.");
    }
  }, [pageId]);

  const persistDebounced = useDebounced(persist, 600);

  const updateTree = useCallback((updater: (t: PageTree) => PageTree, autosave = true) => {
    setTree((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      if (autosave) persistDebounced(next);
      return next;
    });
  }, [persistDebounced]);

  const addNode = useCallback((type: NodeType) => {
    if (!tree) return;
    const id = `n_${Date.now()}`;
    const base: EditorNode = {
      id,
      type,
      x: 24,
      y: 24,
      w: type === "image" ? 160 : 140,
      h: type === "input" ? 44 : 40,
      props: {},
    };
    if (type === "text") base.props = { text: "Neuer Text", align: "left", color: "#ffffff", size: 16 };
    if (type === "button") base.props = { label: "Button", variant: "primary" };
    if (type === "image") base.props = { src: "https://placehold.co/320x180/1e293b/fff?text=Bild" };
    if (type === "input") base.props = { placeholder: "Eingabe…" };

    updateTree((t) => ({
      ...t,
      tree: { ...t.tree, children: [...t.tree.children, base] },
      updatedAt: Date.now(),
    }));
    setSelectedId(id);
  }, [tree, updateTree]);

  const removeNode = useCallback((id: string) => {
    updateTree((t) => ({
      ...t,
      tree: { ...t.tree, children: t.tree.children.filter((c) => c.id !== id) },
      updatedAt: Date.now(),
    }));
    setSelectedId((s) => (s === id ? null : s));
  }, [updateTree]);

  const moveNode = useCallback((id: string, dx: number, dy: number) => {
    updateTree((t) => ({
      ...t,
      tree: {
        ...t.tree,
        children: t.tree.children.map((c) =>
          c.id === id ? { ...c, x: Math.max(0, (c.x ?? 0) + dx), y: Math.max(0, (c.y ?? 0) + dy) } : c
        ),
      },
      updatedAt: Date.now(),
    }));
  }, [updateTree]);

  const updateNodeProps = useCallback((id: string, patch: Partial<EditorNode>) => {
    updateTree((t) => ({
      ...t,
      tree: {
        ...t.tree,
        children: t.tree.children.map((c) =>
          c.id === id ? { ...c, ...patch, props: { ...c.props, ...(patch as any).props } } : c
        ),
      },
      updatedAt: Date.now(),
    }));
  }, [updateTree]);

  const selected: EditorNode | null = useMemo(
    () => (tree?.tree.children.find((c) => c.id === selectedId) ?? null),
    [tree, selectedId]
  );

  if (!tree) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-gray-200">
        <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> Seite lädt…</div>
        {error && <div className="mt-4 text-red-300 text-sm">{error}</div>}
        <pre className="mt-2 text-[11px] leading-5 bg-black/40 p-3 rounded max-h-64 overflow-auto">{dbg}</pre>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 grid grid-cols-[280px_1fr_320px] gap-4">
      <div className="rounded-2xl border border-[#222] bg-[#0f1113]">
        <div className="px-4 py-3 border-b border-[#222] flex items-center gap-2">
          <Smartphone size={16} className="opacity-70" />
          <div className="font-medium">Komponenten</div>
          <button
            onClick={load}
            className="ml-auto text-xs inline-flex items-center gap-1 px-2 py-1 rounded bg-[#1d1f22] hover:bg-[#26292d]"
            title="Neu laden"
          >
            <RefreshCw size={14} /> Reload
          </button>
        </div>
        <PageSidebar onAdd={addNode} />
        <div className="px-4 py-3 text-xs text-gray-400 border-t border-[#222] flex items-start gap-2">
          <Info size={14} className="mt-0.5" />
          <span>Ziehe Elemente auf die Handy-Fläche. Änderungen werden automatisch gespeichert.</span>
        </div>
      </div>

      <div className="rounded-2xl border border-[#222] bg-[#0b0e13] p-4">
        <Canvas
          tree={tree}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRemove={removeNode}
          onMove={moveNode}
        />
      </div>

      <div className="rounded-2xl border border-[#222] bg-[#0f1113]">
        <div className="px-4 py-3 border-b border-[#222] flex items-center gap-2">
          <Save size={16} className={
            dirty === "saving" ? "animate-pulse text-yellow-400" :
            dirty === "saved" ? "text-green-400" :
            dirty === "error" ? "text-red-400" : "opacity-70"
          } />
          <div className="font-medium">Eigenschaften</div>
          <div className="ml-auto text-xs text-gray-400">
            {dirty === "saving" && "Speichern…"}
            {dirty === "saved" && "Gespeichert"}
            {dirty === "error" && "Fehler"}
          </div>
        </div>
        <PropertiesPanel
          selected={selected}
          onChange={(patch: Partial<EditorNode>) => {
            if (!selected) return;
            updateNodeProps(selected.id, patch);
          }}
        />
      </div>
    </div>
  );
};

export default EditorShell;
