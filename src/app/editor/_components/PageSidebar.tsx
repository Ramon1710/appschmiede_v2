"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createPage, deletePage, listPagesByProject, renamePage,
  reorderPages, setHomePage
} from "../../../lib/db-editor";
import { PageDoc } from "../../../lib/editorTypes";
import { GripVertical, Home, MoreVertical, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import { useToast } from "./Toast";

export default function PageSidebar({
  projectId,
  activePageId,
}: {
  projectId: string;
  activePageId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pages, setPages] = useState<PageDoc[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = async () => setPages(await listPagesByProject(projectId));
  useEffect(() => { load(); }, [projectId]);

  const onAdd = async () => {
    const id = await createPage(projectId, "Neue Seite");
    await load();
    router.push(`/editor/${projectId}/${id}`);
    toast.push("Seite erstellt");
  };

  const onRename = async (id: string) => {
    await renamePage(id, editName || "Seite");
    setEditingId(null);
    await load();
    toast.push("Seite umbenannt");
  };

  const onDelete = async (id: string) => {
    if (!confirm("Seite wirklich löschen?")) return;
    await deletePage(id);
    await load();
    toast.push("Seite gelöscht");
    if (id === activePageId && pages.length) router.push(`/editor/${projectId}/${pages[0].id}`);
  };

  // Reorder
  const ids = useMemo(() => pages.map((p) => p.id), [pages]);
  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = pages.findIndex((p) => p.id === active.id);
    const newIndex = pages.findIndex((p) => p.id === over.id);
    const newPages = arrayMove(pages, oldIndex, newIndex);
    setPages(newPages);
    await reorderPages(projectId, newPages.map((p) => p.id));
    toast.push("Reihenfolge gespeichert");
  };

  const markHome = async (id: string) => {
    await setHomePage(projectId, id);
    await load();
    toast.push("Startseite aktualisiert");
  };

  return (
    <div className="w-64 bg-[#161618] border-r border-[#222] p-3 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Seiten</h2>
        <button onClick={onAdd} className="px-2 py-1 bg-[#222] hover:bg-[#2a2d31] rounded text-xs flex items-center gap-1">
          <Plus size={14} /> Neu
        </button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {pages.map((p) => (
              <SortableItem id={p.id} key={p.id}>
                <div className={`group rounded-lg ${activePageId === p.id ? "bg-[#202226]" : "hover:bg-[#1b1d21]"}`}>
                  <div className="flex items-center gap-2 px-2 py-2">
                    <GripVertical className="opacity-40" size={16} />
                    <Link href={`/editor/${projectId}/${p.id}`} className="flex-1 text-sm truncate">
                      {editingId === p.id ? (
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => onRename(p.id)}
                          onKeyDown={(e) => e.key === "Enter" && onRename(p.id)}
                          className="w-full bg-[#0f1113] border border-[#2a2d31] rounded px-2 py-1 text-sm"
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          {p.name}
                          {p.isHome && <Star size={12} className="text-yellow-400" />}
                        </span>
                      )}
                    </Link>

                    <button className="opacity-70 hover:opacity-100" title="Als Startseite" onClick={() => markHome(p.id)}>
                      <Home size={16} />
                    </button>

                    <button className="opacity-70 hover:opacity-100" onClick={() => { setEditingId(p.id); setEditName(p.name); }} title="Umbenennen">
                      <Pencil size={16} />
                    </button>
                    <button className="opacity-70 hover:opacity-100" onClick={() => onDelete(p.id)} title="Löschen">
                      <Trash2 size={16} />
                    </button>
                    <MoreVertical size={16} className="opacity-30" />
                  </div>
                </div>
              </SortableItem>
            ))}
            {!pages.length && <div className="text-xs text-gray-500">Noch keine Seiten</div>}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
