"use client";
import React from "react";
import { Node } from "../../../lib/editorTypes";
import { X } from "lucide-react";

export default function PropertiesPanel({
  node,
  updateNode,
  clearSelection,
}: {
  node: Node | null;
  updateNode: (patch: Partial<Node>) => void;
  clearSelection: () => void;
}) {
  if (!node) {
    return <div className="w-80 bg-[#161618] border-l border-[#222] p-4 text-sm text-gray-400">Kein Element ausgewählt</div>;
  }
  const setProp = (k: string, v: any) => updateNode({ props: { [k]: v } as any });
  return (
    <div className="w-80 bg-[#161618] border-l border-[#222] p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Eigenschaften</h2>
        <button onClick={clearSelection} className="opacity-70 hover:opacity-100"><X size={18} /></button>
      </div>
      <div className="space-y-3 text-sm">
        <div><div className="text-gray-400 text-xs mb-1">Typ</div><div className="px-2 py-1 bg-[#202226] rounded">{node.type}</div></div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block"><span className="text-xs text-gray-400">X</span>
            <input type="number" className="w-full bg-[#0f1113] border border-[#2a2d31] rounded px-2 py-1" value={node.x ?? 0} onChange={(e) => updateNode({ x: parseInt(e.target.value || "0", 10) })} />
          </label>
          <label className="block"><span className="text-xs text-gray-400">Y</span>
            <input type="number" className="w-full bg-[#0f1113] border border-[#2a2d31] rounded px-2 py-1" value={node.y ?? 0} onChange={(e) => updateNode({ y: parseInt(e.target.value || "0", 10) })} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block"><span className="text-xs text-gray-400">Breite</span>
            <input type="number" className="w-full bg-[#0f1113] border border-[#2a2d31] rounded px-2 py-1" value={node.w ?? ""} onChange={(e) => updateNode({ w: e.target.value ? parseInt(e.target.value, 10) : undefined })} />
          </label>
          <label className="block"><span className="text-xs text-gray-400">Höhe</span>
            <input type="number" className="w-full bg-[#0f1113] border border-[#2a2d31] rounded px-2 py-1" value={node.h ?? ""} onChange={(e) => updateNode({ h: e.target.value ? parseInt(e.target.value, 10) : undefined })} />
          </label>
        </div>
        {node.type === "text" && (<>
          <label className="block"><span className="text-xs text-gray-400">Text</span>
            <input className="w-full bg-[#0f1113] border border-[#2a2d31] rounded px-2 py-1" value={node.props?.text ?? ""} onChange={(e) => setProp("text", e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block"><span className="text-xs text-gray-400">Farbe</span>
              <input type="color" className="w-full bg-[#0f1113] border border-[#2a2d31] rounded h-9" value={node.props?.color ?? "#ffffff"} onChange={(e) => setProp("color", e.target.value)} />
            </label>
            <label className="block"><span className="text-xs text-gray-400">Größe</span>
              <input type="number" className="w-full bg-[#0f1113] border border-[#2a2d31] rounded px-2 py-1" value={node.props?.fontSize ?? 16} onChange={(e) => setProp("fontSize", parseInt(e.target.value || "16", 10))} />
            </label>
          </div>
          <label className="block"><span className="text-xs text-gray-400">Align</span>
            <select className="w-full bg-[#0f1113] border border-[#2a2d31] rounded px-2 py-1" value={node.props?.align ?? "left"} onChange={(e) => setProp("align", e.target.value)}>
              <option value="left">left</option><option value="center">center</option><option value="right">right</option>
            </select>
          </label>
        </>)}
        {node.type === "button" && (<>
          <label className="block"><span className="text-xs text-gray-400">Label</span>
            <input className="w-full bg-[#0f1113] border border-[#2a2d31] rounded px-2 py-1" value={node.props?.label ?? ""} onChange={(e) => setProp("label", e.target.value)} />
          </label>
          <label className="block"><span className="text-xs text-gray-400">Variante</span>
            <select className="w-full bg-[#0f1113] border border-[#2a2d31] rounded px-2 py-1" value={node.props?.variant ?? "primary"} onChange={(e) => setProp("variant", e.target.value)}>
              <option value="primary">primary</option><option value="ghost">ghost</option>
            </select>
          </label>
        </>)}
        {node.type === "image" && (<>
          <label className="block"><span className="text-xs text-gray-400">Bild-URL</span>
            <input className="w-full bg-[#0f1113] border border-[#2a2d31] rounded px-2 py-1" value={node.props?.src ?? ""} onChange={(e) => setProp("src", e.target.value)} />
          </label>
          <label className="block"><span className="text-xs text-gray-400">Alt</span>
            <input className="w-full bg-[#0f1113] border border-[#2a2d31] rounded px-2 py-1" value={node.props?.alt ?? ""} onChange={(e) => setProp("alt", e.target.value)} />
          </label>
        </>)}
        {node.type === "input" && (<>
          <label className="block"><span className="text-xs text-gray-400">Placeholder</span>
            <input className="w-full bg-[#0f1113] border border-[#2a2d31] rounded px-2 py-1" value={node.props?.placeholder ?? ""} onChange={(e) => setProp("placeholder", e.target.value)} />
          </label>
          <label className="block"><span className="text-xs text-gray-400">Breite</span>
            <input type="number" className="w-full bg-[#0f1113] border border-[#2a2d31] rounded px-2 py-1" value={node.w ?? 220} onChange={(e) => updateNode({ w: parseInt(e.target.value || "220", 10) })} />
          </label>
        </>)}
      </div>
    </div>
  );
}
