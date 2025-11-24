'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  PageTree,
  Node as EditorNode,
  ButtonAction,
  NavbarItem,
  TaskItem,
  TimeEntry,
  AudioNote,
  FolderNode,
  NodeProps,
} from '@/lib/editorTypes';

const DEFAULT_PAGE_BACKGROUND = 'linear-gradient(140deg,#0b0b0f,#111827)';
const FRAME = { width: 414, height: 896 } as const;

const runAction = async (action?: ButtonAction | null, options: NodeProps = {}) => {
  if (!action) return;
  const target = options.target ?? options.targetPage ?? options.url;
  switch (action) {
    case 'navigate':
      if (target) window.open(target, '_blank', 'noopener');
      break;
    case 'url':
      if (target) window.open(target, '_blank', 'noopener');
      break;
    case 'login':
      window.alert('🔐 Login-Demo: Hier würdest du deinen eigenen Login-Flow integrieren.');
      break;
    case 'register':
      window.alert('📝 Registrierung-Demo: Binde hier deinen echten Registrierungsprozess ein.');
      break;
    case 'reset-password':
      window.alert('🔑 Passwort-zurücksetzen-Demo: Leite hier auf deine echte Reset-Logik weiter.');
      break;
    case 'logout':
      window.alert('🚪 Logout-Aktion: Hier könntest du deinen Auth-Flow einbinden.');
      break;
    case 'chat':
      if (target) window.open(`sms:${target}`, '_blank');
      break;
    case 'call':
      if (target || options.phoneNumber) window.open(`tel:${target ?? options.phoneNumber}`, '_blank');
      break;
    case 'email':
      if (target || options.emailAddress) window.open(`mailto:${target ?? options.emailAddress}`, '_blank');
      break;
    case 'upload-photo': {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.click();
      break;
    }
    case 'record-audio': {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const urlObject = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = urlObject;
          anchor.download = `aufnahme-${Date.now()}.webm`;
          anchor.click();
          URL.revokeObjectURL(urlObject);
          stream.getTracks().forEach((track) => track.stop());
        };
        recorder.start();
        window.alert('🎤 Aufnahme gestartet – sie stoppt automatisch nach 5 Sekunden.');
        setTimeout(() => recorder.stop(), 5000);
      } catch (error) {
        console.error('Audio recording failed', error);
        window.alert('Konnte keine Audioaufnahme starten. Bitte Mikrofonrechte prüfen.');
      }
      break;
    }
    case 'toggle-theme':
      document.documentElement.classList.toggle('dark');
      break;
    case 'support-ticket':
      window.open(`mailto:${options.supportTarget ?? 'support@appschmiede.dev'}`, '_blank');
      break;
    default:
      console.log('Unknown action triggered', action);
  }
};

const NavbarWidget = ({ items, onItemClick }: { items: NavbarItem[]; onItemClick: (item: NavbarItem) => void }) => (
  <nav className="flex h-full flex-col justify-center rounded-xl border border-indigo-500/30 bg-[#0b0f1b]/90 px-4 py-3 text-sm text-neutral-200">
    <div className="text-xs uppercase tracking-widest text-indigo-200/70">Navigation</div>
    <div className="mt-2 flex flex-wrap gap-2">
      {items.length === 0 ? (
        <span className="rounded border border-dashed border-white/20 px-2 py-1 text-xs text-neutral-500">Keine Links hinterlegt</span>
      ) : (
        items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onItemClick(item);
            }}
            onMouseDown={(event) => event.stopPropagation()}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium hover:bg-white/15"
          >
            {item.icon ? `${item.icon} ${item.label}` : item.label}
          </button>
        ))
      )}
    </div>
  </nav>
);

const TimeTrackingWidget = ({
  entries,
  onUpdate,
}: {
  entries: TimeEntry[];
  onUpdate: (entries: TimeEntry[]) => void;
}) => {
  const activeEntry = useMemo(() => entries.find((entry) => !entry.endedAt), [entries]);
  const [elapsed, setElapsed] = useState(activeEntry?.seconds ?? 0);

  useEffect(() => {
    if (!activeEntry) {
      setElapsed(0);
      return;
    }
    const startedAt = activeEntry.startedAt ? Date.parse(activeEntry.startedAt) : Date.now();
    const offset = activeEntry.seconds ?? 0;
    setElapsed(offset);
    const interval = window.setInterval(() => {
      const diff = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      setElapsed(offset + diff);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [activeEntry?.id, activeEntry?.startedAt, activeEntry?.seconds]);

  const closeEntries = useCallback(() => {
    const closed = entries.map((entry) => {
      if (!entry.endedAt && activeEntry && entry.id === activeEntry.id) {
        return {
          ...entry,
          seconds: elapsed,
          endedAt: new Date().toISOString(),
        };
      }
      if (!entry.endedAt) {
        return {
          ...entry,
          seconds: entry.seconds ?? 0,
          endedAt: new Date().toISOString(),
        };
      }
      return entry;
    });
    return closed;
  }, [activeEntry, elapsed, entries]);

  const handleStart = () => {
    const label = window.prompt('Was soll getrackt werden?', 'Neuer Task')?.trim();
    const newEntry: TimeEntry = {
      id: createId(),
      label: label && label.length > 0 ? label : 'Neuer Task',
      seconds: 0,
      startedAt: new Date().toISOString(),
    };
    const closedEntries = closeEntries();
    onUpdate([...closedEntries, newEntry]);
  };

  const handleStop = () => {
    const closedEntries = closeEntries();
    onUpdate(closedEntries);
  };

  const handleReset = () => {
    const confirmed = window.confirm('Alle Zeiteinträge löschen?');
    if (!confirmed) return;
    onUpdate([]);
  };

  return (
    <div className="h-full rounded-xl border border-purple-500/30 bg-[#130b1b] p-3 text-xs text-neutral-200">
      <div className="flex items-center justify-between">
        <span className="uppercase tracking-widest text-purple-200/70">Zeiterfassung</span>
        <span className="font-mono text-sm text-purple-100">{formatDuration(elapsed)}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded bg-purple-500/30 px-2 py-1 font-medium hover:bg-purple-500/40"
          onClick={handleStart}
          onMouseDown={(event) => event.stopPropagation()}
        >Start</button>
        <button
          type="button"
          className="flex-1 rounded bg-purple-500/20 px-2 py-1 font-medium hover:bg-purple-500/30 disabled:opacity-50"
          disabled={!activeEntry}
          onClick={handleStop}
          onMouseDown={(event) => event.stopPropagation()}
        >Stop</button>
        <button
          type="button"
          className="rounded bg-white/5 px-2 py-1 font-medium text-white/80 hover:bg-white/10"
          onClick={handleReset}
          onMouseDown={(event) => event.stopPropagation()}
        >Reset</button>
      </div>
      <div className="mt-3 max-h-36 space-y-2 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="rounded border border-dashed border-white/10 px-3 py-2 text-[11px] text-neutral-400">
            Noch keine Einträge – klicke auf Start.
          </div>
        ) : (
          entries
            .slice()
            .reverse()
            .map((entry) => (
              <div
                key={entry.id}
                className={`rounded-lg border px-3 py-2 ${entry.endedAt ? 'border-white/10 bg-white/5' : 'border-purple-400/60 bg-purple-500/10'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-100">{entry.label}</span>
                  <span className="font-mono text-[11px] text-purple-100">{formatDuration(entry.id === activeEntry?.id ? elapsed : entry.seconds ?? 0)}</span>
                </div>
                <div className="text-[10px] text-neutral-500">
                  {entry.startedAt ? new Date(entry.startedAt).toLocaleString?.() ?? new Date(entry.startedAt).toString() : 'Gestartet'}
                  {entry.endedAt
                    ? ` – beendet ${new Date(entry.endedAt).toLocaleString?.() ?? new Date(entry.endedAt).toString()}`
                    : ' – läuft'}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

type FolderTreeProps = {
  nodes: FolderNode[];
  onChange: (nodes: FolderNode[]) => void;
};

const FolderStructureWidget = ({ nodes, onChange }: FolderTreeProps) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(nodes.map((node) => [node.id, true]))
  );

  useEffect(() => {
    setExpanded((prev) => ({ ...nodes.reduce((acc, node) => ({ ...acc, [node.id]: prev[node.id] ?? true }), {}), ...prev }));
  }, [nodes]);

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const addFolder = (parentId: string | null) => {
    const name = window.prompt('Name des neuen Ordners?')?.trim();
    if (!name) return;
    const newNode: FolderNode = { id: createId(), name, children: [] };

    const insert = (list: FolderNode[]): FolderNode[] =>
      list.map((node) => {
        if (node.id === parentId) {
          const children = Array.isArray(node.children) ? [...node.children, newNode] : [newNode];
          return { ...node, children };
        }
        if (node.children?.length) {
          return { ...node, children: insert(node.children) };
        }
        return node;
      });

    if (!parentId) {
      onChange([...nodes, newNode]);
    } else {
      onChange(insert(nodes));
    }
  };

  const renderTree = (list: FolderNode[], depth = 0): React.ReactNode =>
    list.map((node) => {
      const isExpanded = expanded[node.id] ?? true;
      const hasChildren = Boolean(node.children?.length);
      return (
        <div key={node.id} className="space-y-1">
          <div className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1 text-xs">
            <button
              type="button"
              className="flex items-center gap-2 text-left"
              onClick={(event) => {
                event.stopPropagation();
                if (hasChildren) toggle(node.id);
              }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <span className="font-mono text-[10px] text-neutral-400">{depth + 1}</span>
              <span>{node.name}</span>
              <span className="text-[10px] text-neutral-500">{hasChildren ? (isExpanded ? '▼' : '▶') : '•'}</span>
            </button>
            <button
              type="button"
              className="rounded bg-white/10 px-2 py-1 text-[10px] hover:bg-white/20"
              onClick={(event) => {
                event.stopPropagation();
                addFolder(node.id);
              }}
              onMouseDown={(event) => event.stopPropagation()}
            >+ Ordner</button>
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-4 border-l border-white/10 pl-2">
              {renderTree(node.children!, depth + 1)}
            </div>
          )}
        </div>
      );
    });

  return (
    <div className="h-full overflow-y-auto rounded-xl border border-blue-500/30 bg-[#0b1320] p-3 text-xs text-neutral-200">
      <div className="flex items-center justify-between">
        <span className="uppercase tracking-widest text-blue-200/70">Ordnerstruktur</span>
        <button
          type="button"
          className="rounded bg-blue-500/30 px-2 py-1 text-[10px] font-medium hover:bg-blue-500/40"
          onClick={() => addFolder(null)}
          onMouseDown={(event) => event.stopPropagation()}
        >
          + Root-Ordner
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {nodes.length === 0 ? (
          <div className="rounded border border-dashed border-white/15 px-3 py-2 text-neutral-400">
            Noch keine Ordner.
          </div>
        ) : (
          renderTree(nodes)
        )}
      </div>
    </div>
  );
};

type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  createdAt: string;
  channel: string;
};

const SupportWidget = ({
  tickets,
  onCreateTicket,
  channel,
}: {
  tickets: SupportTicket[];
  onCreateTicket: (ticket: SupportTicket) => void;
  channel: string;
}) => (
  <div className="h-full rounded-xl border border-cyan-500/30 bg-[#0b1f24] p-3 text-xs text-neutral-100">
    <div className="flex items-center justify-between">
      <div>
        <span className="block text-[10px] uppercase tracking-widest text-cyan-200/70">Support & Tickets</span>
        <span className="text-[10px] text-neutral-500">Kanal: {channel}</span>
      </div>
      <button
        type="button"
        className="rounded bg-cyan-500/30 px-2 py-1 text-[10px] font-medium hover:bg-cyan-500/40"
        onClick={() => {
          const subject = window.prompt('Betreff des Tickets?')?.trim();
          if (!subject) return;
          const message = window.prompt('Kurze Beschreibung?')?.trim() ?? '';
          onCreateTicket({
            id: createId(),
            subject,
            message,
            createdAt: new Date().toISOString(),
            channel,
          });
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        Ticket erstellen
      </button>
    </div>
    <div className="mt-3 space-y-2 overflow-y-auto">
      {tickets.length === 0 ? (
        <div className="rounded border border-dashed border-white/10 px-3 py-2 text-neutral-400">Noch keine Tickets erstellt.</div>
      ) : (
        tickets
          .slice()
          .reverse()
          .map((ticket) => (
            <div key={ticket.id} className="rounded-lg bg-white/5 px-3 py-2">
              <div className="flex items-center justify-between font-medium text-neutral-100">
                <span>{ticket.subject}</span>
                <span className="text-[10px] text-neutral-400">{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
              {ticket.message && <div className="mt-1 text-[10px] text-neutral-400">{ticket.message}</div>}
            </div>
          ))
      )}
    </div>
  </div>
);

const generateCalendarMatrix = (baseDate: Date) => {
  const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const startDayIndex = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
  const matrix: Array<Array<number | null>> = [];
  let current = 1 - startDayIndex;
  while (current <= daysInMonth) {
    const week: Array<number | null> = [];
    for (let i = 0; i < 7; i += 1) {
      if (current < 1 || current > daysInMonth) week.push(null);
      else week.push(current);
      current += 1;
    }
    matrix.push(week);
  }
  return matrix;
};

const CalendarWidget = ({ date, onChangeDate }: { date: Date; onChangeDate: (next: Date) => void }) => {
  const weeks = useMemo(() => generateCalendarMatrix(date), [date]);
  const goOffset = (offset: number) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + offset);
    onChangeDate(next);
  };
  return (
    <div className="h-full rounded-xl border border-orange-500/30 bg-[#21150b] p-3 text-xs text-neutral-100">
      <div className="flex items-center justify-between">
        <button type="button" className="text-lg" onClick={() => goOffset(-1)} onMouseDown={(event) => event.stopPropagation()}>‹</button>
        <div className="text-sm font-semibold">{date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
        <button type="button" className="text-lg" onClick={() => goOffset(1)} onMouseDown={(event) => event.stopPropagation()}>›</button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-[10px] uppercase tracking-widest text-orange-200/80">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
          <div key={day} className="text-center">{day}</div>
        ))}
      </div>
      <div className="mt-1 grid flex-1 grid-cols-7 gap-1 text-[11px]">
        {weeks.map((week, idx) => (
          <React.Fragment key={`week-${idx}`}>
            {week.map((day, dayIdx) => (
              <div
                key={`day-${idx}-${dayIdx}`}
                className={`flex h-10 items-center justify-center rounded ${day ? 'bg-white/5' : 'bg-white/5 text-neutral-700 opacity-40'}`}
              >
                {day ?? ''}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const TodoWidget = ({ items, onChange }: { items: TaskItem[]; onChange: (tasks: TaskItem[]) => void }) => (
  <TaskManagerWidget title="Todo-Liste" tasks={items} onChange={onChange} />
);

const MapWidget = ({ location }: { location: string }) => {
  const encoded = encodeURIComponent(location);
  return (
    <div className="h-full overflow-hidden rounded-xl border border-cyan-500/40 bg-[#041820]">
      <iframe
        title={`Karte für ${location}`}
        src={`https://maps.google.com/maps?q=${encoded}&z=14&output=embed`}
        className="h-full w-full"
        loading="lazy"
        allowFullScreen
      />
    </div>
  );
};

const VideoPlayerWidget = ({ url }: { url: string | undefined }) => {
  if (!url) {
    return (
      <div className="grid h-full place-items-center rounded-xl border border-red-500/30 bg-[#230b0b] text-xs text-red-200">
        Kein Video-Link hinterlegt.
      </div>
    );
  }
  const isYouTube = /youtu\.?be/.test(url);
  if (isYouTube) {
    const videoIdMatch = url.match(/[?&]v=([^&]+)/) ?? url.match(/youtu\.be\/([^?]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : '';
    return (
      <div className="h-full overflow-hidden rounded-xl border border-red-500/30 bg-black">
        <iframe
          title="YouTube Player"
          src={`https://www.youtube.com/embed/${videoId}`}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <div className="h-full overflow-hidden rounded-xl border border-red-500/30 bg-black">
      <video src={url} controls className="h-full w-full object-cover" />
    </div>
  );
};

const AudioRecorderWidget = ({
  notes,
  onChange,
}: {
  notes: AudioNote[];
  onChange: (notes: AudioNote[]) => void;
}) => {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const label = window.prompt('Name der Aufnahme?', 'Notiz') ?? 'Notiz';
        onChange([
          ...notes,
          {
            id: createId(),
            label,
            createdAt: new Date().toISOString(),
            url,
          },
        ]);
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Audio recorder failed', error);
      window.alert('Konnte keine Aufnahme starten. Bitte Mikrofonrechte prüfen.');
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
  };

  const deleteNote = (id: string) => {
    onChange(notes.filter((note) => note.id !== id));
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-pink-500/30 bg-[#1f0b1f] p-3 text-xs text-neutral-200">
      <div className="flex items-center justify-between">
        <span className="uppercase tracking-widest text-pink-200/70">Audio Recorder</span>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded bg-pink-500/40 px-2 py-1 text-[10px] font-semibold hover:bg-pink-500/50 disabled:opacity-60"
            onClick={startRecording}
            disabled={isRecording}
            onMouseDown={(event) => event.stopPropagation()}
          >Aufnahme</button>
          <button
            type="button"
            className="rounded bg-white/10 px-2 py-1 text-[10px] font-semibold hover:bg-white/20 disabled:opacity-60"
            onClick={stopRecording}
            disabled={!isRecording}
            onMouseDown={(event) => event.stopPropagation()}
          >Stop</button>
        </div>
      </div>
      <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="rounded border border-dashed border-white/10 px-3 py-2 text-neutral-400">Noch keine Aufnahmen.</div>
        ) : (
          notes
            .slice()
            .reverse()
            .map((note) => (
              <div key={note.id} className="space-y-1 rounded bg-white/5 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-100">{note.label}</span>
                  <button
                    type="button"
                    className="text-[10px] text-pink-200 hover:text-pink-100"
                    onClick={() => deleteNote(note.id)}
                    onMouseDown={(event) => event.stopPropagation()}
                  >Löschen</button>
                </div>
                <div className="text-[10px] text-neutral-500">{new Date(note.createdAt).toLocaleString()}</div>
                <audio controls className="w-full">
                  <source src={note.url} type="audio/webm" />
                </audio>
              </div>
            ))
        )}
      </div>
      <div className="text-[10px] text-neutral-500">Hinweis: Aufnahmen werden lokal gespeichert (Data-URL) und beim Export berücksichtigt.</div>
    </div>
  );
};

const DiceWidget = () => {
  const [history, setHistory] = useState<number[]>([]);
  const roll = () => {
    const value = Math.floor(Math.random() * 6) + 1;
    setHistory((prev) => [...prev.slice(-4), value]);
  };
  return (
    <div className="grid h-full place-items-center rounded-xl border border-amber-500/30 bg-[#26190b] p-3 text-neutral-200">
      <div className="space-y-3 text-center">
        <div className="text-4xl">🎲</div>
        <div className="text-xs uppercase tracking-widest text-amber-200/80">Würfel</div>
        <button
          type="button"
          className="rounded bg-amber-500/40 px-4 py-1 text-sm font-semibold hover:bg-amber-500/50"
          onClick={roll}
          onMouseDown={(event) => event.stopPropagation()}
        >Würfeln</button>
        {history.length > 0 && (
          <div className="text-xs text-neutral-300">Letzte Würfe: {history.join(' · ')}</div>
        )}
      </div>
    </div>
  );
};

const TicTacToeWidget = () => {
  const initialBoard = Array<('X' | 'O' | null)>(9).fill(null);
  const [board, setBoard] = useState(initialBoard);
  const [player, setPlayer] = useState<'X' | 'O'>('X');

  const winner = useMemo(() => {
    const combos = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (const [a, b, c] of combos) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    if (board.every((cell) => cell)) return 'draw';
    return null;
  }, [board]);

  const play = (index: number) => {
    if (board[index] || winner) return;
    setBoard((prev) => prev.map((cell, idx) => (idx === index ? player : cell)));
    setPlayer((prev) => (prev === 'X' ? 'O' : 'X'));
  };

  const reset = () => {
    setBoard(initialBoard);
    setPlayer('X');
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-pink-500/30 bg-[#240b1f] p-3 text-neutral-100">
      <div className="grid grid-cols-3 gap-1">
        {board.map((cell, idx) => (
          <button
            key={idx}
            type="button"
            className="h-12 w-12 rounded bg-white/10 text-xl font-semibold hover:bg-white/20"
            onClick={() => play(idx)}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {cell ?? ''}
          </button>
        ))}
      </div>
      <div className="text-xs uppercase tracking-widest text-pink-200/80">
        {winner === 'draw' ? 'Unentschieden' : winner ? `${winner} hat gewonnen` : `Zug: ${player}`}
      </div>
      <button
        type="button"
        className="rounded bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
        onClick={reset}
        onMouseDown={(event) => event.stopPropagation()}
      >Neu starten</button>
    </div>
  );
};

const SnakeWidget = () => {
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => {
      setScore((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 500);
    const timeout = window.setTimeout(() => {
      setPlaying(false);
      window.clearInterval(interval);
    }, 15000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [playing]);

  const start = () => {
    setScore(0);
    setPlaying(true);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-lime-500/30 bg-[#0f1f0b] p-3 text-lime-200">
      <div className="text-3xl">🐍</div>
      <div className="text-xs uppercase tracking-widest">Snake Demo</div>
      <div className="text-sm font-semibold">Score: {score}</div>
      <button
        type="button"
        className="rounded bg-lime-500/40 px-4 py-1 text-sm font-semibold hover:bg-lime-500/50 disabled:opacity-40"
        onClick={start}
        disabled={playing}
        onMouseDown={(event) => event.stopPropagation()}
      >{playing ? 'Läuft…' : 'Start'}</button>
      <div className="text-[10px] text-lime-100/80">Die Demo stoppt automatisch nach 15 Sekunden.</div>
    </div>
  );
};

function RenderNode({ node, onUpdate }: { node: EditorNode; onUpdate: (patch: Partial<EditorNode>) => void }) {
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

    case 'button': {
      const handleButtonClick = async () => {
        await runAction(node.props?.action, {
          target: node.props?.target,
          targetPage: node.props?.targetPage,
          url: node.props?.url,
          phoneNumber: typeof node.props?.phoneNumber === 'string' ? node.props.phoneNumber : undefined,
          emailAddress: typeof node.props?.emailAddress === 'string' ? node.props.emailAddress : undefined,
          supportTarget: typeof node.props?.supportTarget === 'string' ? node.props.supportTarget : undefined,
        });
      };

      return (
        <button
          type="button"
          onClick={handleButtonClick}
          className={`${base} flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 text-sm font-medium hover:bg-white/20`}
        >
          {node.props?.icon && <span>{node.props.icon}</span>}
          {node.props?.label ?? 'Button'}
        </button>
      );
    }

    case 'image':
      return (
        <img
          className={`${base} object-cover`}
          src={node.props?.src || 'https://placehold.co/320x180/1e293b/fff?text=Bild'}
          alt=""
        />
      );

    case 'input': {
      const inputType = node.props?.inputType || 'text';
      if (inputType === 'checkbox') {
        return (
          <label className={`${base} flex items-center gap-2 px-2`}>
            <input type="checkbox" className="h-4 w-4" />
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
    }

    case 'container': {
      const component = node.props?.component;

      if (component === 'navbar') {
        const navItems = ensureNavItems(node.props);
        return (
          <NavbarWidget
            items={navItems}
            onItemClick={(item) => {
              void runAction(item.action, {
                target: item.target ?? item.url,
                targetPage: item.targetPage,
                url: item.url,
                supportTarget: typeof node.props?.supportTarget === 'string' ? node.props.supportTarget : undefined,
              });
            }}
          />
        );
      }

      if (component === 'time-tracking') {
        const entries = ensureTimeEntries(node.props?.timeTracking?.entries);
        return (
          <TimeTrackingWidget
            entries={entries}
            onUpdate={(updatedEntries) =>
              onUpdate({
                props: {
                  ...node.props,
                  timeTracking: { entries: updatedEntries },
                },
              })
            }
          />
        );
      }

      if (component === 'folder-structure') {
        const tree = ensureFolderTree(node.props?.folderTree);
        return (
          <FolderStructureWidget
            nodes={tree}
            onChange={(nextTree) =>
              onUpdate({
                props: {
                  ...node.props,
                  folderTree: nextTree,
                },
              })
            }
          />
        );
      }

      if (component === 'task-manager') {
        const tasks = ensureTaskList(node.props?.tasks);
        return (
          <TaskManagerWidget
            title="Tasks"
            tasks={tasks}
            onChange={(updated) =>
              onUpdate({
                props: {
                  ...node.props,
                  tasks: updated,
                },
              })
            }
          />
        );
      }

      if (component === 'support') {
        const tickets: SupportTicket[] = Array.isArray(node.props?.supportTickets)
          ? (node.props?.supportTickets as SupportTicket[])
          : [];
        const channel = typeof node.props?.supportChannel === 'string' ? node.props.supportChannel : 'ticket';
        return (
          <SupportWidget
            tickets={tickets}
            channel={channel}
            onCreateTicket={(ticket) =>
              onUpdate({
                props: {
                  ...node.props,
                  supportTickets: [...tickets, ticket],
                },
              })
            }
          />
        );
      }

      if (component === 'calendar') {
        const focusDate = node.props?.calendarFocusDate ? new Date(node.props.calendarFocusDate) : new Date();
        return (
          <CalendarWidget
            date={focusDate}
            onChangeDate={(next) =>
              onUpdate({
                props: {
                  ...node.props,
                  calendarFocusDate: next.toISOString(),
                },
              })
            }
          />
        );
      }

      if (component === 'todo') {
        const todos = ensureTaskList(node.props?.todoItems);
        return (
          <TodoWidget
            items={todos}
            onChange={(updated) =>
              onUpdate({
                props: {
                  ...node.props,
                  todoItems: updated,
                },
              })
            }
          />
        );
      }

      if (component === 'map') {
        const location = typeof node.props?.mapLocation === 'string' ? node.props.mapLocation : 'Berlin, Germany';
        return <MapWidget location={location} />;
      }

      if (component === 'video-player') {
        return <VideoPlayerWidget url={typeof node.props?.videoUrl === 'string' ? node.props.videoUrl : undefined} />;
      }

      if (component === 'audio-recorder') {
        const notes = ensureAudioNotes(node.props?.audioNotes);
        return (
          <AudioRecorderWidget
            notes={notes}
            onChange={(updated) =>
              onUpdate({
                props: {
                  ...node.props,
                  audioNotes: updated,
                },
              })
            }
          />
        );
      }

      if (component === 'game-dice') {
        return <DiceWidget />;
      }

      if (component === 'game-tictactoe') {
        return <TicTacToeWidget />;
      }

      if (component === 'game-snake') {
        return <SnakeWidget />;
      }

      if (component === 'ai-chat') {
        const handleDemo = () => {
          const question = window.prompt('Was soll der KI-Chat beantworten?');
          if (!question) return;
          const canned = ['Ich habe dir bereits eine Vorlage vorbereitet.', 'Klar! Ich analysiere deine Anfrage gerade.', 'Ich habe dir dazu ein paar Layout-Vorschläge gemacht.'];
          const index = Math.abs([...question].reduce((acc, char) => acc + char.charCodeAt(0), 0)) % canned.length;
          window.alert(`🤖 Antwort: ${canned[index]}`);
        };
        return (
          <div
            className={`${base} flex flex-col gap-2 rounded-xl border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-3 text-neutral-200 shadow-inner`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-xs font-semibold text-emerald-300">🤖 KI-Chat (Demo)</div>
            <div className="flex-1 space-y-2 text-[11px] leading-relaxed">
              <div className="max-w-[85%] rounded-lg bg-white/10 px-2 py-1">Hallo! Wie kann ich dein App-Projekt unterstützen?</div>
              <div className="ml-auto max-w-[85%] rounded-lg bg-emerald-500/20 px-2 py-1 text-right">Zeig mir Ideen für ein Analytics-Dashboard.</div>
              <div className="max-w-[85%] rounded-lg bg-white/10 px-2 py-1">Ich habe dir drei Layouts erstellt. Klick auf "Demo Antwort" für zufällige Inspiration.</div>
            </div>
            <button
              type="button"
              onClick={handleDemo}
              className="rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20"
              onMouseDown={(event) => event.stopPropagation()}
            >Demo Antwort</button>
            <div className="text-[10px] text-neutral-500">Hinweis: In echten Projekten kannst du hier deine eigene KI-API anbinden.</div>
          </div>
        );
      }

      if (component === 'chat') {
        return (
          <div className={`${base} grid place-items-center rounded-xl border border-emerald-500/30 bg-neutral-900 text-xs text-emerald-400`}>
            💬 Chatfenster (Demo)
          </div>
        );
      }

      if (component === 'qr-code') {
        const qrUrl = typeof node.props?.qrUrl === 'string' ? node.props.qrUrl : window.location.href;
        return (
          <div className={`${base} grid place-items-center rounded-xl border border-blue-500/30 bg-neutral-900 text-xs text-blue-400`}>
            📱 QR-Code für {qrUrl}
          </div>
        );
      }

      if (component === 'analytics') {
        return (
          <div className={`${base} rounded-xl border border-sky-500/30 bg-[#06121f] p-3 text-xs text-neutral-200`}>
            <div className="font-semibold text-sky-200">Analytics Dashboard</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-white/5 p-2">Visits<br /><span className="text-lg font-semibold">1.204</span></div>
              <div className="rounded-lg bg-white/5 p-2">Conversion<br /><span className="text-lg font-semibold">3,4%</span></div>
              <div className="col-span-2 rounded-lg bg-white/5 p-2">Top-Kampagne: 🚀 Launch KW12</div>
            </div>
          </div>
        );
      }

      if (component === 'avatar-creator') {
        return (
          <div className={`${base} flex flex-col items-center justify_center gap-2 rounded-xl border border-fuchsia-500/30 bg-[#1a0f1f] text-xs text-fuchsia-200`}>
            <div className="text-4xl">👤</div>
            <div>Avatar Creator (Demo)</div>
            <div className="text-[10px] text-fuchsia-100/70">Hier könntest du KI-basierte Avatare generieren.</div>
          </div>
        );
      }

      if (component === 'table') {
        return (
          <div className={`${base} rounded-xl border border-yellow-500/30 bg-[#221f0b] p-3 text-xs text-neutral-200`}>
            <div className="text-sm font-semibold text-yellow-200">Team Übersicht</div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
              <div className="font-semibold">Name</div>
              <div className="font-semibold">Rolle</div>
              <div className="font-semibold">Status</div>
              <div>Alex</div>
              <div>Design</div>
              <div>✅ Online</div>
              <div>Sam</div>
              <div>Engineering</div>
              <div>🟡 beschäftigt</div>
            </div>
          </div>
        );
      }

      return (
        <div
          className={base}
          style={{ background: node.props?.bg ?? 'linear-gradient(135deg,#0b0b0f,#111827)' }}
        />
      );
    }

    default:
      return <div className={`${base} flex items-center justify-center rounded-md border border-white/20 bg-neutral-800 text-xs`}>Unbekannter Typ</div>;
  }
}

function mergeNodePatch(node: EditorNode, patch: Partial<EditorNode>): EditorNode {
  return {
    ...node,
    ...patch,
    props: patch.props ? { ...(node.props ?? {}), ...patch.props } : node.props,
    style: patch.style ? { ...(node.style ?? {}), ...patch.style } : node.style,
    children: patch.children ?? node.children,
  };
}

function applyPatch(tree: EditorNode, targetId: string, patch: Partial<EditorNode>): EditorNode {
  if (tree.id === targetId) {
    return mergeNodePatch(tree, patch);
  }
  if (!tree.children?.length) return tree;
  let changed = false;
  const nextChildren = tree.children.map((child) => {
    const updated = applyPatch(child, targetId, patch);
    if (updated !== child) changed = true;
    return updated;
  });
  if (!changed) return tree;
  return {
    ...tree,
    children: nextChildren,
  };
}

type PreviewCanvasProps = {
  page: PageTree;
};

export default function PreviewCanvas({ page }: PreviewCanvasProps) {
  const [localPage, setLocalPage] = useState<PageTree>(page);

  useEffect(() => {
    setLocalPage(page);
  }, [page]);

  const handleUpdateNode = useCallback((id: string, patch: Partial<EditorNode>) => {
    setLocalPage((prev) => ({
      ...prev,
      tree: applyPatch(prev.tree, id, patch),
    }));
  }, []);

  const rootBackground = typeof localPage.tree.props?.bg === 'string' && localPage.tree.props.bg.trim() !== ''
    ? localPage.tree.props.bg
    : DEFAULT_PAGE_BACKGROUND;

  return (
    <div className="flex justify-center">
      <div
        className="relative shrink-0 overflow-hidden rounded-[36px] border border-neutral-800 shadow-2xl"
        style={{ width: FRAME.width, height: FRAME.height, background: rootBackground }}
      >
        {(localPage.tree.children ?? []).map((node) => (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: node.x ?? 0,
              top: node.y ?? 0,
              width: node.w ?? 120,
              height: node.h ?? 40,
            }}
          >
            <RenderNode node={node} onUpdate={(patch) => handleUpdateNode(node.id, patch)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function formatDuration(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const mins = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
  const secs = (safeSeconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function ensureNavItems(props?: NodeProps): NavbarItem[] {
  if (Array.isArray(props?.navItems) && props.navItems.length > 0) {
    return props.navItems.map((item) => ({
      id: typeof item.id === 'string' ? item.id : createId(),
      label: item.label ?? 'Link',
      action: item.action ?? 'navigate',
      target: item.target,
      targetPage: item.targetPage,
      url: item.url,
      icon: item.icon,
    }));
  }
  return [
    {
      id: createId(),
      label: 'Dashboard',
      action: 'navigate',
      target: '#dashboard',
    },
    {
      id: createId(),
      label: 'Kontakt',
      action: 'navigate',
      target: '#contact',
    },
  ];
}

function ensureTimeEntries(entries?: TimeEntry[] | null): TimeEntry[] {
  if (!Array.isArray(entries) || entries.length === 0) {
    return [
      {
        id: createId(),
        label: 'Demo Task',
        seconds: 1800,
        startedAt: new Date(Date.now() - 1800 * 1000).toISOString(),
        endedAt: new Date().toISOString(),
      },
    ];
  }
  return entries.map((entry) => ({
    id: typeof entry.id === 'string' ? entry.id : createId(),
    label: entry.label ?? 'Task',
    seconds: typeof entry.seconds === 'number' ? entry.seconds : 0,
    startedAt: entry.startedAt ?? new Date().toISOString(),
    endedAt: entry.endedAt,
  }));
}

function ensureFolderTree(nodes?: FolderNode[] | null): FolderNode[] {
  const normalized = mapFolderNodes(nodes);
  if (normalized.length > 0) return normalized;
  return [
    {
      id: createId(),
      name: 'Projekt A',
      children: [{ id: createId(), name: 'Sprint 1' }],
    },
  ];
}

function mapFolderNodes(nodes?: FolderNode[] | null): FolderNode[] {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((node) => ({
    id: typeof node.id === 'string' ? node.id : createId(),
    name: node.name ?? 'Ordner',
    children: mapFolderNodes(node.children),
  }));
}

function ensureTaskList(list?: TaskItem[] | null): TaskItem[] {
  if (!Array.isArray(list) || list.length === 0) {
    return [
      { id: createId(), title: 'Design finalisieren', done: false },
      { id: createId(), title: 'Review vorbereiten', done: true },
    ];
  }
  return list.map((item) => ({
    id: typeof item.id === 'string' ? item.id : createId(),
    title: item.title ?? 'Aufgabe',
    done: Boolean(item.done),
  }));
}

function ensureAudioNotes(notes?: AudioNote[] | null): AudioNote[] {
  if (!Array.isArray(notes) || notes.length === 0) {
    return [];
  }
  return notes.map((note) => ({
    id: typeof note.id === 'string' ? note.id : createId(),
    label: note.label ?? 'Notiz',
    createdAt: note.createdAt ?? new Date().toISOString(),
    url: note.url ?? '',
  }));
}
