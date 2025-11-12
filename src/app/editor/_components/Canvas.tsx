'use client';

import React, { useRef } from 'react';

export default function Canvas({ tree, selectedId, onSelect, onRemove, onMove }: any) {
  const dragging = useRef<null | { id: string; startX: number; startY: number }>(null);
  const children = tree?.tree?.children ?? [];

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

  const onMouseUp = () => { dragging.current = null; };

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative', cursor: 'default' }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClick={(e) => { if (e.currentTarget === e.target) onSelect(null); }}
    >
      {children.map((n: any) => {
        const style: any = {
          position: 'absolute',
          left: n.x ?? 0,
          top: n.y ?? 0,
          width: n.w ?? 'auto',
          height: n.h ?? 'auto',
          cursor: 'move',
        };
        const isSel = n.id === selectedId;

        if (n.type === 'text') {
          return (
            <div key={n.id} style={style} onMouseDown={(e) => onMouseDown(e, n.id)} className={isSel ? 'outline outline-2 outline-accent' : ''}>
              <div style={{ color: n.props?.color, fontSize: n.props?.fontSize }}>{n.props?.text}</div>
            </div>
          );
        }
        if (n.type === 'button') {
          return (
            <button
              key={n.id}
              style={{ ...style, background: n.props?.bg, color: n.props?.color, borderRadius: 8, border: 'none', padding: '8px 12px' }}
              onMouseDown={(e) => onMouseDown(e, n.id)}
              className={isSel ? 'outline outline-2 outline-accent' : ''}
            >
              {n.props?.label}
            </button>
          );
        }
        if (n.type === 'image') {
          return (
            <div key={n.id} style={style} onMouseDown={(e) => onMouseDown(e, n.id)} className={isSel ? 'outline outline-2 outline-accent' : ''}>
              {n.props?.src ? (
                <img src={n.props.src} alt={n.props?.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: 12 }}>
                  Bild
                </div>
              )}
            </div>
          );
        }
        if (n.type === 'input') {
          return (
            <div key={n.id} style={style} onMouseDown={(e) => onMouseDown(e, n.id)} className={isSel ? 'outline outline-2 outline-accent' : ''}>
              <input placeholder={n.props?.placeholder ?? 'Eingabe'} style={{ width: '100%', height: '100%', padding: 8, borderRadius: 6, background: 'rgba(15,23,41,0.8)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
            </div>
          );
        }
        if (n.type === 'container') {
          return (
            <div
              key={n.id}
              style={{ ...style, background: n.props?.bg ?? 'rgba(255,255,255,0.05)', borderRadius: 8 }}
              onMouseDown={(e) => onMouseDown(e, n.id)}
              className={isSel ? 'outline outline-2 outline-accent' : ''}
            />
          );
        }
        return null;
      })}
    </div>
  );
}