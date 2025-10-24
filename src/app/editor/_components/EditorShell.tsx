"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { AlignCenter, Image as ImageIcon, Text, Type, SquareMousePointer, Save } from "lucide-react";
import Canvas from "./Canvas";
import PageSidebar from "./PageSidebar";
import PropertiesPanel from "./PropertiesPanel";
import { Node, PageTree } from "@/lib/editorTypes";
import { getPageTree, savePageTree } from "@/lib/db-editor";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../lib/firebase"; // ← relativ zu src/app/editor/_components
import { ToastProvider, useToast } from "./Toast";

const GRID = 8;
const snap = (n: number) => Math.round(n / GRID) * GRID;

function ShellInner() {
  const router = useRouter();
  const params = useParams() as { projectId: string; pageId: string };
  const { projectId, pageId } = params;

  const { push } = useToast();
  const [tree, setTree] = useState<PageTree | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimer = useRef<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    (async () => {
      const t = await getPageTree(pageId);
      if (t) setTree(t);
    })();
  }, [pageId]);

  const scheduleSave = (next: PageTree) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setIsSaving(true);
      await savePageTree(pageId, { projectId, tree: next.tree, updatedAt: Date.now() });
      setIsSaving(false);
      push("Gespeichert");
    }, 600);
  };

  const addElement = (type: Node["type"]) => {
    if (!tree) return;
    const id = crypto.randomUUID();
    const base: Node = { id, type, x: 40, y: 40, props: {} };
    if (type === "image") { base.w = 120; base.h = 120; base.props = { src: "", alt: "Bild" }; }
    if (type === "text") base.props = { text: "Neuer Text", color: "#ffffff", fontSize: 16, align: "left" };
    if (type === "button") base.props = { label: "Button", variant: "primary" };
    if (type === "input") base.props = { placeholder: "Eingabe", value: "" };

    const next: PageTree = {
      ...tree,
      tree: { ...tree.tree, children: [...(tree.tree.children || []), base] },
      updatedAt: Date.now(),
    };
    setTree(next);
    setSelectedId(id);
    scheduleSave(next);
  };

  const selectedNode = useMemo(() => {
    if (!tree || !selectedId) return null;
    return (tree.tree.children || []).find((n) => n.id === selectedId) || null;
  }, [tree, selectedId]);

  const onDragEnd = (e: DragEndEvent) => {
    if (!tree) return;
    const id = e.active.id as string;
    const current = (tree.tree.children || []).find((n) => n.id === id);
    if (!current) return;
    const nx = snap((current.x || 0) + (e.delta?.x || 0));
    const ny = snap((current.y || 0) + (e.delta?.y || 0));
    const nextChildren = (tree.tree.children || []).map((n) => (n.id === id ? { ...n, x: nx, y: ny } : n));
    const next: PageTree = { ...tree, tree: { ...tree.tree, children: nextChildren } };
    setTree(next);
    scheduleSave(next);
  };

  const updateSelected = (patch: Partial<Node>) => {
    if (!tree || !selectedId) return;
    const nextChildren = (tree.tree.children || []).map((n) =>
      n.id === selectedId ? { ...n, ...patch, props: { ...n.props, ...(patch as any).props } } : n
    );
    const next = { ...tree, tree: { ...tree.tree, children: nextChildren } };
    setTree(next);
    scheduleSave(next);
  };

  if (!tree) {
    return (
      <div className="h-screen w-full bg-[#0d0d0f] text-gray-300 flex items-center justify-center">
        Lädt Editor…
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0d0d0f] text-white">
      <PageSidebar projectId={projectId} activePageId={pageId} />
      <div className="flex-1 flex flex-col">
        <div className="h-12 border-b border-[#222] bg-[#121214] px-3 flex items-center gap-2">
          <button onClick={() => addElement("text")} className="px-3 py-1 rounded bg-[#1d1f22] hover:bg-[#26292d] flex items-center gap-2 text-sm"><Type size={16} /> Text</button>
          <button onClick={() => addElement("button")} className="px-3 py-1 rounded bg-[#1d1f22] hover:bg-[#26292d] flex items-center gap-2 text-sm"><SquareMousePointer size={16} /> Button</button>
          <button onClick={() => addElement("image")} className="px-3 py-1 rounded bg-[#1d1f22] hover:bg-[#26292d] flex items-center gap-2 text-sm"><ImageIcon size={16} /> Bild</button>
          <button onClick={() => addElement("input")} className="px-3 py-1 rounded bg-[#1d1f22] hover:bg-[#26292d] flex items-center gap-2 text-sm"><Text size={16} /> Eingabefeld</button>
          <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
            <AlignCenter size={16} /><span>Grid 8px</span><Save size={16} /><span>{isSaving ? "Speichert…" : "Gespeichert"}</span>
          </div>
        </div>
        <DndContext onDragEnd={onDragEnd} modifiers={[restrictToParentElement]}>
          <Canvas tree={tree} selectedId={selectedId} setSelectedId={setSelectedId} />
        </DndContext>
      </div>
      <PropertiesPanel node={selectedNode} updateNode={updateSelected} clearSelection={() => setSelectedId(null)} />
    </div>
  );
}

export default function EditorShell() {
  return (
    <ToastProvider>
      <ShellInner />
    </ToastProvider>
  );
}
