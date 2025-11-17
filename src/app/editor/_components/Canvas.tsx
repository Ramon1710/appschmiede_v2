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

const BOUNDS = { w: 360, h: 720 };

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
      const handleButtonClick = () => {
        const action = node.props?.action;
        const target = node.props?.target ?? node.props?.targetPage;
        
        if (!action) return;
        
        switch (action) {
          case 'navigate':
            if (target) window.location.href = target;
            break;
          case 'url':
            if (target) window.open(target, '_blank');
            break;
          case 'login':
            console.log('🔐 Login action triggered');
            // TODO: Implement login logic
            break;
          case 'logout':
            console.log('🚪 Logout action triggered');
            // TODO: Implement logout logic
            break;
          case 'chat':
            if (target) window.open(`sms:${target}`, '_blank');
            break;
          case 'call':
            if (target) window.open(`tel:${target}`, '_blank');
            break;
          case 'email':
            if (target) window.open(`mailto:${target}`, '_blank');
            break;
          case 'upload-photo':
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) console.log('📷 Photo selected:', file.name);
              // TODO: Upload to Firebase Storage
            };
            input.click();
            break;
          case 'record-audio':
            console.log('🎤 Audio recording triggered');
            // TODO: Implement audio recording
            break;
          case 'toggle-theme':
            document.documentElement.classList.toggle('dark');
            console.log('🌓 Theme toggled');
            break;
          default:
            console.log('Unknown action:', action);
        }
      };
      
      return (
        <button 
          onClick={handleButtonClick}
          className={`${base} rounded-md border border-white/20 bg-white/10 hover:bg-white/20 flex items-center justify-center gap-2`}
        >
          {node.props?.icon && <span>{node.props.icon}</span>}
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
      const inputType = node.props?.inputType || 'text';
      if (inputType === 'checkbox') {
        return (
          <label className={`${base} flex items-center gap-2 px-2`}>
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-sm">{node.props?.label || 'Checkbox'}</span>
          </label>
        );
      }
      return (
        <input
          type={inputType}
          className={`${base} rounded-md bg-neutral-800 px-2 text-sm`}
          placeholder={node.props?.placeholder ?? 'Eingabe'}
        />
      );

    case 'container':
      const component = node.props?.component;
      const handleContainerClick = () => {
        if (component === 'chat') {
          console.log('💬 Chat opened');
          // TODO: Open chat interface
        } else if (component === 'qr-code') {
          const url = node.props?.qrUrl || window.location.href;
          console.log('📱 QR-Code for:', url);
          // TODO: Generate QR code
        } else if (component === 'time-tracking') {
          console.log('⏱️ Time tracking started');
          // TODO: Start/stop time tracking
        } else if (component === 'calendar') {
          console.log('📅 Calendar opened');
          // TODO: Show calendar view
        } else if (component === 'todo') {
          console.log('✅ Todo list opened');
          // TODO: Show todo list
        } else if (component === 'map') {
          const coords = node.props?.coordinates || '0,0';
          console.log('🗺️ Map location:', coords);
          // TODO: Show map with coordinates
        } else if (component === 'video-player') {
          const videoUrl = node.props?.videoUrl;
          if (videoUrl) window.open(videoUrl, '_blank');
          console.log('📹 Video player:', videoUrl);
        } else if (component === 'navbar') {
          console.log('🧭 Navigation menu');
          // TODO: Show navigation menu
        } else if (component === 'game-tictactoe') {
          console.log('❌ Tic Tac Toe game started');
          // TODO: Start game
        } else if (component === 'game-snake') {
          console.log('🐍 Snake game started');
          // TODO: Start game
        } else if (component === 'game-dice') {
          const result = Math.floor(Math.random() * 6) + 1;
          console.log('🎲 Dice rolled:', result);
          alert(`🎲 Du hast eine ${result} gewürfelt!`);
        }
      };

      if (component === 'chat') {
        return <div onClick={handleContainerClick} className={`${base} border border-emerald-500/30 bg-neutral-900 flex items-center justify-center text-xs text-emerald-400 cursor-pointer hover:bg-emerald-950`}>💬 Chatfenster</div>;
      }
      if (component === 'qr-code') {
        return <div onClick={handleContainerClick} className={`${base} border border-blue-500/30 bg-neutral-900 flex items-center justify-center text-xs text-blue-400 cursor-pointer hover:bg-blue-950`}>📱 QR-Code</div>;
      }
      if (component === 'time-tracking') {
        return <div onClick={handleContainerClick} className={`${base} border border-purple-500/30 bg-neutral-900 flex items-center justify-center text-xs text-purple-400 cursor-pointer hover:bg-purple-950`}>⏱️ Zeiterfassung</div>;
      }
      if (component === 'calendar') {
        return <div onClick={handleContainerClick} className={`${base} border border-orange-500/30 bg-neutral-900 flex items-center justify-center text-xs text-orange-400 cursor-pointer hover:bg-orange-950`}>📅 Kalender</div>;
      }
      if (component === 'todo') {
        return <div onClick={handleContainerClick} className={`${base} border border-green-500/30 bg-neutral-900 flex items-center justify-center text-xs text-green-400 cursor-pointer hover:bg-green-950`}>✅ Todo</div>;
      }
      if (component === 'map') {
        return <div onClick={handleContainerClick} className={`${base} border border-cyan-500/30 bg-neutral-900 flex items-center justify-center text-xs text-cyan-400 cursor-pointer hover:bg-cyan-950`}>🗺️ Karte</div>;
      }
      if (component === 'video-player') {
        return <div onClick={handleContainerClick} className={`${base} border border-red-500/30 bg-neutral-900 flex items-center justify-center text-xs text-red-400 cursor-pointer hover:bg-red-950`}>📹 Video</div>;
      }
      if (component === 'table') {
        return <div className={`${base} border border-yellow-500/30 bg-neutral-900 flex items-center justify-center text-xs text-yellow-400`}>📊 Tabelle</div>;
      }
      if (component === 'navbar') {
        return <div onClick={handleContainerClick} className={`${base} border border-indigo-500/30 bg-neutral-900 flex items-center justify-center text-xs text-indigo-400 cursor-pointer hover:bg-indigo-950`}>🧭 Navigation</div>;
      }
      if (component === 'game-tictactoe') {
        return <div onClick={handleContainerClick} className={`${base} border border-pink-500/30 bg-neutral-900 flex items-center justify-center text-xs text-pink-400 cursor-pointer hover:bg-pink-950`}>❌ Tic Tac Toe</div>;
      }
      if (component === 'game-snake') {
        return <div onClick={handleContainerClick} className={`${base} border border-lime-500/30 bg-neutral-900 flex items-center justify-center text-xs text-lime-400 cursor-pointer hover:bg-lime-950`}>🐍 Snake</div>;
      }
      if (component === 'game-dice') {
        return <div onClick={handleContainerClick} className={`${base} border border-amber-500/30 bg-neutral-900 flex items-center justify-center text-xs text-amber-400 cursor-pointer hover:bg-amber-950`}>🎲 Würfel</div>;
      }
      return (
        <div
          className={base}
          style={{ background: node.props?.bg ?? 'linear-gradient(135deg,#0b0b0f,#111827)' }}
        />
      );

    default:
      return <div className={`${base} border border-white/20 bg-neutral-800 flex items-center justify-center text-xs`}>Unbekannter Typ</div>;
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
                    className="absolute -right-4 -top-4 z-20 grid place-items-center w-7 h-7 rounded-full bg-rose-600 text-white text-sm shadow-lg border border-white/40"
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