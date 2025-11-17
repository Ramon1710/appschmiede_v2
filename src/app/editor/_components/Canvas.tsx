'use client';

import React, { useRef } from 'react';
import type { PageTree, Node as EditorNode } from '@/lib/editorTypes';

type CanvasProps = {
  tree: PageTree;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dx: number, dy: number) => void;
  onResize: (id: string, patch: Partial<EditorNode>) => void;
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

export default function Canvas({ tree, selectedId, onSelect, onRemove, onMove, onResize }: CanvasProps) {
  const dragging = useRef<null | { id: string; startX: number; startY: number }>(null);
  const resizing = useRef<null | { id: string; dir: 'nw'|'ne'|'sw'|'se'; startX: number; startY: number; start: { x:number; y:number; w:number; h:number } }>(null);

  const onMouseDown = (e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return;
    dragging.current = { id, startX: e.clientX, startY: e.clientY };
    onSelect(id);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (resizing.current) {
      const { id, dir, startX, startY, start } = resizing.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const minW = 40, minH = 32;
      let x = start.x, y = start.y, w = start.w, h = start.h;
      if (dir === 'se') { w = Math.max(minW, start.w + dx); h = Math.max(minH, start.h + dy); }
      if (dir === 'ne') { w = Math.max(minW, start.w + dx); h = Math.max(minH, start.h - dy); y = start.y + dy; }
      if (dir === 'sw') { w = Math.max(minW, start.w - dx); x = start.x + dx; h = Math.max(minH, start.h + dy); }
      if (dir === 'nw') { w = Math.max(minW, start.w - dx); x = start.x + dx; h = Math.max(minH, start.h - dy); y = start.y + dy; }
      onResize(id, { x, y, w, h });
      return;
    }
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
    resizing.current = null;
  };

  return (
    <div
      className="relative mx-auto flex items-center justify-center h-full p-6"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div
        className="relative bg-neutral-950 rounded-[36px] border border-neutral-800 overflow-hidden shadow-2xl"
        style={{ width: BOUNDS.w, height: BOUNDS.h }}
        onClick={(e) => {
          if (e.currentTarget === e.target) onSelect(null);
        }}
      >
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
                <>
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
                  {/* Resize Handles */}
                  <div
                    onMouseDown={(e) => { e.stopPropagation(); resizing.current = { id: n.id, dir: 'nw', startX: e.clientX, startY: e.clientY, start: { x: n.x||0, y: n.y||0, w: n.w||120, h: n.h||40 } }; }}
                    className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-emerald-400 rounded-sm cursor-nwse-resize"
                  />
                  <div
                    onMouseDown={(e) => { e.stopPropagation(); resizing.current = { id: n.id, dir: 'ne', startX: e.clientX, startY: e.clientY, start: { x: n.x||0, y: n.y||0, w: n.w||120, h: n.h||40 } }; }}
                    className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-emerald-400 rounded-sm cursor-nesw-resize"
                  />
                  <div
                    onMouseDown={(e) => { e.stopPropagation(); resizing.current = { id: n.id, dir: 'sw', startX: e.clientX, startY: e.clientY, start: { x: n.x||0, y: n.y||0, w: n.w||120, h: n.h||40 } }; }}
                    className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-emerald-400 rounded-sm cursor-nesw-resize"
                  />
                  <div
                    onMouseDown={(e) => { e.stopPropagation(); resizing.current = { id: n.id, dir: 'se', startX: e.clientX, startY: e.clientY, start: { x: n.x||0, y: n.y||0, w: n.w||120, h: n.h||40 } }; }}
                    className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-emerald-400 rounded-sm cursor-nwse-resize"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}