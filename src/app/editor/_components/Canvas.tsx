"use client";

import React from "react";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { PageTree, Node as EditorNode } from "../../../lib/editorTypes";
import { X } from "lucide-react";

type CanvasProps = {
  tree: PageTree;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dx: number, dy: number) => void;
};

const PHONE_W = 390; // iPhone-Breite
const PHONE_H = 780;

const Canvas: React.FC<CanvasProps> = ({
  tree,
  selectedId,
  onSelect,
  onRemove,
  onMove,
}) => {
  const phoneStyle: React.CSSProperties = {
    width: PHONE_W,
    height: PHONE_H,
    background: tree.tree.props?.bg || "#0b1220",
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const id = String(e.active.id);
    const { delta } = e;
    if (delta && (delta.x !== 0 || delta.y !== 0)) {
      onMove(id, Math.round(delta.x), Math.round(delta.y));
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="w-full h-full flex items-center justify-center">
        <div
          className="relative rounded-[36px] border border-[#223] shadow-2xl overflow-hidden"
          style={phoneStyle}
          onClick={() => onSelect(null)}
        >
          <DroppableRoot id="phone-root">
            {tree.tree.children.map((n) => (
              <DraggableNode
                key={n.id}
                node={n}
                selected={selectedId === n.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(n.id);
                }}
                onRemove={() => onRemove(n.id)}
              />
            ))}
          </DroppableRoot>
        </div>
      </div>
    </DndContext>
  );
};

export default Canvas;

function DroppableRoot({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef} className="absolute inset-0">{children}</div>;
}

function DraggableNode({
  node,
  selected,
  onClick,
  onRemove,
}: {
  node: EditorNode;
  selected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: node.id });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    left: node.x ?? 0,
    top: node.y ?? 0,
    width: node.w ?? 140,
    height: node.h ?? (node.type === "text" ? 40 : 44),
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`absolute select-none ${selected ? "ring-2 ring-indigo-400" : ""}`}
      style={style}
      onClick={onClick}
    >
      <NodeContent node={node} />
      {selected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-2 -right-2 bg-[#2a0f12] hover:bg-[#381317] text-white rounded-full p-1 shadow"
          title="Entfernen"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function NodeContent({ node }: { node: EditorNode }) {
  switch (node.type) {
    case "text":
      return (
        <div
          className="w-full h-full flex items-center px-2"
          style={{
            color: node.props?.color || "#fff",
            justifyContent: mapAlign(node.props?.align),
            fontSize: node.props?.size || 16,
          }}
        >
          <span className="truncate">{node.props?.text ?? "Text"}</span>
        </div>
      );
    case "button":
      return (
        <button
          className="w-full h-full rounded-lg px-3"
          style={{
            background: node.props?.variant === "secondary" ? "#1f2937" : "#4f46e5",
            color: "#fff",
          }}
        >
          {node.props?.label ?? "Button"}
        </button>
      );
    case "image":
      return (
        <img
          src={node.props?.src || "https://placehold.co/320x180/1e293b/fff?text=Bild"}
          alt=""
          className="w-full h-full object-cover rounded-md"
        />
      );
    case "input":
      return (
        <input
          readOnly
          placeholder={node.props?.placeholder || "Eingabe…"}
          className="w-full h-full rounded bg-[#0f1113] border border-[#2a2d31] px-3 text-sm text-white"
        />
      );
    default:
      return null;
  }
}

function mapAlign(a?: string): "flex-start" | "center" | "flex-end" {
  if (a === "center") return "center";
  if (a === "right") return "flex-end";
  return "flex-start";
}
