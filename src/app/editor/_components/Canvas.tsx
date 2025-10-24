"use client";
import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { PageTree, Node } from "../../../lib/editorTypes";
import { Smartphone } from "lucide-react";

function DraggableNode({
  node,
  selected,
  onSelect,
}: {
  node: Node;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: node.id });
  const style: React.CSSProperties = {
    position: "absolute",
    left: node.x ?? 0,
    top: node.y ?? 0,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    width: node.w,
    height: node.h,
    outline: selected ? "2px solid #3b82f6" : "none",
    borderRadius: 8,
    padding: node.type === "button" ? 8 : 0,
    cursor: "move",
    userSelect: "none",
  };
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {node.type === "text" && (
        <div style={{ color: node.props?.color ?? "#fff", fontSize: node.props?.fontSize ?? 16, textAlign: node.props?.align ?? "left" }}>
          {node.props?.text ?? "Text"}
        </div>
      )}
      {node.type === "button" && (
        <button className="bg-[#2a2d31] hover:bg-[#34393f] text-white rounded px-3 py-1 text-sm">
          {node.props?.label ?? "Button"}
        </button>
      )}
      {node.type === "image" && (
        <img
          src={node.props?.src || "https://placehold.co/120x120/1f2937/ffffff?text=Bild"}
          alt={node.props?.alt || "Bild"}
          className="rounded"
          style={{ width: node.w ?? 120, height: node.h ?? 120, objectFit: "cover" }}
        />
      )}
      {node.type === "input" && (
        <input
          className="bg-[#15171a] border border-[#2a2d31] rounded px-2 py-1 text-sm text-white"
          placeholder={node.props?.placeholder ?? "Eingabe"}
          defaultValue={node.props?.value ?? ""}
          readOnly
          style={{ width: node.w ?? 220 }}
        />
      )}
      {isDragging && <div className="text-[10px] absolute -top-5 left-0 bg-black/60 px-1 rounded">{Math.round((node.x ?? 0) + (transform?.x ?? 0))}×{Math.round((node.y ?? 0) + (transform?.y ?? 0))}</div>}
    </div>
  );
}

export default function Canvas({
  tree,
  selectedId,
  setSelectedId,
}: {
  tree: PageTree;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#101113]">
      <div className="relative w-[390px] h-[800px] bg-[#0b0e13] rounded-2xl border border-[#2a2d31] shadow-xl overflow-hidden">
        <div className="absolute top-2 left-2 flex items-center gap-2 text-gray-400 text-xs">
          <Smartphone size={14} /> Vorschau
        </div>
        <div
          className="absolute inset-0"
          style={{ background: tree.tree.props?.bg ?? "#0b1220", backgroundSize: "cover" }}
          onClick={() => setSelectedId(null)}
        />
        {(tree.tree.children || []).map((n) => (
          <DraggableNode key={n.id} node={n} selected={selectedId === n.id} onSelect={() => setSelectedId(n.id)} />
        ))}
        <svg className="absolute inset-0 pointer-events-none opacity-[0.06]">
          <defs><pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  );
}
