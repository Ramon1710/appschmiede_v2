// src/app/editor/_components/PropertiesPanel.tsx
'use client';
import React from 'react';
import type { NodeBase, Project } from '@/types/editor';

export default function PropertiesPanel({
  node,
  project,
  setProject,
}: {
  node: NodeBase | null;
  project: Project;
  setProject: (p: Project) => void;
}) {
  if (!node) return <div className="text-neutral-400">Kein Element ausgewählt.</div>;

  const change = (patch: Partial<NodeBase>) =>
    setProject({ ...project, nodes: { ...project.nodes, [node.id]: { ...project.nodes[node.id], ...patch } } });
  const changeProps = (patch: Record<string, any>) => change({ props: { ...(node.props || {}), ...patch } });
  const changeStyle = (patch: Record<string, any>) => change({ style: { ...(node.style || {}), ...patch } });

  return (
    <div className="space-y-3">
      <h3 className="text-sm uppercase tracking-wider text-neutral-400">Eigenschaften</h3>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">X</label>
        <input
          type="number"
          className="bg-neutral-800 rounded px-2"
          value={node.frame.x}
          onChange={(e) => change({ frame: { ...node.frame, x: Number(e.target.value) } })}
        />
        <label className="text-xs">Y</label>
        <input
          type="number"
          className="bg-neutral-800 rounded px-2"
          value={node.frame.y}
          onChange={(e) => change({ frame: { ...node.frame, y: Number(e.target.value) } })}
        />
        <label className="text-xs">Breite</label>
        <input
          type="number"
          className="bg-neutral-800 rounded px-2"
          value={node.frame.w}
          onChange={(e) => change({ frame: { ...node.frame, w: Number(e.target.value) } })}
        />
        <label className="text-xs">Höhe</label>
        <input
          type="number"
          className="bg-neutral-800 rounded px-2"
          value={node.frame.h}
          onChange={(e) => change({ frame: { ...node.frame, h: Number(e.target.value) } })}
        />
      </div>

      {node.type === 'text' && (
        <>
          <label className="text-xs">Text</label>
          <input
            className="w-full bg-neutral-800 rounded px-2 py-1"
            value={node.props?.text || ''}
            onChange={(e) => changeProps({ text: e.target.value })}
          />
          <label className="text-xs">Schriftgröße</label>
          <input
            type="number"
            className="w-full bg-neutral-800 rounded px-2 py-1"
            value={node.style?.fontSize || 16}
            onChange={(e) => changeStyle({ fontSize: Number(e.target.value) })}
          />
          <label className="text-xs">Farbe</label>
          <input
            type="color"
            className="w-full bg-neutral-800 rounded px-2 py-1"
            value={node.style?.color || '#ffffff'}
            onChange={(e) => changeStyle({ color: e.target.value })}
          />
        </>
      )}

      {node.type === 'button' && (
        <>
          <label className="text-xs">Label</label>
          <input
            className="w-full bg-neutral-800 rounded px-2 py-1"
            value={node.props?.label || ''}
            onChange={(e) => changeProps({ label: e.target.value })}
          />
          <label className="text-xs">Aktion</label>
          <select
            className="w-full bg-neutral-800 rounded px-2 py-1"
            value={node.props?.action?.pageId || ''}
            onChange={(e) => changeProps({ action: { kind: 'nav', pageId: e.target.value } })}
          >
            <option value="">— keine —</option>
            {project.pages.map((p) => (
              <option key={p.id} value={p.id}>
                Navigation → {p.name}
              </option>
            ))}
          </select>
        </>
      )}

      {node.type === 'image' && (
        <>
          <label className="text-xs">Bild-URL</label>
          <input
            className="w-full bg-neutral-800 rounded px-2 py-1"
            value={node.props?.src || ''}
            onChange={(e) => changeProps({ src: e.target.value })}
          />
        </>
      )}

      {node.type === 'input' && (
        <>
          <label className="text-xs">Placeholder</label>
          <input
            className="w-full bg-neutral-800 rounded px-2 py-1"
            value={node.props?.placeholder || ''}
            onChange={(e) => changeProps({ placeholder: e.target.value })}
          />
        </>
      )}

      {node.type === 'container' && (
        <>
          <label className="text-xs">Hintergrund (CSS)</label>
          <input
            className="w-full bg-neutral-800 rounded px-2 py-1"
            value={node.style?.background || ''}
            onChange={(e) => changeStyle({ background: e.target.value })}
          />
        </>
      )}
    </div>
  );
}
