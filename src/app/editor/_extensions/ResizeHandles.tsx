// src/app/editor/_extensions/ResizeHandles.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import type { Project } from '@/types/editor';

type Dir = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export default function ResizeHandles({
  project,
  setProject,
  selectedId,
  preview = false,
  bounds = { width: 390, height: 844 },
}: {
  project: Project;
  setProject: (p: Project) => void;
  selectedId: string | null;
  preview?: boolean;
  bounds?: { width: number; height: number };
}) {
  if (preview || !selectedId) return null;
  const n = project.nodes[selectedId];
  if (!n) return null;

  const startRef = useRef<{
    x: number;
    y: number;
    frame: { x: number; y: number; w: number; h: number };
    dir: Dir;
  } | null>(null);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const onMove = (e: MouseEvent) => {
    if (!startRef.current) return;
    const { x: sx, y: sy, frame, dir } = startRef.current;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;

    let { x, y, w, h } = frame;
    const minW = 40,
      minH = 32;

    if (dir.includes('e')) w = clamp(frame.w + dx, minW, bounds.width - frame.x);
    if (dir.includes('s')) h = clamp(frame.h + dy, minH, bounds.height - frame.y);
    if (dir.includes('w')) {
      x = clamp(frame.x + dx, 0, frame.x + frame.w - minW);
      w = clamp(frame.w - dx, minW, frame.x + frame.w);
    }
    if (dir.includes('n')) {
      y = clamp(frame.y + dy, 0, frame.y + frame.h - minH);
      h = clamp(frame.h - dy, minH, frame.y + frame.h);
    }

    setProject({
      ...project,
      nodes: { ...project.nodes, [n.id]: { ...n, frame: { x, y, w, h } } },
    });
  };

  const onUp = () => {
    startRef.current = null;
    window.removeEventListener('mousemove', onMove);
  };

  const onDown = (e: React.MouseEvent, dir: Dir) => {
    e.stopPropagation();
    startRef.current = { x: e.clientX, y: e.clientY, frame: { ...n.frame }, dir };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
  };

  useEffect(() => {
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const handle = (dir: Dir, style: React.CSSProperties) => (
    <div
      key={dir}
      onMouseDown={(e) => onDown(e, dir)}
      style={{
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 3,
        background: 'rgba(16,185,129,.9)',
        boxShadow: '0 0 0 2px rgba(16,185,129,.25)',
        cursor:
          dir === 'n' || dir === 's'
            ? 'ns-resize'
            : dir === 'e' || dir === 'w'
            ? 'ew-resize'
            : dir === 'ne' || dir === 'sw'
            ? 'nesw-resize'
            : 'nwse-resize',
        ...style,
      }}
    />
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: n.frame.x,
        top: n.frame.y,
        width: n.frame.w,
        height: n.frame.h,
        pointerEvents: 'none',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(16,185,129,.6)', borderRadius: 6 }} />
      {handle('nw', { left: -6, top: -6 })}
      {handle('n', { left: 'calc(50% - 6px)', top: -6 })}
      {handle('ne', { right: -6, top: -6 })}
      {handle('e', { right: -6, top: 'calc(50% - 6px)' })}
      {handle('se', { right: -6, bottom: -6 })}
      {handle('s', { left: 'calc(50% - 6px)', bottom: -6 })}
      {handle('sw', { left: -6, bottom: -6 })}
      {handle('w', { left: -6, top: 'calc(50% - 6px)' })}
    </div>
  );
}
