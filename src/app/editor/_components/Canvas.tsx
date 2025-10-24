// src/app/editor/_components/Canvas.tsx
'use client';
import React, { useRef } from 'react';
import type { Project, NodeBase } from '@/types/editor';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export type CanvasProps = {
  project: Project;
  setProject: (p: Project) => void;
  pageId: string;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  preview: boolean;
};

function RenderNode({ node, preview }: { node: NodeBase; preview: boolean }) {
  const common = `w-full h-full select-none overflow-hidden`;
  if (node.type === 'text') {
    return (
      <div
        className={common}
        style={{
          color: node.style?.color || '#fff',
          fontSize: node.style?.fontSize || 16,
          fontWeight: node.style?.fontWeight || 400,
        }}
      >
        {node.props?.text || 'Text'}
      </div>
    );
  }
  if (node.type === 'button') {
    return (
      <button
        className={`${common} rounded-md border border-white/20 bg-white/10 hover:bg-white/20 transition grid place-items-center`}
        onClick={() => {
          if (!preview) return;
          const act = node.props?.action as { kind: 'nav'; pageId: string } | undefined;
          if (act?.kind === 'nav') {
            const ev = new CustomEvent('appschmiede-nav', { detail: { pageId: act.pageId } });
            window.dispatchEvent(ev);
          }
        }}
      >
        {node.props?.label || 'Button'}
      </button>
    );
  }
  if (node.type === 'image') {
    return <img className={`${common} object-cover`} src={node.props?.src || 'https://picsum.photos/600/400'} alt="" />;
  }
  if (node.type === 'input') {
    return <input className={`${common} rounded-md bg-neutral-800 px-2`} placeholder={node.props?.placeholder || 'Eingabe'} />;
  }
  if (node.type === 'container') {
    return <div className={`${common} rounded-md`} style={{ background: node.style?.background || 'linear-gradient(135deg,#111,#1f2937)' }} />;
  }
  return null;
}

export default function Canvas({ project, setProject, pageId, selectedId, setSelectedId, preview }: CanvasProps) {
  const page = project.pages.find((p) => p.id === pageId)!;
  const draggingRef = useRef<null | { id: string; dx: number; dy: number }>(null);

  const onDown = (e: React.MouseEvent, id: string) => {
    if (preview) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;
    draggingRef.current = { id, dx, dy };
    setSelectedId(id);
  };

  const onMove = (e: React.MouseEvent) => {
    if (!draggingRef.current || preview) return;
    const { id, dx, dy } = draggingRef.current;
    const node = project.nodes[id];
    setProject({
      ...project,
      nodes: {
        ...project.nodes,
        [id]: {
          ...node,
          frame: {
            ...node.frame,
            x: clamp(e.nativeEvent.offsetX - dx, 0, 390 - node.frame.w),
            y: clamp(e.nativeEvent.offsetY - dy, 0, 844 - node.frame.h),
          },
        },
      },
    });
  };

  const onUp = () => {
    draggingRef.current = null;
  };

  return (
    <div
      className="absolute inset-0"
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onClick={(e) => {
        if (e.currentTarget === e.target) setSelectedId(null);
      }}
    >
      {page.nodeIds.map((id) => {
        const n = project.nodes[id];
        const isSel = id === selectedId;
        const style: React.CSSProperties = {
          position: 'absolute',
          left: n.frame.x,
          top: n.frame.y,
          width: n.frame.w,
          height: n.frame.h,
          pointerEvents: preview ? 'none' : 'auto',
        };
        return (
          <div key={id} style={style} className={`group ${!preview ? 'cursor-move' : ''}`} onMouseDown={(e) => onDown(e, id)}>
            <RenderNode node={n} preview={preview} />
            {!preview && isSel && <div className="absolute inset-0 ring-2 ring-emerald-400/70 rounded-md pointer-events-none" />}
          </div>
        );
      })}
    </div>
  );
}

export { RenderNode };
