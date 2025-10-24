"use client";

import React from "react";
import { ImageIcon, Type, SquareMousePointer, TextCursorInput } from "lucide-react";
import type { NodeType } from "../../../lib/editorTypes";

export default function PageSidebar({ onAdd }: { onAdd: (t: NodeType) => void }) {
  const items: { t: NodeType; label: string; icon: React.ReactNode; hint?: string }[] = [
    { t: "text", label: "Text", icon: <Type size={16} /> },
    { t: "button", label: "Button", icon: <SquareMousePointer size={16} /> },
    { t: "image", label: "Bild", icon: <ImageIcon size={16} /> },
    { t: "input", label: "Eingabefeld", icon: <TextCursorInput size={16} /> },
  ];

  return (
    <div className="p-3 space-y-2">
      {items.map((it) => (
        <button
          key={it.t}
          onClick={() => onAdd(it.t)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1d1f22] hover:bg-[#26292d] text-left"
        >
          {it.icon}
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}
