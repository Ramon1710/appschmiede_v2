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
  AvatarTrait,
  AvatarAction,
  FolderNode,
  StatusOption,
  NodeProps,
  SupportTicket,
  AnalyticsMetric,
  TableConfig,
  MapMode,
} from '@/lib/editorTypes';
import { buildContainerBackgroundStyle } from '@/lib/containerBackground';

type CanvasProps = {
  tree: PageTree;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dx: number, dy: number) => void;
  onResize: (id: string, patch: Partial<EditorNode>) => void;
  onUpdateNode: (id: string, patch: Partial<EditorNode>) => void;
  zoom?: number;
};

const runAction = async (action?: ButtonAction | null, options: NodeProps = {}) => {
  if (!action) return;
  console.debug('runAction ausgeführt (Editor-Modus, keine Aktion):', action, options);
};

const BOUNDS = { w: 414, h: 896 } as const;
const DEFAULT_PAGE_BACKGROUND = 'linear-gradient(140deg,#0b0b0f,#111827)';
const DEFAULT_PAGE_BACKGROUND_COLOR = '#05070f';
const AI_CHAT_FALLBACK_BACKGROUND = 'linear-gradient(135deg,#0f172a,#020617,#000000)';
const CHAT_FALLBACK_BACKGROUND = 'linear-gradient(145deg,#0f172a,#111827,#020617)';

const NavbarWidget = ({ items, onItemClick }: { items: NavbarItem[]; onItemClick: (item: NavbarItem) => void }) => (
  <nav className="flex h-full flex-col justify-center rounded-xl border border-indigo-500/30 bg-[#0b0f1b]/90 px-4 py-3 text-sm text-neutral-200">
    <div className="flex flex-wrap gap-2">
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

const StatusBoardWidget = ({
  title,
  options,
  activeId,
  onSelect,
}: {
  title: string;
  options: StatusOption[];
  activeId: string | null;
  onSelect?: (id: string) => void;
}) => (
  <div className="h-full rounded-xl border border-cyan-500/40 bg-[#04121b] p-3 text-xs text-neutral-200">
    <div className="flex items-center justify-between">
      <span className="uppercase tracking-widest text-cyan-200/80">{title || 'Status'}</span>
      <span className="text-[11px] text-neutral-500">{options.length} Stati</span>
    </div>
    <div className="mt-3 flex flex-col gap-2">
      {options.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/15 px-3 py-2 text-[11px] text-neutral-400">
          Noch keine Statuswerte definiert.
        </div>
      ) : (
        options.map((option) => {
          const color = option.color ?? '#38bdf8';
          const isActive = option.id === activeId;
          return (
            <button
              key={option.id}
              type="button"
              className="flex w-full flex-col rounded-lg border px-3 py-2 text-left transition hover:bg-white/5"
              style={{
                borderColor: color,
                backgroundColor: isActive ? applyAlpha(color, 0.25) : 'transparent',
                color: '#e2e8f0',
              }}
              onClick={(event) => {
                event.stopPropagation();
                onSelect?.(option.id);
              }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{option.label}</span>
                <span className="text-[10px] uppercase tracking-widest" style={{ color: isActive ? '#bef264' : '#94a3b8' }}>
                  {isActive ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
              {option.description && (
                <span className="text-[11px] text-white/70">{option.description}</span>
              )}
            </button>
          );
        })
      )}
    </div>
    <p className="mt-3 text-[10px] text-neutral-500">Tipp: Klicke auf einen Status, um ihn zu aktivieren.</p>
  </div>
);

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

const TaskManagerWidget = ({
  title,
  tasks,
  onChange,
}: {
  title: string;
  tasks: TaskItem[];
  onChange: (tasks: TaskItem[]) => void;
}) => {
  const toggleTask = (id: string) => {
    onChange(tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  };

  const addTask = () => {
    const label = window.prompt('Neuen Task hinzufügen?')?.trim();
    if (!label) return;
    onChange([...tasks, { id: createId(), title: label, done: false }]);
  };

  return (
    <div className="h-full rounded-xl border border-emerald-500/30 bg-[#0b1f19] p-3 text-xs text-neutral-200">
      <div className="flex items-center justify-between">
        <span className="uppercase tracking-widest text-emerald-200/70">{title}</span>
        <button
          type="button"
          className="rounded bg-emerald-500/30 px-2 py-1 text-[10px] font-medium hover:bg-emerald-500/40"
          onClick={addTask}
          onMouseDown={(event) => event.stopPropagation()}
        >+ Aufgabe</button>
      </div>
      <div className="mt-3 space-y-2">
        {tasks.length === 0 ? (
          <div className="rounded border border-dashed border-white/10 px-3 py-2 text-neutral-400">Keine Aufgaben vorhanden.</div>
        ) : (
          tasks.map((task) => (
            <label
              key={task.id}
              className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-[11px] hover:bg-white/10"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <span className={`flex-1 ${task.done ? 'text-neutral-400 line-through' : ''}`}>{task.title}</span>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
                className="h-3 w-3"
                onMouseDown={(event) => event.stopPropagation()}
              />
            </label>
          ))
        )}
      </div>
    </div>
  );
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
      >Ticket erstellen</button>
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
  const startDayIndex = (firstDay.getDay() + 6) % 7; // Montag = 0
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
    <div className="flex h-full flex-col rounded-xl border border-orange-500/30 bg-[#21150b] p-3 text-xs text-neutral-100">
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
      <div className="mt-1 grid flex-1 grid-cols-7 gap-1 text-[11px] min-h-0">
        {weeks.map((week, idx) => (
          <React.Fragment key={`week-${idx}`}>
            {week.map((day, dayIdx) => (
              <div
                key={`day-${idx}-${dayIdx}`}
                className={`flex aspect-square items-center justify-center rounded ${day ? 'bg-white/5' : 'bg-white/5 text-neutral-700 opacity-40'}`}
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

type MapWidgetProps = {
  location: string;
  mode: MapMode;
  modeLabel?: string;
  info?: string;
  actionLabel?: string;
};

const MAP_MODE_VARIANTS: Record<MapMode, { badge: string; description: string; action: string; badgeClass: string; icon: string }> = {
  static: {
    badge: 'Standort',
    description: 'Zeigt einen festen Standort oder Treffpunkt an.',
    action: 'Route anzeigen',
    badgeClass: 'bg-sky-500/20 text-sky-100',
    icon: '📍',
  },
  'live-tracking': {
    badge: 'Live-Tracking',
    description: 'Position aktualisiert sich automatisch im Minutentakt.',
    action: 'Tracking öffnen',
    badgeClass: 'bg-emerald-500/20 text-emerald-100',
    icon: '🛰️',
  },
  'route-recording': {
    badge: 'Wegaufzeichnung',
    description: 'Zeichnet den gefahrenen Weg und Zwischenstopps auf.',
    action: 'Aufzeichnung starten',
    badgeClass: 'bg-amber-500/20 text-amber-100',
    icon: '🗺️',
  },
  geofence: {
    badge: 'Geofence',
    description: 'Überwacht definierte Zonen und meldet Abweichungen.',
    action: 'Zone überwachen',
    badgeClass: 'bg-rose-500/20 text-rose-100',
    icon: '📦',
  },
};

const MAP_MODE_VALUES: MapMode[] = ['static', 'live-tracking', 'route-recording', 'geofence'];

const normalizeMapMode = (value?: unknown): MapMode =>
  MAP_MODE_VALUES.includes(value as MapMode) ? (value as MapMode) : 'static';

const MapWidget = ({ location, mode, modeLabel, info, actionLabel }: MapWidgetProps) => {
  const encoded = encodeURIComponent(location);
  const variant = MAP_MODE_VARIANTS[mode] ?? MAP_MODE_VARIANTS.static;
  const badge = typeof modeLabel === 'string' && modeLabel.trim() ? modeLabel.trim() : variant.badge;
  const description = typeof info === 'string' && info.trim() ? info.trim() : variant.description;
  const buttonLabel = typeof actionLabel === 'string' && actionLabel.trim() ? actionLabel.trim() : variant.action;
  return (
    <div className="relative h-full overflow-hidden rounded-xl border border-cyan-500/40 bg-[#041820]">
      <iframe
        title={`Karte für ${location}`}
        src={`https://maps.google.com/maps?q=${encoded}&z=14&output=embed`}
        className="h-full w-full"
        loading="lazy"
        allowFullScreen
      />
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 text-xs text-white">
        <div>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] ${variant.badgeClass}`}>
            {variant.icon} {badge}
          </span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur">
          <div className="text-[11px] leading-relaxed text-slate-100">{description}</div>
          <div className="mt-2 text-[10px] text-cyan-100/80">📍 {location}</div>
          <button
            type="button"
            className="pointer-events-auto mt-3 w-full rounded-full border border-cyan-400/60 bg-cyan-500/20 py-1.5 text-[11px] font-semibold text-cyan-50 hover:bg-cyan-500/30"
            onMouseDown={(event) => event.stopPropagation()}
          >{buttonLabel}</button>
        </div>
      </div>
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
    const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
    return (
      <div className="relative h-full overflow-hidden rounded-xl border border-red-500/30 bg-black">
        {thumbnail ? (
          <img src={thumbnail} alt="YouTube Vorschau" className="h-full w-full object-cover opacity-70" draggable={false} />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-red-950 via-black to-red-950" />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 p-4 text-center text-xs text-neutral-100">
          <div className="text-lg">▶️</div>
          <div className="font-semibold">YouTube deaktiviert im Editor</div>
          <div className="text-[11px] text-neutral-300">Nutze die Vorschau, um das Video abzuspielen.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full place-items-center rounded-xl border border-red-500/30 bg-[#120808] p-3 text-center text-xs text-neutral-200">
      <div>
        Video wird im Preview-Modus abgespielt.
        <div className="mt-1 break-all text-[10px] text-neutral-500">{url}</div>
      </div>
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
      <div className="grid w-full max-w-[240px] grid-cols-3 gap-1">
        {board.map((cell, idx) => (
          <button
            key={idx}
            type="button"
            className="aspect-square w-full rounded bg-white/10 text-xl font-semibold hover:bg-white/20"
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

type GridPoint = { x: number; y: number };
type Direction = 'up' | 'down' | 'left' | 'right';

const SNAKE_BOARD_SIZE = 16;
const SNAKE_TICK_MS = 180;
const DIRECTION_VECTORS: Record<Direction, GridPoint> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const createInitialSnake = (): GridPoint[] => {
  const center = Math.floor(SNAKE_BOARD_SIZE / 2);
  return [
    { x: center + 1, y: center },
    { x: center, y: center },
    { x: center - 1, y: center },
  ];
};

const spawnFood = (occupied: GridPoint[]): GridPoint => {
  let attempt = 0;
  while (attempt < 500) {
    const candidate = {
      x: Math.floor(Math.random() * SNAKE_BOARD_SIZE),
      y: Math.floor(Math.random() * SNAKE_BOARD_SIZE),
    };
    if (!occupied.some((segment) => segment.x === candidate.x && segment.y === candidate.y)) {
      return candidate;
    }
    attempt += 1;
  }
  return { x: 0, y: 0 };
};

const SnakeWidget = () => {
  const [snake, setSnake] = useState<GridPoint[]>(() => createInitialSnake());
  const [direction, setDirection] = useState<Direction>('right');
  const [food, setFood] = useState<GridPoint>(() => spawnFood(createInitialSnake()));
  const [isRunning, setIsRunning] = useState(false);
  const [hasLost, setHasLost] = useState(false);
  const [score, setScore] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const directionRef = useRef(direction);
  const foodRef = useRef(food);

  const resetGame = useCallback(() => {
    const initialSnake = createInitialSnake();
    const initialFood = spawnFood(initialSnake);
    setSnake(initialSnake);
    setDirection('right');
    directionRef.current = 'right';
    setFood(initialFood);
    foodRef.current = initialFood;
    setScore(0);
    setHasLost(false);
  }, []);

  useEffect(() => {
    foodRef.current = food;
  }, [food]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setSnake((prev) => {
        const vector = DIRECTION_VECTORS[directionRef.current];
        const head = prev[0];
        const next = { x: head.x + vector.x, y: head.y + vector.y };
        const hitsWall =
          next.x < 0 ||
          next.x >= SNAKE_BOARD_SIZE ||
          next.y < 0 ||
          next.y >= SNAKE_BOARD_SIZE;
        const hitsSelf = prev.some((segment) => segment.x === next.x && segment.y === next.y);
        if (hitsWall || hitsSelf) {
          setHasLost(true);
          setIsRunning(false);
          return prev;
        }
        const grownSnake = [next, ...prev];
        if (next.x === foodRef.current.x && next.y === foodRef.current.y) {
          setScore((value) => value + 10);
          const nextFood = spawnFood(grownSnake);
          setFood(nextFood);
          foodRef.current = nextFood;
          return grownSnake;
        }
        grownSnake.pop();
        return grownSnake;
      });
    }, SNAKE_TICK_MS);
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(event.key)) {
        return;
      }
      event.preventDefault();
      const mapping: Record<string, Direction> = {
        ArrowUp: 'up',
        w: 'up',
        W: 'up',
        ArrowDown: 'down',
        s: 'down',
        S: 'down',
        ArrowLeft: 'left',
        a: 'left',
        A: 'left',
        ArrowRight: 'right',
        d: 'right',
        D: 'right',
      };
      const nextDirection = mapping[event.key];
      if (nextDirection && OPPOSITE_DIRECTION[directionRef.current] !== nextDirection) {
        setDirection(nextDirection);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const changeDirection = (next: Direction) => {
    if (OPPOSITE_DIRECTION[directionRef.current] === next) return;
    setDirection(next);
  };

  const startGame = () => {
    resetGame();
    setIsRunning(true);
  };

  const pauseGame = () => {
    setIsRunning(false);
  };

  const statusLabel = hasLost ? 'Kollision! Taste START für neuen Versuch.' : isRunning ? 'Läuft' : 'Bereit';

  const gridTemplate = useMemo(
    () => ({ gridTemplateColumns: `repeat(${SNAKE_BOARD_SIZE}, minmax(0, 1fr))` }),
    []
  );

  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-lime-500/30 bg-[#081207] p-3 text-lime-50">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-lime-300">
        <span>Snake 3210</span>
        <span>Score {score}</span>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[260px] rounded-2xl border border-lime-500/20 bg-[#030804] p-2">
          <div className="grid gap-[2px]" style={gridTemplate}>
            {Array.from({ length: SNAKE_BOARD_SIZE * SNAKE_BOARD_SIZE }).map((_, index) => {
              const x = index % SNAKE_BOARD_SIZE;
              const y = Math.floor(index / SNAKE_BOARD_SIZE);
              const isHead = snake[0].x === x && snake[0].y === y;
              const isBody = snake.some((segment, segmentIndex) => segmentIndex !== 0 && segment.x === x && segment.y === y);
              const isFood = food.x === x && food.y === y;
              let cellClass = 'bg-lime-900/20';
              if (isFood) cellClass = 'bg-amber-400';
              if (isBody) cellClass = 'bg-lime-500/60';
              if (isHead) cellClass = 'bg-lime-300';
              return <div key={`${x}-${y}`} className={`aspect-square rounded-sm ${cellClass}`} />;
            })}
          </div>
        </div>
      </div>
      <div className="text-[11px] text-lime-300/80">{statusLabel}</div>
      <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
        <button
          type="button"
          className="rounded bg-lime-500/30 py-1 text-lime-950 hover:bg-lime-500/50"
          onClick={startGame}
          onMouseDown={(event) => event.stopPropagation()}
        >Start</button>
        <button
          type="button"
          className="rounded bg-lime-500/10 py-1 text-lime-100 hover:bg-lime-500/20"
          onClick={pauseGame}
          onMouseDown={(event) => event.stopPropagation()}
        >Pause</button>
        <button
          type="button"
          className="rounded bg-lime-500/10 py-1 text-lime-100 hover:bg-lime-500/20"
          onClick={resetGame}
          onMouseDown={(event) => event.stopPropagation()}
        >Reset</button>
      </div>
      <div className="mx-auto grid w-32 grid-cols-3 gap-1 text-xs">
        <div />
        <button
          type="button"
          className="rounded bg-lime-500/20 py-1 hover:bg-lime-500/30"
          onClick={() => changeDirection('up')}
          onMouseDown={(event) => event.stopPropagation()}
        >▲</button>
        <div />
        <button
          type="button"
          className="rounded bg-lime-500/20 py-1 hover:bg-lime-500/30"
          onClick={() => changeDirection('left')}
          onMouseDown={(event) => event.stopPropagation()}
        >◀</button>
        <div />
        <button
          type="button"
          className="rounded bg-lime-500/20 py-1 hover:bg-lime-500/30"
          onClick={() => changeDirection('right')}
          onMouseDown={(event) => event.stopPropagation()}
        >▶</button>
        <div />
        <button
          type="button"
          className="rounded bg-lime-500/20 py-1 hover:bg-lime-500/30"
          onClick={() => changeDirection('down')}
          onMouseDown={(event) => event.stopPropagation()}
        >▼</button>
        <div />
      </div>
      <div className="text-[10px] text-lime-100/60">Steuerung: Pfeiltasten oder WASD – ganz wie auf dem Nokia 3210.</div>
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
      if (node.props?.component === 'ad-banner') {
        const badge = typeof node.props?.adBadge === 'string' && node.props.adBadge.trim() ? node.props.adBadge.trim() : 'Anzeige';
        const headline = typeof node.props?.adHeadline === 'string' && node.props.adHeadline.trim()
          ? node.props.adHeadline.trim()
          : 'Platziere dein Produkt zur besten Zeit';
        const description = typeof node.props?.adDescription === 'string' && node.props.adDescription.trim()
          ? node.props.adDescription.trim()
          : 'Buche Kampagnen, verfolge Ergebnisse in Echtzeit und überlasse die Optimierung unserer KI.';
        const subline = typeof node.props?.adSubline === 'string' && node.props.adSubline.trim() ? node.props.adSubline.trim() : 'Incl. AI-Optimierung & Reporting';
        const price = typeof node.props?.adPrice === 'string' && node.props.adPrice.trim() ? node.props.adPrice.trim() : 'Ab 49 € / Monat';
        const ctaLabel = typeof node.props?.adCtaLabel === 'string' && node.props.adCtaLabel.trim() ? node.props.adCtaLabel.trim() : node.props?.label ?? 'Jetzt buchen';
        const imageUrl = typeof node.props?.adImageUrl === 'string' && node.props.adImageUrl.trim()
          ? node.props.adImageUrl.trim()
          : 'https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&w=640&q=80';
        const cardBackground = node.props?.bg ?? 'linear-gradient(135deg,#0f172a,#1e1b4b)';
        const handleAdCta = async (event: React.MouseEvent<HTMLButtonElement>) => {
          event.stopPropagation();
          await runAction(node.props?.action, {
            target: node.props?.target,
            targetPage: node.props?.targetPage,
            url: node.props?.url,
          });
        };

        return (
          <div className={`${base} flex flex-col gap-3 rounded-2xl border border-amber-400/40 p-4 text-neutral-50`} style={{ background: cardBackground }}>
            <div className="text-[11px] uppercase tracking-[0.4em] text-amber-200">{badge}</div>
            <div className="text-xl font-semibold leading-snug">{headline}</div>
            <p className="text-sm text-amber-50/80">{description}</p>
            <div className="rounded-xl border border-white/10 bg-black/20 p-2 text-[11px] text-neutral-300">{subline}</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-neutral-400">Paket</div>
                <div className="text-lg font-semibold text-white">{price}</div>
              </div>
              <button
                type="button"
                onClick={handleAdCta}
                onMouseDown={(event) => event.stopPropagation()}
                className="rounded-full bg-white/90 px-4 py-1.5 text-sm font-semibold text-black transition hover:bg-white"
              >{ctaLabel}</button>
            </div>
            <div className="relative h-20 overflow-hidden rounded-xl border border-white/10 bg-black/30">
              <img src={imageUrl} alt="Werbemotiv" className="absolute inset-0 h-full w-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
            </div>
          </div>
        );
      }

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

      const buttonStyle: React.CSSProperties = {
        ...(node.style as React.CSSProperties | undefined),
        width: '100%',
        height: '100%',
      };

      return (
        <button
          type="button"
          onClick={handleButtonClick}
          className={`${base} flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 text-sm font-medium hover:bg-white/20`}
          style={buttonStyle}
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
      const wrapperStyle = (node.style ?? {}) as React.CSSProperties;
      return (
        <div
          className={`${base} rounded-md border border-white/15 bg-neutral-800/80`}
          style={{
            ...wrapperStyle,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
          data-editor-canvas-field="true"
        >
          <input
            type={inputType}
            className="block h-full w-full flex-1 rounded-md bg-transparent px-3 py-2 text-sm text-white placeholder:text-neutral-400 focus-visible:outline-none select-text"
            placeholder={node.props?.placeholder ?? 'Eingabe'}
            style={{ height: '100%', minHeight: '100%' }}
            data-editor-canvas-field="true"
          />
        </div>
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

      if (component === 'status-board') {
        const board = ensureStatusBoard(node.props?.statusBoard);
        return (
          <StatusBoardWidget
            title={board.title}
            options={board.options}
            activeId={board.activeId}
            onSelect={(nextId) =>
              onUpdate({
                props: {
                  ...node.props,
                  statusBoard: { ...board, activeId: nextId },
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
        const mode = normalizeMapMode(node.props?.mapMode);
        return (
          <MapWidget
            location={location}
            mode={mode}
            modeLabel={typeof node.props?.mapModeLabel === 'string' ? node.props.mapModeLabel : undefined}
            info={typeof node.props?.mapInfo === 'string' ? node.props.mapInfo : undefined}
            actionLabel={typeof node.props?.mapActionLabel === 'string' ? node.props.mapActionLabel : undefined}
          />
        );
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
        const backgroundStyle = buildContainerBackgroundStyle(node.props, AI_CHAT_FALLBACK_BACKGROUND);
        return (
          <div
            className={`${base} flex flex-col gap-2 rounded-xl border border-emerald-500/40 p-3 text-neutral-200 shadow-inner`}
            style={backgroundStyle}
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
        const backgroundStyle = buildContainerBackgroundStyle(node.props, CHAT_FALLBACK_BACKGROUND);
        return (
          <div className={`${base} grid place-items-center rounded-xl border border-emerald-500/30 text-xs text-emerald-400`} style={backgroundStyle}>
            💬 Chatfenster (Demo)
          </div>
        );
      }

      if (component === 'qr-code') {
        const qrUrl = typeof node.props?.qrUrl === 'string' && node.props.qrUrl.trim()
          ? node.props.qrUrl.trim()
          : window.location.href;
        const qrBackgroundColor = typeof node.props?.qrBackgroundColor === 'string' && node.props.qrBackgroundColor.trim()
          ? node.props.qrBackgroundColor.trim()
          : '#020617';
        const qrImageOverride = typeof node.props?.qrImageOverride === 'string' && node.props.qrImageOverride.trim()
          ? node.props.qrImageOverride.trim()
          : null;
        const generatedQr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;
        const qrImage = qrImageOverride ?? generatedQr;
        return (
          <div
            className={`${base} flex flex-col items-center justify-center gap-3 rounded-xl border border-blue-500/30 p-4 text-xs text-blue-100`}
            style={{ backgroundColor: qrBackgroundColor }}
          >
            <div className="rounded-2xl bg-white/95 p-3 shadow-inner">
              <img src={qrImage} alt={`QR-Code für ${qrUrl}`} className="h-32 w-32 object-contain" />
            </div>
            <div className="text-center text-[10px] text-blue-100/80 break-all">Scanne: {qrUrl}</div>
            {qrImageOverride && (
              <div className="text-[10px] uppercase tracking-[0.3em] text-blue-200">Eigenes QR-Bild</div>
            )}
          </div>
        );
      }

      if (component === 'analytics') {
        const metrics = ensureAnalyticsMetrics(node.props?.analyticsMetrics);
        const highlight = typeof node.props?.analyticsHighlight === 'string' && node.props.analyticsHighlight.trim()
          ? node.props.analyticsHighlight.trim()
          : metrics.length > 0
            ? `Top-KPI: ${metrics[0].label}`
            : 'Noch keine Kennzahlen hinterlegt.';
        const gridTemplateColumns = `repeat(${Math.min(2, Math.max(1, metrics.length))}, minmax(0, 1fr))`;
        return (
          <div className={`${base} rounded-xl border border-sky-500/30 bg-[#06121f] p-3 text-xs text-neutral-200`}>
            <div className="font-semibold text-sky-200">Analytics Dashboard</div>
            <div className="mt-2 space-y-2 text-[11px]">
              <div className="grid gap-2" style={{ gridTemplateColumns }}>
                {metrics.map((metric) => (
                  <div key={metric.id} className="rounded-lg bg-white/5 p-2">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-sky-100/60">{metric.label}</div>
                    <div className="text-lg font-semibold text-white">{metric.value}</div>
                    {metric.description && <div className="text-[10px] text-neutral-400">{metric.description}</div>}
                  </div>
                ))}
              </div>
              {highlight && (
                <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 px-3 py-2 text-[11px] text-sky-100">
                  {highlight}
                </div>
              )}
            </div>
          </div>
        );
      }

      if (component === 'avatar-creator') {
        const traits = ensureAvatarTraits(node.props?.avatarTraits);
        const actions = ensureAvatarActions(node.props?.avatarActions);
        const avatarTitle = typeof node.props?.avatarTitle === 'string' && node.props.avatarTitle.trim()
          ? node.props.avatarTitle.trim()
          : 'AI Avatar erstellen';
        const avatarDescription = typeof node.props?.avatarDescription === 'string' && node.props.avatarDescription.trim()
          ? node.props.avatarDescription.trim()
          : 'Passe Gesicht, Outfit und Stimmung mit wenigen Klicks an.';
        const accentColor = sanitizeHexColor(node.props?.avatarAccentColor, '#f472b6');
        const backgroundColor = typeof node.props?.avatarBackgroundColor === 'string' && node.props.avatarBackgroundColor.trim()
          ? node.props.avatarBackgroundColor.trim()
          : '#1a0f1f';
        const previewUrl = typeof node.props?.avatarPreviewUrl === 'string' && node.props.avatarPreviewUrl.trim()
          ? node.props.avatarPreviewUrl.trim()
          : '';
        const previewImage = previewUrl || 'https://placehold.co/160x160/1a0f1f/f9a8d4?text=AI';

        return (
          <div
            className={`${base} flex flex-col gap-3 rounded-2xl border border-fuchsia-500/30 p-4 text-xs text-fuchsia-100`}
            style={{ background: backgroundColor }}
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="h-28 w-28 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                    <img src={previewImage} alt={avatarTitle} className="h-full w-full object-cover" />
                  </div>
                  <div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white"
                    style={{ color: accentColor }}
                  >
                    KI
                  </div>
                </div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-fuchsia-100/70">Live Vorschau</div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="text-[10px] uppercase tracking-[0.35em]" style={{ color: accentColor }}>
                  Avatar-Studio
                </div>
                <div className="text-base font-semibold text-white">{avatarTitle}</div>
                <div className="text-[11px] leading-5 text-fuchsia-100/80">{avatarDescription}</div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {traits.length === 0 ? (
                    <span className="rounded-full border border-dashed border-white/25 px-2 py-1 text-[11px] text-neutral-200">
                      Hinterlege Eigenschaften im Panel
                    </span>
                  ) : (
                    traits.map((trait) => (
                      <span
                        key={trait.id}
                        className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-white"
                      >
                        {trait.icon && <span>{trait.icon}</span>}
                        <span className="text-fuchsia-100/80">{trait.label}:</span>
                        <span className="font-semibold text-white">{trait.value}</span>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {actions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/20 px-3 py-2 text-[11px] text-neutral-200">
                  Füge Aktionen hinzu, um Buttons zu zeigen.
                </div>
              ) : (
                actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    className="flex flex-col gap-1 rounded-xl border px-3 py-2 text-left text-white transition hover:bg-white/10"
                    style={{ borderColor: action.accent ?? accentColor }}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <span className="text-sm font-semibold leading-tight">
                      {action.icon ? `${action.icon} ${action.label}` : action.label}
                    </span>
                    {action.description && (
                      <span className="text-[11px] text-fuchsia-100/80">{action.description}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        );
      }

      if (component === 'table') {
        const table = ensureTableConfig(node.props?.tableConfig);
        const columnTemplate = `repeat(${Math.max(1, table.columns.length)}, minmax(0, 1fr))`;
        return (
          <div className={`${base} rounded-xl border border-yellow-500/30 bg-[#221f0b] p-3 text-xs text-neutral-200`}>
            <div className="text-sm font-semibold text-yellow-200">{table.title}</div>
            <div className="mt-2 space-y-2 text-[11px]">
              <div className="grid gap-2 font-semibold" style={{ gridTemplateColumns: columnTemplate }}>
                {table.columns.map((column) => (
                  <div key={column.id}>{column.label}</div>
                ))}
              </div>
              {table.rows.length === 0 ? (
                <div className="rounded border border-dashed border-white/10 px-3 py-2 text-neutral-400">Noch keine Tabellenzeilen hinterlegt.</div>
              ) : (
                table.rows.map((row) => (
                  <div
                    key={row.id}
                    className="grid gap-2 rounded-lg bg-white/5 px-2 py-1"
                    style={{ gridTemplateColumns: columnTemplate }}
                  >
                    {table.columns.map((column, index) => (
                      <div key={`${row.id}-${column.id}`} className="truncate text-neutral-100">
                        {row.values[index] ?? '—'}
                      </div>
                    ))}
                  </div>
                ))
              )}
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

export default function Canvas({ tree, selectedId, onSelect, onRemove, onMove, onResize, onUpdateNode, zoom = 1 }: CanvasProps) {
  type ResizeDir = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';
  const dragging = useRef<null | { id: string; pointerId: number; startX: number; startY: number; zoom: number }>(null);
  const resizing = useRef<null | { id: string; pointerId: number; dir: ResizeDir; startX: number; startY: number; start: { x: number; y: number; w: number; h: number }; zoom: number }>(null);
  const clampedZoom = Math.max(0.5, zoom);

  const beginDrag = (event: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    dragging.current = { id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, zoom: clampedZoom };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onSelect(id);
  };

  const beginResize = (event: React.PointerEvent<HTMLDivElement>, node: EditorNode, dir: ResizeDir) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    resizing.current = {
      id: node.id,
      dir,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      start: { x: node.x ?? 0, y: node.y ?? 0, w: node.w ?? 120, h: node.h ?? 40 },
      zoom: clampedZoom,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const processPointerMove = useCallback(
    (pointerId: number, clientX: number, clientY: number, preventDefault?: () => void) => {
      if (resizing.current && pointerId === resizing.current.pointerId) {
        preventDefault?.();
        const { id, dir, startX, startY, start, zoom: resizeZoom } = resizing.current;
        const scale = resizeZoom || 1;
        const dx = (clientX - startX) / scale;
        const dy = (clientY - startY) / scale;
      const minW = 40;
      const minH = 32;
      const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
      if (dir === 'se') {
        const minDx = minW - start.w;
        const maxDx = BOUNDS.w - (start.x + start.w);
        const nextDx = clamp(dx, minDx, maxDx);
        const minDy = minH - start.h;
        const maxDy = BOUNDS.h - (start.y + start.h);
        const nextDy = clamp(dy, minDy, maxDy);
        const w = Math.max(minW, Math.min(start.w + nextDx, BOUNDS.w - start.x));
        const h = Math.max(minH, Math.min(start.h + nextDy, BOUNDS.h - start.y));
        onResize(id, { w, h });
      } else if (dir === 's') {
        const minDy = minH - start.h;
        const maxDy = BOUNDS.h - (start.y + start.h);
        const nextDy = clamp(dy, minDy, maxDy);
        const h = Math.max(minH, Math.min(start.h + nextDy, BOUNDS.h - start.y));
        onResize(id, { h });
      } else if (dir === 'ne') {
        const minDx = minW - start.w;
        const maxDx = BOUNDS.w - (start.x + start.w);
        const nextDx = clamp(dx, minDx, maxDx);
        const minDy = -start.y;
        const maxDy = start.h - minH;
        const nextDy = clamp(dy, minDy, maxDy);
        const w = Math.max(minW, Math.min(start.w + nextDx, BOUNDS.w - start.x));
        const y = start.y + nextDy;
        const h = Math.max(minH, Math.min(start.h - nextDy, (start.y + start.h) - y));
        onResize(id, { y, w, h });
      } else if (dir === 'n') {
        const minDy = -start.y;
        const maxDy = start.h - minH;
        const nextDy = clamp(dy, minDy, maxDy);
        const y = start.y + nextDy;
        const h = Math.max(minH, Math.min(start.h - nextDy, (start.y + start.h) - y));
        onResize(id, { y, h });
      } else if (dir === 'sw') {
        const minDx = -start.x;
        const maxDx = start.w - minW;
        const nextDx = clamp(dx, minDx, maxDx);
        const minDy = minH - start.h;
        const maxDy = BOUNDS.h - (start.y + start.h);
        const nextDy = clamp(dy, minDy, maxDy);
        const x = start.x + nextDx;
        const w = Math.max(minW, Math.min(start.w - nextDx, (start.x + start.w) - x));
        const h = Math.max(minH, Math.min(start.h + nextDy, BOUNDS.h - start.y));
        onResize(id, { x, w, h });
      } else if (dir === 'nw') {
        const minDx = -start.x;
        const maxDx = start.w - minW;
        const nextDx = clamp(dx, minDx, maxDx);
        const minDy = -start.y;
        const maxDy = start.h - minH;
        const nextDy = clamp(dy, minDy, maxDy);
        const x = start.x + nextDx;
        const y = start.y + nextDy;
        const w = Math.max(minW, Math.min(start.w - nextDx, (start.x + start.w) - x));
        const h = Math.max(minH, Math.min(start.h - nextDy, (start.y + start.h) - y));
        onResize(id, { x, y, w, h });
      } else if (dir === 'e') {
        const minDx = minW - start.w;
        const maxDx = BOUNDS.w - (start.x + start.w);
        const nextDx = clamp(dx, minDx, maxDx);
        const w = Math.max(minW, Math.min(start.w + nextDx, BOUNDS.w - start.x));
        onResize(id, { w });
      } else if (dir === 'w') {
        const minDx = -start.x;
        const maxDx = start.w - minW;
        const nextDx = clamp(dx, minDx, maxDx);
        const x = start.x + nextDx;
        const w = Math.max(minW, Math.min(start.w - nextDx, (start.x + start.w) - x));
        onResize(id, { x, w });
      }
      return;
    }
      if (dragging.current && pointerId === dragging.current.pointerId) {
        preventDefault?.();
        const { id, startX, startY, zoom: dragZoom } = dragging.current;
        const scale = dragZoom || 1;
        const dx = (clientX - startX) / scale;
        const dy = (clientY - startY) / scale;
      if (dx !== 0 || dy !== 0) {
        onMove(id, dx, dy);
          dragging.current = { id, pointerId, startX: clientX, startY: clientY, zoom: dragZoom };
      }
    }
    },
    [onMove, onResize]
  );

  const processPointerUp = useCallback((pointerId: number) => {
    if (dragging.current?.pointerId === pointerId) {
      dragging.current = null;
    }
    if (resizing.current?.pointerId === pointerId) {
      resizing.current = null;
    }
  }, []);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    processPointerMove(event.pointerId, event.clientX, event.clientY, () => event.preventDefault());
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    processPointerUp(event.pointerId);
  };

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!dragging.current && !resizing.current) return;
      processPointerMove(event.pointerId, event.clientX, event.clientY, () => event.preventDefault());
    };
    const onUp = (event: PointerEvent) => {
      if (!dragging.current && !resizing.current) return;
      processPointerUp(event.pointerId);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [processPointerMove, processPointerUp]);

  const hasCustomBackground = typeof tree.tree.props?.bg === 'string' && tree.tree.props.bg.trim() !== '';
  const backgroundValue = hasCustomBackground ? (tree.tree.props!.bg as string) : DEFAULT_PAGE_BACKGROUND;
  const rootBackgroundColor = typeof tree.tree.props?.bgColor === 'string' && tree.tree.props.bgColor.trim() !== ''
    ? tree.tree.props.bgColor
    : DEFAULT_PAGE_BACKGROUND_COLOR;

  return (
    <div
      className="relative mx-auto flex h-full w-full items-start justify-center overflow-auto p-6"
      onPointerDown={(event) => {
        if (event.currentTarget === event.target) onSelect(null);
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') handlePointerUp(event);
      }}
    >
      <div
        className="relative shrink-0"
        style={{
          width: BOUNDS.w,
          height: BOUNDS.h,
          transform: `scale(${clampedZoom})`,
          transformOrigin: 'top center',
        }}
      >
        <div
          className="relative h-full w-full overflow-hidden rounded-[36px] border border-neutral-800 shadow-2xl"
          style={{ background: backgroundValue, backgroundColor: rootBackgroundColor }}
          onPointerDown={(event) => {
            if (event.currentTarget === event.target) onSelect(null);
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
            touchAction: 'none',
          };
          const nodeOpacity = typeof n.props?.opacity === 'number' && Number.isFinite(n.props.opacity)
            ? Math.min(1, Math.max(0.05, n.props.opacity))
            : 1;
          const isSel = n.id === selectedId;
          return (
            <div key={n.id} style={style} className="group" onPointerDown={(event) => beginDrag(event, n.id)}>
              <div style={{ opacity: nodeOpacity }}>
                <RenderNode
                  node={n}
                  onUpdate={(patch) => onUpdateNode(n.id, patch)}
                />
              </div>
              {isSel && <div className="absolute inset-0 ring-2 ring-emerald-400/70 rounded-md pointer-events-none" />}
              {isSel && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(n.id);
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    className="absolute -right-4 -top-4 z-50 grid place-items-center w-7 h-7 rounded-full bg-rose-600 text-white text-sm shadow-lg border border-white/40"
                    title="Element löschen"
                  >
                    ×
                  </button>
                  {/* Resize Handles */}
                  <div
                    onPointerDown={(event) => beginResize(event, n, 'nw')}
                    className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-emerald-400 rounded-sm cursor-nwse-resize touch-none"
                  />
                  <div
                    onPointerDown={(event) => beginResize(event, n, 'n')}
                    className="absolute left-1/2 top-[-6px] h-3 w-3 -translate-x-1/2 bg-emerald-400 rounded-sm cursor-ns-resize touch-none"
                  />
                  <div
                    onPointerDown={(event) => beginResize(event, n, 'ne')}
                    className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-emerald-400 rounded-sm cursor-nesw-resize touch-none"
                  />
                  <div
                    onPointerDown={(event) => beginResize(event, n, 'e')}
                    className="absolute right-[-6px] top-1/2 h-3 w-3 -translate-y-1/2 bg-emerald-400 rounded-sm cursor-ew-resize touch-none"
                  />
                  <div
                    onPointerDown={(event) => beginResize(event, n, 'se')}
                    className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-emerald-400 rounded-sm cursor-nwse-resize touch-none"
                  />
                  <div
                    onPointerDown={(event) => beginResize(event, n, 's')}
                    className="absolute left-1/2 bottom-[-6px] h-3 w-3 -translate-x-1/2 bg-emerald-400 rounded-sm cursor-ns-resize touch-none"
                  />
                  <div
                    onPointerDown={(event) => beginResize(event, n, 'sw')}
                    className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-emerald-400 rounded-sm cursor-nesw-resize touch-none"
                  />
                  <div
                    onPointerDown={(event) => beginResize(event, n, 'w')}
                    className="absolute left-[-6px] top-1/2 h-3 w-3 -translate-y-1/2 bg-emerald-400 rounded-sm cursor-ew-resize touch-none"
                  />
                </>
              )}
            </div>
          );
        })}
        </div>
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

type StatusBoardData = {
  title: string;
  activeId: string | null;
  options: StatusOption[];
};

const STATUS_COLOR_CYCLE = ['#22c55e', '#facc15', '#f97316', '#ef4444', '#a855f7', '#0ea5e9'];
const STATUS_PRESETS: Array<Omit<StatusOption, 'id'>> = [
  { label: 'Verfügbar', color: '#22c55e', description: 'Direkt einsatzbereit' },
  { label: 'Gebucht', color: '#f97316', description: 'Für Kund:innen reserviert' },
  { label: 'Offen', color: '#0ea5e9', description: 'Wartet auf Bestätigung' },
];

function ensureStatusBoard(board?: NodeProps['statusBoard'] | null): StatusBoardData {
  const rawOptions = Array.isArray(board?.options) && board?.options.length > 0
    ? board.options
    : STATUS_PRESETS.map((preset) => ({ ...preset, id: createId() }));
  const normalized = rawOptions.map((option, index) => ({
    id: typeof option?.id === 'string' ? option.id : createId(),
    label: typeof option?.label === 'string' && option.label.trim() ? option.label.trim() : `Status ${index + 1}`,
    description: typeof option?.description === 'string' && option.description.trim() ? option.description.trim() : undefined,
    color:
      typeof option?.color === 'string' && option.color.trim()
        ? option.color
        : STATUS_COLOR_CYCLE[index % STATUS_COLOR_CYCLE.length],
  }));
  const title = typeof board?.title === 'string' && board.title.trim() ? board.title.trim() : 'Status';
  const activeCandidate = typeof board?.activeId === 'string' ? board?.activeId : null;
  const activeId = normalized.some((option) => option.id === activeCandidate)
    ? activeCandidate
    : normalized[0]?.id ?? null;
  return {
    title,
    activeId,
    options: normalized,
  };
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

const ANALYTICS_METRIC_PRESETS: Array<Omit<AnalyticsMetric, 'id'>> = [
  { label: 'Visits', value: '1.204', description: 'letzte 24h' },
  { label: 'Conversion', value: '3,4%', description: '+0,6% vs. Vortag' },
];

function ensureAnalyticsMetrics(metrics?: AnalyticsMetric[] | null): AnalyticsMetric[] {
  if (!Array.isArray(metrics) || metrics.length === 0) {
    return ANALYTICS_METRIC_PRESETS.map((preset) => ({ ...preset, id: createId() }));
  }
  return metrics.map((metric, index) => ({
    id: typeof metric?.id === 'string' ? metric.id : createId(),
    label: typeof metric?.label === 'string' && metric.label.trim() ? metric.label.trim() : `Kennzahl ${index + 1}`,
    value: typeof metric?.value === 'string' && metric.value.trim() ? metric.value.trim() : '—',
    description: typeof metric?.description === 'string' && metric.description.trim() ? metric.description.trim() : undefined,
  }));
}

const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const AVATAR_TRAIT_PRESETS: Array<Omit<AvatarTrait, 'id'>> = [
  { label: 'Mood', value: 'Focused', icon: '🧠' },
  { label: 'Stil', value: 'Neon Street', icon: '✨' },
  { label: 'Outfit', value: 'Tech Wear', icon: '🧥' },
];
const AVATAR_ACTION_PRESETS: Array<Omit<AvatarAction, 'id'>> = [
  { label: 'Zufall generieren', description: 'KI mixt neue Gesichtszüge', icon: '🎲', accent: '#f472b6' },
  { label: 'Outfit wechseln', description: 'Wähle Presets & Farben', icon: '🧢', accent: '#c084fc' },
];
const AVATAR_ACCENT_CYCLE = ['#f472b6', '#c084fc', '#38bdf8', '#fbbf24'];

function sanitizeHexColor(candidate: unknown, fallback: string) {
  if (typeof candidate === 'string' && HEX_COLOR_REGEX.test(candidate.trim())) {
    return candidate.trim();
  }
  return fallback;
}

function ensureAvatarTraits(traits?: AvatarTrait[] | null): AvatarTrait[] {
  if (!Array.isArray(traits) || traits.length === 0) {
    return AVATAR_TRAIT_PRESETS.map((preset) => ({ ...preset, id: createId() }));
  }
  return traits.map((trait, index) => ({
    id: typeof trait?.id === 'string' ? trait.id : createId(),
    label: typeof trait?.label === 'string' && trait.label.trim() ? trait.label.trim() : `Eigenschaft ${index + 1}`,
    value: typeof trait?.value === 'string' && trait.value.trim() ? trait.value.trim() : '—',
    icon: typeof trait?.icon === 'string' && trait.icon.trim() ? trait.icon.trim() : undefined,
  }));
}

function ensureAvatarActions(actions?: AvatarAction[] | null): AvatarAction[] {
  if (!Array.isArray(actions) || actions.length === 0) {
    return AVATAR_ACTION_PRESETS.map((preset) => ({ ...preset, id: createId() }));
  }
  return actions.map((action, index) => ({
    id: typeof action?.id === 'string' ? action.id : createId(),
    label: typeof action?.label === 'string' && action.label.trim() ? action.label.trim() : `Aktion ${index + 1}`,
    description: typeof action?.description === 'string' && action.description.trim() ? action.description.trim() : undefined,
    icon: typeof action?.icon === 'string' && action.icon.trim() ? action.icon.trim() : undefined,
    accent:
      typeof action?.accent === 'string' && HEX_COLOR_REGEX.test(action.accent.trim())
        ? action.accent.trim()
        : AVATAR_ACCENT_CYCLE[index % AVATAR_ACCENT_CYCLE.length],
  }));
}

const TABLE_COLUMN_PRESET = ['Name', 'Rolle', 'Status'];
const TABLE_ROW_PRESET = [
  ['Alex', 'Design', '✅ Online'],
  ['Sam', 'Engineering', '🟡 beschäftigt'],
];

function ensureTableConfig(config?: TableConfig | null): TableConfig {
  const columns = Array.isArray(config?.columns) && config.columns.length > 0
    ? config.columns.map((column, index) => ({
        id: typeof column?.id === 'string' ? column.id : createId(),
        label: typeof column?.label === 'string' && column.label.trim() ? column.label.trim() : `Spalte ${index + 1}`,
      }))
    : TABLE_COLUMN_PRESET.map((label) => ({ id: createId(), label }));
  const columnCount = Math.max(1, columns.length);
  const rows = Array.isArray(config?.rows) && config.rows.length > 0
    ? config.rows.map((row) => ({
        id: typeof row?.id === 'string' ? row.id : createId(),
        values: Array.isArray(row?.values) && row.values.length > 0
          ? columns.map((_, index) => (typeof row.values?.[index] === 'string' ? row.values[index] : ''))
          : Array.from({ length: columnCount }, () => ''),
      }))
    : TABLE_ROW_PRESET.map((preset) => ({
        id: createId(),
        values: columns.map((_, index) => preset[index] ?? ''),
      }));
  const title = typeof config?.title === 'string' && config.title.trim() ? config.title.trim() : 'Team Übersicht';
  return {
    title,
    columns,
    rows,
  };
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

function applyAlpha(color: string, alpha: number) {
  if (typeof color !== 'string' || !color.startsWith('#')) return color;
  const hex = color.slice(1);
  if (![3, 6].includes(hex.length)) return color;
  const normalized = hex.length === 3 ? hex.split('').map((char) => char + char).join('') : hex;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((value) => Number.isNaN(value))) return color;
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
}