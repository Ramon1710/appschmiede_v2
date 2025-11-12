'use client';

import React, { useRef } from 'react';
import type { PageTree, Node as EditorNode } from '@/lib/editorTypes';

type CanvasProps = {
  tree: PageTree;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dx: number, dy: number) => void;
};

const BOUNDS = { w: 390, h: 844 };

function RenderNode({ node }: { node: EditorNode }) {
  const base = 'w-full h-full select-none overflow-hidden';

  switch (node.type) {
    case 'text':
      return (
        <div
          className={base}
          style={{
            color: node.style?.color ?? '#fff',
            fontSize: node.style?.fontSize ?? 16,
            fontWeight: node.style?.fontWeight ?? 400,
          }}
        >
          {node.props?.text ?? 'Text'}
        </div>
      );

    case 'button':
      return (
        <button className={`${base} rounded-md border border-white/20 bg-white/10 hover:bg-white/20`}>
          {node.props?.label ?? 'Button'}
        </button>
      );

    case 'image':
      return (
        <img
          className={`${base} object-cover`}
          src={node.props?.src || 'https://placehold.co/320x180/1e293b/fff?text=Bild'}
          alt=""
        />
      );

    case 'input':
      return (
        <input
          className={`${base} rounded-md bg-neutral-800 px-2`}
          placeholder={node.props?.placeholder ?? 'Eingabe'}
        />
      );

    case 'container':
      return (
        <div
          className={base}
          style={{ background: node.props?.bg ?? 'linear-gradient(135deg,#0b0b0f,#111827)' }}
        />
      );

    default:
      return null;
  }
}

export default function Canvas({ tree, selectedId, onSelect, onRemove, onMove }: CanvasProps) {
  const dragging = useRef<null | { id: string; startX: number; startY: number }>(null);

  const onMouseDown = (e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return;
    dragging.current = { id, startX: e.clientX, startY: e.clientY };
    onSelect(id);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const { id, startX, startY } = dragging.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (dx !== 0 || dy !== 0) {
      onMove(id, dx, dy);
      dragging.current = { id, startX: e.clientX, startY: e.clientY };
    }
  };

  const onMouseUp = () => {
    dragging.current = null;
  };

  return (
    <div
      className="relative mx-auto"
      style={{ width: BOUNDS.w, height: BOUNDS.h }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClick={(e) => {
        if (e.currentTarget === e.target) onSelect(null);
      }}
    >
      <div className="absolute inset-0 rounded-[36px] border border-neutral-800 bg-neutral-950 overflow-hidden">
        {(tree.tree.children ?? []).map((n) => {
          const style: React.CSSProperties = {
            position: 'absolute',
            left: n.x ?? 0,
            top: n.y ?? 0,
            width: n.w ?? 120,
            height: n.h ?? 40,
            cursor: 'move',
          };
          const isSel = n.id === selectedId;
          return (
            <div key={n.id} style={style} className="group" onMouseDown={(e) => onMouseDown(e, n.id)}>
              <RenderNode node={n} />
              {isSel && <div className="absolute inset-0 ring-2 ring-emerald-400/70 rounded-md pointer-events-none" />}
              {isSel && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(n.id);
                  }}
                  className="absolute -right-2 -top-2 grid place-items-center w-6 h-6 rounded-full bg-rose-600 text-white text-xs shadow"
                  title="Element löschen"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}