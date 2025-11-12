// path: src/app/editor/_components/PropertiesPanel.tsx
'use client';

import React from 'react';
import type { Node as EditorNode } from '@/lib/editorTypes';

export default function PropertiesPanel({
  selected,
  onChange,
}: {
  selected: EditorNode | null;
  onChange: (patch: Partial<EditorNode>) => void;
}) {
  if (!selected) return <div className="p-3 text-neutral-400">Kein Element ausgewählt.</div>;

  const setFrame = (k: 'x' | 'y' | 'w' | 'h', v: number) =>
    onChange({ [k]: Number.isFinite(v) ? v : 0 } as any);

  const setProps = (patch: Record<string, any>) =>
    onChange({ props: { ...(selected.props ?? {}), ...patch } } as any);

  const setStyle = (patch: Record<string, any>) =>
    onChange({ props: selected.props, style: { ...(selected as any).style, ...patch } } as any);

  return (
    <div className="p-3 space-y-3 text-sm">
      <div className="font-medium">Eigenschaften</div>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">X</label>
        <input
          type="number"
          className="bg-neutral-800 rounded px-2"
          value={selected.x ?? 0}
          onChange={(e) => setFrame('x', Number(e.target.value))}
        />
        <label className="text-xs">Y</label>
        <input
          type="number"
          className="bg-neutral-800 rounded px-2"
          value={selected.y ?? 0}
          onChange={(e) => setFrame('y', Number(e.target.value))}
        />
        <label className="text-xs">Breite</label>
        <input
          type="number"
          className="bg-neutral-800 rounded px-2"
          value={selected.w ?? 120}
          onChange={(e) => setFrame('w', Number(e.target.value))}
        />
        <label className="text-xs">Höhe</label>
        <input
          type="number"
          className="bg-neutral-800 rounded px-2"
          value={selected.h ?? 40}
          onChange={(e) => setFrame('h', Number(e.target.value))}
        />
      </div>

      {selected.type === 'text' && (
        <>
          <label className="text-xs">Text</label>
          <input
            className="w-full bg-neutral-800 rounded px-2 py-1"
            value={(selected as any).props?.text ?? ''}
            onChange={(e) => setProps({ text: e.target.value })}
          />
          <label className="text-xs">Schriftgröße</label>
          <input
            type="number"
            className="w-full bg-neutral-800 rounded px-2 py-1"
            value={(selected as any).style?.fontSize ?? 16}
            onChange={(e) => setStyle({ fontSize: Number(e.target.value) })}
          />
          <label className="text-xs">Farbe</label>
          <input
            type="color"
            className="w-full bg-neutral-800 rounded px-2 py-1"
            value={(selected as any).style?.color ?? '#ffffff'}
            onChange={(e) => setStyle({ color: e.target.value })}
          />
        </>
      )}

      {selected.type === 'button' && (
        <>
          <label className="text-xs">Label</label>
          <input
            className="w-full bg-neutral-800 rounded px-2 py-1"
            value={(selected as any).props?.label ?? ''}
            onChange={(e) => setProps({ label: e.target.value })}
          />
        </>
      )}

      {selected.type === 'image' && (
        <>
          <label className="text-xs">Bild-URL</label>
          <input
            className="w-full bg-neutral-800 rounded px-2 py-1"
            value={(selected as any).props?.src ?? ''}
            onChange={(e) => setProps({ src: e.target.value })}
          />
        </>
      )}

      {selected.type === 'input' && (
        <>
          <label className="text-xs">Placeholder</label>
          <input
            className="w-full bg-neutral-800 rounded px-2 py-1"
            value={(selected as any).props?.placeholder ?? ''}
            onChange={(e) => setProps({ placeholder: e.target.value })}
          />
        </>
      )}
    </div>
  );
}
