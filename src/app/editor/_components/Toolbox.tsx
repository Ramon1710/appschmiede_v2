// src/app/editor/_components/Toolbox.tsx
'use client';
import type { NodeType } from '@/types/editor';

export default function Toolbox({ onAdd }: { onAdd: (type: NodeType) => void }) {
  const Item = ({ t, label }: { t: NodeType; label: string }) => (
    <button onClick={() => onAdd(t)} className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 border border-white/10">
      {label}
    </button>
  );
  return (
    <div className="space-y-2">
      <h3 className="text-sm uppercase tracking-wider text-neutral-400">Bausteine</h3>
      <Item t="text" label="Text" />
      <Item t="button" label="Button" />
      <Item t="image" label="Bild (URL)" />
      <Item t="input" label="Eingabefeld" />
      <Item t="container" label="Container" />
    </div>
  );
}
