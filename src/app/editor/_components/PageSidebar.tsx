"use client";

import React from "react";
import type { NodeType } from "@/lib/editorTypes";

interface PageSidebarProps {
  onAdd: (type: NodeType, defaultProps?: Record<string, any>) => void;
}

export default function PageSidebar({ onAdd }: PageSidebarProps) {
  const elements: Array<{ type: NodeType; label: string; icon: string }> = [
    { type: "text", label: "Text", icon: "📝" },
    { type: "button", label: "Button", icon: "🔘" },
    { type: "input", label: "Input", icon: "📥" },
    { type: "image", label: "Bild", icon: "🖼️" },
    { type: "container", label: "Container", icon: "📦" },
  ];

  return (
    <div className="p-2 space-y-2">
      <div className="text-xs font-semibold text-gray-400 mb-2">Elemente</div>
      {elements.map((el) => (
        <button
          key={el.type}
          onClick={() => onAdd(el.type, {})}
          className="w-full px-3 py-2 text-sm text-left border border-gray-700 rounded hover:bg-gray-800 flex items-center gap-2"
        >
          <span>{el.icon}</span>
          <span>{el.label}</span>
        </button>
      ))}
    </div>
  );
}
