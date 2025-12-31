// path: src/app/editor/_components/PropertiesPanel.tsx
'use client';

import React, { useMemo, useRef, useState } from 'react';
import type {
  Node as EditorNode,
  NodeProps,
  NodeStyle,
  NavbarItem,
  TimeEntry,
  StatusOption,
  BackgroundLayer,
  DropdownOption,
  TaskItem,
  FolderNode,
  SupportTicket,
  AnalyticsMetric,
  TableConfig,
  NewsItem,
  MapMode,
  AvatarTrait,
  AvatarAction,
} from '@/lib/editorTypes';

const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const FALLBACK_COLOR = '#0f172a';

const createNavId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const createStatusId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const createTimeEntryId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const createDropdownOptionId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const createGenericId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const STATUS_PRESETS: StatusOption[] = [
  { id: createStatusId(), label: 'Neu', color: '#0EA5E9', description: 'Frisch reingekommen' },
  { id: createStatusId(), label: 'In Arbeit', color: '#A855F7', description: 'Gerade in Bearbeitung' },
  { id: createStatusId(), label: 'Feedback', color: '#F97316', description: 'Wartet auf Feedback' },
  { id: createStatusId(), label: 'Freigegeben', color: '#22C55E', description: 'Bereit zum Launch' },
];

const STATUS_COLOR_CYCLE = ['#0EA5E9', '#A855F7', '#F97316', '#22C55E', '#14B8A6', '#FACC15'];

const BUTTON_ICON_PRESETS = [
  { id: 'none', value: '', label: 'Kein Icon' },
  { id: 'sparkles', value: '✨', label: '✨ Sparkles' },
  { id: 'rocket', value: '🚀', label: '🚀 Launch' },
  { id: 'camera', value: '📷', label: '📷 Kamera' },
  { id: 'sun', value: '☀️', label: '☀️ Sonne' },
  { id: 'moon', value: '🌙', label: '🌙 Mond' },
  { id: 'chat', value: '💬', label: '💬 Chat' },
  { id: 'heart', value: '❤️', label: '❤️ Herz' },
  { id: 'check', value: '✅', label: '✅ Bestätigen' },
  { id: 'cart', value: '🛒', label: '🛒 Kaufen' },
];

const NAV_ICON_PRESETS = [
  { id: 'none', value: '', label: 'Kein Icon' },
  { id: 'home', value: '🏠', label: '🏠 Home' },
  { id: 'dashboard', value: '📊', label: '📊 Dashboard' },
  { id: 'chat', value: '💬', label: '💬 Chat' },
  { id: 'phone', value: '📞', label: '📞 Kontakt' },
  { id: 'star', value: '⭐', label: '⭐ Highlight' },
];

const POSITION_KEYWORDS_X = {
  left: 0,
  center: 50,
  right: 100,
} as const;

const POSITION_KEYWORDS_Y = {
  top: 0,
  center: 50,
  bottom: 100,
} as const;

const POSITION_DEFAULT = 'center';
const SIZE_DEFAULT = 'cover';

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));
const clampLayerSize = (value: number) => Math.min(300, Math.max(20, value));
const clampOpacityValue = (value: number) => Math.min(1, Math.max(0.05, value));

const CANVAS_FRAME = { width: 414, height: 896 } as const;

const tokenToPercent = (token: string | undefined, axis: 'x' | 'y'): number => {
  if (!token) return 50;
  const normalized = token.trim().toLowerCase();
  const map = axis === 'x' ? POSITION_KEYWORDS_X : POSITION_KEYWORDS_Y;
  if (normalized in map) {
    return map[normalized as keyof typeof map];
  }
  if (normalized.endsWith('%')) {
    const value = Number.parseFloat(normalized.replace('%', ''));
    if (Number.isFinite(value)) return clampPercent(value);
  }
  return 50;
};

const PERCENT_TOLERANCE = 5;

const percentToToken = (value: number, axis: 'x' | 'y'): string => {
  const map = axis === 'x' ? POSITION_KEYWORDS_X : POSITION_KEYWORDS_Y;
  const clamped = clampPercent(Math.round(value));
  for (const [keyword, percent] of Object.entries(map)) {
    if (Math.abs(percent - clamped) <= PERCENT_TOLERANCE) {
      return keyword;
    }
  }
  return `${clamped}%`;
};

type StatusBoardState = {
  title: string;
  activeId: string | null;
  options: StatusOption[];
};

const normalizeStatusBoard = (raw?: unknown): StatusBoardState => {
  const board = (raw as NodeProps['statusBoard']) ?? undefined;
  const source = Array.isArray(board?.options) && board?.options.length > 0
    ? board?.options
    : STATUS_PRESETS.map((preset) => ({ ...preset, id: createStatusId() }));
  const options = source.map((option, index) => ({
    id: typeof option?.id === 'string' ? option.id : createStatusId(),
    label: typeof option?.label === 'string' && option.label.trim() ? option.label.trim() : `Status ${index + 1}`,
    description: typeof option?.description === 'string' && option.description.trim() ? option.description.trim() : undefined,
    color:
      typeof option?.color === 'string' && option.color.trim()
        ? option.color
        : STATUS_COLOR_CYCLE[index % STATUS_COLOR_CYCLE.length],
  }));
  const title = typeof board?.title === 'string' && board.title.trim() ? board.title.trim() : 'Status';
  const candidate = typeof board?.activeId === 'string' ? board.activeId : null;
  const activeId = options.some((option) => option.id === candidate)
    ? candidate
    : options[0]?.id ?? null;
  return {
    title,
    activeId,
    options,
  };
};

const NAV_DEFAULTS: Array<Omit<NavbarItem, 'id'>> = [
  { label: 'Dashboard', action: 'navigate', target: '#dashboard' },
  { label: 'Kontakt', action: 'navigate', target: '#contact' },
];

const DROPDOWN_DEFAULTS: Array<Omit<DropdownOption, 'id'>> = [
  { label: 'Profil', action: 'navigate', target: '#profil' },
  { label: 'Einstellungen', action: 'navigate', target: '#settings' },
  { label: 'Logout', action: 'logout' },
];

const normalizeNavItems = (items?: unknown): NavbarItem[] => {
  if (Array.isArray(items) && items.length > 0) {
    return items.map((raw) => ({
      id: typeof raw?.id === 'string' ? raw.id : createNavId(),
      label:
        typeof raw?.label === 'string' && raw.label.trim().length > 0
          ? raw.label.trim()
          : 'Navigation',
      action: (raw?.action as NavbarItem['action']) ?? 'navigate',
      target: typeof raw?.target === 'string' ? raw.target : undefined,
      targetPage: typeof raw?.targetPage === 'string' ? raw.targetPage : undefined,
      url: typeof raw?.url === 'string' ? raw.url : undefined,
      icon: typeof raw?.icon === 'string' ? raw.icon : undefined,
    }));
  }
  return NAV_DEFAULTS.map((item) => ({ ...item, id: createNavId() }));
};

const normalizeDropdownOptions = (items?: unknown): DropdownOption[] => {
  if (Array.isArray(items) && items.length > 0) {
    return items.map((raw, index) => ({
      id: typeof raw?.id === 'string' ? raw.id : createDropdownOptionId(),
      label:
        typeof raw?.label === 'string' && raw.label.trim().length > 0
          ? raw.label.trim()
          : `Option ${index + 1}`,
      action: (raw?.action as DropdownOption['action']) ?? 'navigate',
      target: typeof raw?.target === 'string' ? raw.target : undefined,
      targetPage: typeof raw?.targetPage === 'string' ? raw.targetPage : undefined,
      url: typeof raw?.url === 'string' ? raw.url : undefined,
      icon: typeof raw?.icon === 'string' ? raw.icon : undefined,
    }));
  }
  return DROPDOWN_DEFAULTS.map((item, index) => ({ ...item, id: createDropdownOptionId(), label: item.label ?? `Option ${index + 1}` }));
};

const createDefaultTimeEntries = (): TimeEntry[] => {
  const now = new Date();
  const minutes = (mins: number) => new Date(now.getTime() - mins * 60 * 1000).toISOString();
  return [
    {
      id: createTimeEntryId(),
      label: 'Projekt Alpha',
      seconds: 3600,
      startedAt: minutes(90),
      endedAt: minutes(30),
    },
    {
      id: createTimeEntryId(),
      label: 'Projekt Beta',
      seconds: 2700,
      startedAt: minutes(45),
    },
  ];
};

const normalizeTimeEntries = (entries?: unknown): TimeEntry[] => {
  if (Array.isArray(entries) && entries.length > 0) {
    return entries.map((raw) => ({
      id: typeof raw?.id === 'string' ? raw.id : createTimeEntryId(),
      label:
        typeof raw?.label === 'string' && raw.label.trim().length > 0
          ? raw.label.trim()
          : 'Task',
      seconds: typeof raw?.seconds === 'number' && Number.isFinite(raw.seconds) ? Math.max(0, raw.seconds) : 0,
      startedAt: typeof raw?.startedAt === 'string' ? raw.startedAt : undefined,
      endedAt: typeof raw?.endedAt === 'string' ? raw.endedAt : undefined,
    }));
  }
  return createDefaultTimeEntries();
};

type FolderPreset = {
  id: string;
  name: string;
  children: Array<{ id: string; name: string }>;
};

const FOLDER_PRESETS = [
  { name: 'Vertrieb', children: ['Leads', 'Kampagnen'] },
  { name: 'Marketing', children: ['Assets'] },
];

const normalizeFolderPresets = (tree?: unknown): FolderPreset[] => {
  if (Array.isArray(tree)) {
    return (tree as FolderNode[]).map((node, index) => ({
      id: typeof node?.id === 'string' ? node.id : createGenericId(),
      name: typeof node?.name === 'string' && node.name.trim() ? node.name.trim() : `Ordner ${index + 1}`,
      children: Array.isArray(node?.children)
        ? node.children!.map((child, childIndex) => ({
            id: typeof child?.id === 'string' ? child.id : createGenericId(),
            name:
              typeof child?.name === 'string' && child.name.trim()
                ? child.name.trim()
                : `Unterordner ${childIndex + 1}`,
          }))
        : [],
    }));
  }
  return FOLDER_PRESETS.map((preset, index) => ({
    id: createGenericId(),
    name: preset.name ?? `Ordner ${index + 1}`,
    children: (preset.children ?? []).map((childName, childIndex) => ({
      id: createGenericId(),
      name: childName ?? `Unterordner ${childIndex + 1}`,
    })),
  }));
};

const folderPresetsToTree = (presets: FolderPreset[]): FolderNode[] =>
  presets.map((preset) => ({
    id: preset.id,
    name: preset.name,
    children: preset.children.map((child) => ({ id: child.id, name: child.name })),
  }));

const TASK_PRESETS: Array<Omit<TaskItem, 'id'>> = [
  { title: 'Kickoff vorbereiten', done: false },
  { title: 'UX-Wireframes', done: true },
];

const normalizeTaskItems = (items?: unknown): TaskItem[] => {
  if (Array.isArray(items)) {
    return (items as TaskItem[]).map((task, index) => ({
      id: typeof task?.id === 'string' ? task.id : createGenericId(),
      title: typeof task?.title === 'string' && task.title.trim() ? task.title.trim() : `Aufgabe ${index + 1}`,
      done: Boolean(task?.done),
      assignee: typeof task?.assignee === 'string' ? task.assignee : undefined,
    }));
  }
  return TASK_PRESETS.map((preset, index) => ({
    id: createGenericId(),
    title: preset.title ?? `Aufgabe ${index + 1}`,
    done: Boolean(preset.done),
  }));
};

const SUPPORT_TICKET_PRESETS: Array<Omit<SupportTicket, 'id'>> = [
  { subject: 'Login Problem', message: 'Kundin meldet fehlgeschlagene 2FA.' },
];

const normalizeSupportTickets = (tickets?: unknown): SupportTicket[] => {
  if (Array.isArray(tickets)) {
    return (tickets as SupportTicket[]).map((ticket, index) => ({
      id: typeof ticket?.id === 'string' ? ticket.id : createGenericId(),
      subject: typeof ticket?.subject === 'string' && ticket.subject.trim() ? ticket.subject.trim() : `Ticket ${index + 1}`,
      message: typeof ticket?.message === 'string' ? ticket.message : '',
      createdAt: typeof ticket?.createdAt === 'string' ? ticket.createdAt : undefined,
      channel: typeof ticket?.channel === 'string' ? ticket.channel : undefined,
    }));
  }
  return SUPPORT_TICKET_PRESETS.map((preset, index) => ({
    id: createGenericId(),
    subject: preset.subject ?? `Ticket ${index + 1}`,
    message: preset.message,
    createdAt: new Date().toISOString(),
    channel: preset.channel,
  }));
};

const ANALYTICS_PRESET_METRICS: Array<Omit<AnalyticsMetric, 'id'>> = [
  { label: 'Visits', value: '1.204', description: 'letzte 24h' },
  { label: 'Conversion', value: '3,4%', description: '+0,6% vs. Vortag' },
];

const normalizeAnalyticsMetrics = (metrics?: unknown): AnalyticsMetric[] => {
  if (Array.isArray(metrics)) {
    return (metrics as AnalyticsMetric[]).map((metric, index) => ({
      id: typeof metric?.id === 'string' ? metric.id : createGenericId(),
      label: typeof metric?.label === 'string' && metric.label.trim() ? metric.label.trim() : `Kennzahl ${index + 1}`,
      value: typeof metric?.value === 'string' && metric.value.trim() ? metric.value.trim() : '—',
      description: typeof metric?.description === 'string' && metric.description.trim() ? metric.description.trim() : undefined,
    }));
  }
  return ANALYTICS_PRESET_METRICS.map((preset, index) => ({
    id: createGenericId(),
    label: preset.label ?? `Kennzahl ${index + 1}`,
    value: preset.value ?? '—',
    description: preset.description,
  }));
};

const TABLE_COLUMN_PRESET = ['Name', 'Rolle', 'Status'];
const TABLE_ROW_PRESET = [
  ['Alex', 'Design', '✅ Online'],
  ['Sam', 'Engineering', '🟡 beschäftigt'],
];

const normalizeTableConfig = (config?: unknown): TableConfig => {
  const raw = (config as TableConfig) ?? undefined;
  const columnsSource = Array.isArray(raw?.columns) && raw?.columns.length > 0 ? raw.columns : TABLE_COLUMN_PRESET.map((label) => ({ id: createGenericId(), label }));
  const columns = columnsSource.map((column, index) => ({
    id: typeof column?.id === 'string' ? column.id : createGenericId(),
    label: typeof column?.label === 'string' && column.label.trim() ? column.label.trim() : `Spalte ${index + 1}`,
  }));
  const columnCount = Math.max(1, columns.length);
  const rowsSource = Array.isArray(raw?.rows) && raw?.rows.length > 0
    ? raw.rows
    : TABLE_ROW_PRESET.map((values) => ({ id: createGenericId(), values }));
  const rows = rowsSource.map((row) => ({
    id: typeof row?.id === 'string' ? row.id : createGenericId(),
    values: columns.map((_, index) => {
      const value = row?.values?.[index];
      return typeof value === 'string' ? value : '';
    }),
  }));
  const title = typeof raw?.title === 'string' && raw.title.trim() ? raw.title.trim() : 'Team Übersicht';
  return {
    title,
    columns,
    rows,
  };
};

const NEWS_ITEM_PRESETS: Array<Omit<NewsItem, 'id'>> = [
  {
    title: 'Willkommen im News-Bereich',
    body: 'Hier kannst du interne Updates und Hinweise veröffentlichen. Bilder lassen sich per URL verlinken.',
    imageUrl: 'https://placehold.co/600x360/0b0b0f/f1f5f9?text=News',
    date: new Date().toISOString(),
  },
];

type NormalizedNewsFeed = {
  title: string;
  items: NewsItem[];
};

const normalizeNewsFeed = (feed?: unknown): NormalizedNewsFeed => {
  const raw = (feed as { title?: unknown; items?: unknown }) ?? undefined;
  const title = typeof raw?.title === 'string' && raw.title.trim() ? raw.title.trim() : 'News';
  const itemsSource = Array.isArray(raw?.items) ? (raw.items as unknown[]) : null;
  const items = (itemsSource ?? NEWS_ITEM_PRESETS).map((candidate, index) => {
    const item = (candidate as Partial<NewsItem>) ?? {};
    return {
      id: typeof item.id === 'string' ? item.id : createGenericId(),
      title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : `Eintrag ${index + 1}`,
      body: typeof item.body === 'string' ? item.body : undefined,
      imageUrl: typeof item.imageUrl === 'string' && item.imageUrl.trim() ? item.imageUrl.trim() : undefined,
      date: typeof item.date === 'string' && item.date.trim() ? item.date.trim() : undefined,
    };
  });
  return { title, items };
};

const AVATAR_TRAIT_PRESETS: Array<Omit<AvatarTrait, 'id'>> = [
  { label: 'Mood', value: 'Focused', icon: '🧠' },
  { label: 'Style', value: 'Neon', icon: '✨' },
  { label: 'Outfit', value: 'Streetwear', icon: '🧥' },
];

const AVATAR_ACTION_PRESETS: Array<Omit<AvatarAction, 'id'>> = [
  { label: 'Zufall generieren', description: 'Neue Gesichtszüge & Licht', icon: '🎲', accent: '#f472b6' },
  { label: 'Outfit wechseln', description: 'Cycle zwischen Presets', icon: '🧢', accent: '#c084fc' },
];

const normalizeAvatarTraits = (traits?: unknown): AvatarTrait[] => {
  if (Array.isArray(traits)) {
    return (traits as AvatarTrait[]).map((trait, index) => ({
      id: typeof trait?.id === 'string' ? trait.id : createGenericId(),
      label: typeof trait?.label === 'string' && trait.label.trim() ? trait.label.trim() : `Eigenschaft ${index + 1}`,
      value: typeof trait?.value === 'string' && trait.value.trim() ? trait.value.trim() : '—',
      icon: typeof trait?.icon === 'string' ? trait.icon : undefined,
    }));
  }
  return AVATAR_TRAIT_PRESETS.map((preset, index) => ({
    id: createGenericId(),
    label: preset.label ?? `Eigenschaft ${index + 1}`,
    value: preset.value ?? '—',
    icon: preset.icon,
  }));
};

const normalizeAvatarActions = (actions?: unknown): AvatarAction[] => {
  if (Array.isArray(actions)) {
    return (actions as AvatarAction[]).map((action, index) => ({
      id: typeof action?.id === 'string' ? action.id : createGenericId(),
      label: typeof action?.label === 'string' && action.label.trim() ? action.label.trim() : `Aktion ${index + 1}`,
      description: typeof action?.description === 'string' ? action.description : undefined,
      icon: typeof action?.icon === 'string' ? action.icon : undefined,
      accent: typeof action?.accent === 'string' ? action.accent : undefined,
    }));
  }
  return AVATAR_ACTION_PRESETS.map((preset, index) => ({
    id: createGenericId(),
    label: preset.label ?? `Aktion ${index + 1}`,
    description: preset.description,
    icon: preset.icon,
    accent: preset.accent,
  }));
};

const buildGridTemplate = (columns: number) => `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`;

const MAP_MODE_OPTIONS: Array<{ value: MapMode; label: string; description: string; action: string }> = [
  { value: 'static', label: 'Standort', description: 'Fester Pin oder Treffpunkt, perfekt für Kontaktseiten.', action: 'Route anzeigen' },
  { value: 'live-tracking', label: 'Live-Tracking', description: 'Aktualisiert Position automatisch (z. B. Kurier, Service-Team).', action: 'Tracking öffnen' },
  { value: 'route-recording', label: 'Wegaufzeichnung', description: 'Hebt gefahrene Routen oder Lieferwege hervor.', action: 'Aufzeichnung starten' },
  { value: 'geofence', label: 'Geofence', description: 'Überwacht definierte Zonen und löst Warnungen aus.', action: 'Zone überwachen' },
];

const MAP_MODE_VALUES: MapMode[] = MAP_MODE_OPTIONS.map((option) => option.value);

const normalizeMapModeValue = (value?: unknown): MapMode =>
  MAP_MODE_VALUES.includes(value as MapMode) ? (value as MapMode) : 'static';

const toDateTimeLocal = (iso?: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const fromDateTimeLocal = (value: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

type ParsedBackgroundImage = {
  url: string;
  positionX: string;
  positionY: string;
  size: string;
};

const sanitizeBackgroundUrl = (token: string): string => {
  const trimmed = token.trim();
  if (trimmed.startsWith('url(')) {
    return trimmed;
  }
  const escaped = trimmed.replace(/"/g, '\\"');
  return `url("${escaped}")`;
};

const buildBackgroundImage = ({ url, positionX, positionY, size }: ParsedBackgroundImage) => {
  const safeUrl = sanitizeBackgroundUrl(url);
  const safeX = positionX?.trim() || POSITION_DEFAULT;
  const safeY = positionY?.trim() || POSITION_DEFAULT;
  const safeSize = size?.trim() || SIZE_DEFAULT;
  return `${safeUrl} ${safeX} ${safeY} / ${safeSize} no-repeat`;
};

const parseBackgroundImage = (value?: string): ParsedBackgroundImage | null => {
  if (!value) return null;
  const urlMatch = value.match(/url\([^)]*\)/i);
  if (!urlMatch) return null;
  const url = urlMatch[0];
  const rest = value.slice((urlMatch.index ?? 0) + urlMatch[0].length).trim();
  let positionX: string = POSITION_DEFAULT;
  let positionY: string = POSITION_DEFAULT;
  let size: string = SIZE_DEFAULT;

  if (rest) {
    const [positionPart, sizePart] = rest.split('/');
    if (positionPart) {
      const tokens = positionPart.trim().split(/\s+/).filter(Boolean);
      if (tokens.length === 1) {
        positionX = tokens[0];
        positionY = tokens[0];
      } else if (tokens.length >= 2) {
        positionX = tokens[0];
        positionY = tokens[1];
      }
    }
    if (sizePart) {
      const sizeToken = sizePart.trim().split(/\s+/)[0];
      if (sizeToken) {
        size = sizeToken;
      }
    }
  }

  return { url, positionX, positionY, size };
};

interface PropertiesPanelProps {
  node: EditorNode | null;
  onUpdate: (patch: Partial<EditorNode>) => void;
  onGenerateBackground: (prompt: string) => void;
  onChangeBackground: (value: string) => void;
  onResetBackground: () => void;
  pageBackground: string;
  pageBackgroundColor: string;
  onChangeBackgroundColor: (color: string) => void;
  backgroundLayers: BackgroundLayer[];
  onChangeBackgroundLayers: (layers: BackgroundLayer[]) => void;
  backgroundSyncEnabled: boolean;
  onToggleBackgroundSync: (value: boolean) => void;
}

export default function PropertiesPanel({
  node,
  onUpdate,
  onGenerateBackground,
  onChangeBackground,
  onResetBackground,
  pageBackground,
  pageBackgroundColor,
  onChangeBackgroundColor,
  backgroundLayers,
  onChangeBackgroundLayers,
  backgroundSyncEnabled,
  onToggleBackgroundSync,
}: PropertiesPanelProps) {
  const imageFileInput = useRef<HTMLInputElement | null>(null);
  const backgroundFileInput = useRef<HTMLInputElement | null>(null);
  const backgroundLayerInput = useRef<HTMLInputElement | null>(null);
  const containerBackgroundFileInput = useRef<HTMLInputElement | null>(null);
  const qrImageFileInput = useRef<HTMLInputElement | null>(null);
  const buttonIconInputRef = useRef<HTMLInputElement | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [backgroundSectionOpen, setBackgroundSectionOpen] = useState(false);
  const isNavbarContainer = node?.type === 'container' && node.props?.component === 'navbar';
  const isTimeTrackingContainer = node?.type === 'container' && node.props?.component === 'time-tracking';
  const isStatusBoardContainer = node?.type === 'container' && node.props?.component === 'status-board';
  const isChatContainer = node?.type === 'container' && node.props?.component === 'chat';
  const isChatBackgroundContainer = node?.type === 'container' && (node.props?.component === 'ai-chat' || node.props?.component === 'chat');
  const isQrContainer = node?.type === 'container' && node.props?.component === 'qr-code';
  const isButtonSelected = node?.type === 'button';
  const isAdButton = node?.type === 'button' && node.props?.component === 'ad-banner';
  const isDropdownButton = node?.type === 'button' && node.props?.component === 'dropdown';
  const isMapContainer = node?.type === 'container' && node.props?.component === 'map';
  const isFolderStructureContainer = node?.type === 'container' && node.props?.component === 'folder-structure';
  const isTaskManagerContainer = node?.type === 'container' && node.props?.component === 'task-manager';
  const isTodoContainer = node?.type === 'container' && node.props?.component === 'todo';
  const isAnalyticsContainer = node?.type === 'container' && node.props?.component === 'analytics';
  const isSupportContainer = node?.type === 'container' && node.props?.component === 'support';
  const isTableContainer = node?.type === 'container' && node.props?.component === 'table';
  const isNewsContainer = node?.type === 'container' && node.props?.component === 'news';
  const isAvatarCreator = node?.type === 'container' && node.props?.component === 'avatar-creator';
  const showPageBackgroundControls = !isButtonSelected;
  const normalizedBackgroundColor = HEX_COLOR_REGEX.test(pageBackgroundColor.trim())
    ? pageBackgroundColor.trim()
    : FALLBACK_COLOR;
  const parsedLegacyBackground = useMemo(() => parseBackgroundImage(pageBackground), [pageBackground]);
  const hasLegacyImageBackground = Boolean(parsedLegacyBackground);
  const backgroundSizeToken = parsedLegacyBackground?.size ?? SIZE_DEFAULT;
  const backgroundPosXPercent = parsedLegacyBackground
    ? tokenToPercent(parsedLegacyBackground.positionX, 'x')
    : 50;
  const backgroundPosYPercent = parsedLegacyBackground
    ? tokenToPercent(parsedLegacyBackground.positionY, 'y')
    : 50;
  const sizeNumeric = Number.parseFloat(backgroundSizeToken);
  const imageScalePercent = Number.isFinite(sizeNumeric) ? Math.min(200, Math.max(50, sizeNumeric)) : 100;
  const buttonIconPresetSelection = useMemo(() => {
    const value = typeof node?.props?.icon === 'string' ? node.props.icon : '';
    const preset = BUTTON_ICON_PRESETS.find((candidate) => candidate.value === value);
    if (preset) return preset.id;
    return value ? 'custom' : 'none';
  }, [node?.props?.icon]);

  const navItems = useMemo(
    () => (isNavbarContainer ? normalizeNavItems(node?.props?.navItems) : []),
    [isNavbarContainer, node?.props?.navItems]
  );
  const dropdownOptions = useMemo(
    () => (isDropdownButton ? normalizeDropdownOptions(node?.props?.dropdownOptions) : []),
    [isDropdownButton, node?.props?.dropdownOptions]
  );
  const timeEntries = useMemo(
    () => (isTimeTrackingContainer ? normalizeTimeEntries(node?.props?.timeTracking?.entries) : []),
    [isTimeTrackingContainer, node?.props?.timeTracking?.entries]
  );
  const statusBoardState = useMemo(
    () => (isStatusBoardContainer ? normalizeStatusBoard(node?.props?.statusBoard) : null),
    [isStatusBoardContainer, node?.props?.statusBoard]
  );
  const folderPresets = useMemo(
    () => (isFolderStructureContainer ? normalizeFolderPresets(node?.props?.folderTree) : []),
    [isFolderStructureContainer, node?.props?.folderTree]
  );
  const taskManagerItems = useMemo(
    () => (isTaskManagerContainer ? normalizeTaskItems(node?.props?.tasks) : []),
    [isTaskManagerContainer, node?.props?.tasks]
  );
  const todoItems = useMemo(
    () => (isTodoContainer ? normalizeTaskItems(node?.props?.todoItems) : []),
    [isTodoContainer, node?.props?.todoItems]
  );
  const analyticsMetrics = useMemo(
    () => (isAnalyticsContainer ? normalizeAnalyticsMetrics(node?.props?.analyticsMetrics) : []),
    [isAnalyticsContainer, node?.props?.analyticsMetrics]
  );
  const analyticsHighlightValue = isAnalyticsContainer && typeof node?.props?.analyticsHighlight === 'string'
    ? node.props.analyticsHighlight
    : '';
  const supportTickets = useMemo(
    () => (isSupportContainer ? normalizeSupportTickets(node?.props?.supportTickets) : []),
    [isSupportContainer, node?.props?.supportTickets]
  );
  const supportChannelValue = isSupportContainer && typeof node?.props?.supportChannel === 'string'
    ? node.props.supportChannel
    : 'ticket';
  const supportTargetValue = isSupportContainer && typeof node?.props?.supportTarget === 'string'
    ? node.props.supportTarget
    : '';
  const tableConfig = useMemo(
    () => (isTableContainer ? normalizeTableConfig(node?.props?.tableConfig) : null),
    [isTableContainer, node?.props?.tableConfig]
  );
  const newsFeed = useMemo(
    () => (isNewsContainer ? normalizeNewsFeed(node?.props?.newsFeed) : null),
    [isNewsContainer, node?.props?.newsFeed]
  );
  const mapModeValue = useMemo(
    () => (isMapContainer ? normalizeMapModeValue(node?.props?.mapMode) : 'static'),
    [isMapContainer, node?.props?.mapMode]
  );
  const selectedMapMode = MAP_MODE_OPTIONS.find((option) => option.value === mapModeValue);
  const mapLocationValue = isMapContainer && typeof node?.props?.mapLocation === 'string' ? node.props.mapLocation : '';
  const mapModeLabelValue = isMapContainer && typeof node?.props?.mapModeLabel === 'string' ? node.props.mapModeLabel : '';
  const mapInfoValue = isMapContainer && typeof node?.props?.mapInfo === 'string' ? node.props.mapInfo : '';
  const mapActionLabelValue = isMapContainer && typeof node?.props?.mapActionLabel === 'string' ? node.props.mapActionLabel : '';
  const avatarTraits = useMemo(
    () => (isAvatarCreator ? normalizeAvatarTraits(node?.props?.avatarTraits) : []),
    [isAvatarCreator, node?.props?.avatarTraits]
  );
  const avatarActions = useMemo(
    () => (isAvatarCreator ? normalizeAvatarActions(node?.props?.avatarActions) : []),
    [isAvatarCreator, node?.props?.avatarActions]
  );
  const avatarTitleValue = isAvatarCreator && typeof node?.props?.avatarTitle === 'string' ? node.props.avatarTitle : '';
  const avatarDescriptionValue = isAvatarCreator && typeof node?.props?.avatarDescription === 'string' ? node.props.avatarDescription : '';
  const avatarPreviewUrlValue = isAvatarCreator && typeof node?.props?.avatarPreviewUrl === 'string' ? node.props.avatarPreviewUrl : '';
  const nodeOpacityValue = node
    ? clampOpacityValue(
        typeof node.props?.opacity === 'number' && Number.isFinite(node.props.opacity) ? node.props.opacity : 1
      )
    : 1;
  const nodeOpacityPercent = Math.round(nodeOpacityValue * 100);
  const chatBackgroundColorValue = isChatBackgroundContainer
    ? (typeof node?.props?.containerBgColor === 'string' && node.props.containerBgColor.trim()
      ? node.props.containerBgColor.trim()
      : '#020617')
    : '#020617';
  const chatBackgroundColorInputValue = typeof node?.props?.containerBgColor === 'string' ? node.props.containerBgColor : '';
  const chatBackgroundImageUrl = isChatBackgroundContainer && typeof node?.props?.containerBgImageUrl === 'string' && node.props.containerBgImageUrl.trim()
    ? node.props.containerBgImageUrl.trim()
    : '';
  const chatBackgroundPosX = isChatBackgroundContainer && typeof node?.props?.containerBgImagePosX === 'number'
    ? clampPercent(node.props.containerBgImagePosX)
    : 50;
  const chatBackgroundPosY = isChatBackgroundContainer && typeof node?.props?.containerBgImagePosY === 'number'
    ? clampPercent(node.props.containerBgImagePosY)
    : 50;
  const chatBackgroundSize = isChatBackgroundContainer && typeof node?.props?.containerBgImageSize === 'number'
    ? clampLayerSize(node.props.containerBgImageSize)
    : 100;
  const chatBackgroundPreviewStyle = useMemo(() => {
    if (!isChatBackgroundContainer) return undefined;
    if (!chatBackgroundImageUrl) {
      return { background: chatBackgroundColorValue } as React.CSSProperties;
    }
    return {
      backgroundColor: chatBackgroundColorValue,
      backgroundImage: `url(${chatBackgroundImageUrl})`,
      backgroundSize: `${chatBackgroundSize}%`,
      backgroundPosition: `${chatBackgroundPosX}% ${chatBackgroundPosY}%`,
      backgroundRepeat: 'no-repeat',
    } as React.CSSProperties;
  }, [chatBackgroundColorValue, chatBackgroundImageUrl, chatBackgroundPosX, chatBackgroundPosY, chatBackgroundSize, isChatBackgroundContainer]);
  const chatBackgroundImageActive = Boolean(chatBackgroundImageUrl);
  const chatShowFirstName = isChatContainer ? node?.props?.chatShowFirstName !== false : true;
  const chatShowLastName = isChatContainer ? node?.props?.chatShowLastName === true : false;
  const chatTextColor = isChatContainer && typeof node?.props?.chatTextColor === 'string' && node.props.chatTextColor.trim()
    ? node.props.chatTextColor.trim()
    : '#e5e7eb';
  const qrBackgroundColorValue = isQrContainer
    ? (typeof node?.props?.qrBackgroundColor === 'string' && node.props.qrBackgroundColor?.trim()
      ? node.props.qrBackgroundColor.trim()
      : '#020617')
    : '#020617';
  const qrBackgroundColorInputValue = typeof node?.props?.qrBackgroundColor === 'string' ? node.props.qrBackgroundColor : '';
  const qrUrlValue = isQrContainer && typeof node?.props?.qrUrl === 'string' ? node.props.qrUrl : '';
  const qrImageOverrideValue = isQrContainer && typeof node?.props?.qrImageOverride === 'string' ? node.props.qrImageOverride : '';
  const qrGeneratedImage = qrUrlValue?.trim()
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrlValue.trim())}`
    : '';
  const qrPreviewImage = qrImageOverrideValue?.trim()
    ? qrImageOverrideValue.trim()
    : qrGeneratedImage || 'https://placehold.co/200x200/0f172a/ffffff?text=QR';
  const qrHasCustomImage = Boolean(qrImageOverrideValue?.trim());
  const avatarAccentColorValue = isAvatarCreator
    ? (typeof node?.props?.avatarAccentColor === 'string' && node.props.avatarAccentColor.trim()
      ? node.props.avatarAccentColor.trim()
      : '#f472b6')
    : '#f472b6';
  const avatarAccentColorInputValue = isAvatarCreator && typeof node?.props?.avatarAccentColor === 'string'
    ? node.props.avatarAccentColor
    : '';
  const avatarBackgroundColorValue = isAvatarCreator
    ? (typeof node?.props?.avatarBackgroundColor === 'string' && node.props.avatarBackgroundColor.trim()
      ? node.props.avatarBackgroundColor.trim()
      : '#1a0f1f')
    : '#1a0f1f';
  const avatarBackgroundColorInputValue = isAvatarCreator && typeof node?.props?.avatarBackgroundColor === 'string'
    ? node.props.avatarBackgroundColor
    : '';

  const setFrame = (key: 'x' | 'y' | 'w' | 'h', value: number) => {
    if (!node) return;
    if (!Number.isFinite(value)) return;
    onUpdate({ [key]: Math.round(value) } as Partial<EditorNode>);
  };

  const alignNodePreset = (preset: 'left-middle' | 'center' | 'right-middle' | 'top-middle' | 'bottom-middle') => {
    if (!node) return;
    const width = Math.max(0, Math.round(node.w ?? 120));
    const height = Math.max(0, Math.round(node.h ?? 40));
    const maxX = Math.max(0, CANVAS_FRAME.width - width);
    const maxY = Math.max(0, CANVAS_FRAME.height - height);
    const centerX = Math.round(maxX / 2);
    const centerY = Math.round(maxY / 2);

    if (preset === 'left-middle') {
      onUpdate({ x: 0, y: centerY });
      return;
    }
    if (preset === 'center') {
      onUpdate({ x: centerX, y: centerY });
      return;
    }
    if (preset === 'right-middle') {
      onUpdate({ x: maxX, y: centerY });
      return;
    }
    if (preset === 'top-middle') {
      onUpdate({ x: centerX, y: 0 });
      return;
    }
    onUpdate({ x: centerX, y: maxY });
  };

  const setStyle = (patch: Partial<NodeStyle>) => {
    if (!node) return;
    const nextStyle: NodeStyle = { ...(node.style ?? {}), ...patch };
    onUpdate({ style: nextStyle });
  };

  const setProps = (patch: Partial<NodeProps>) => {
    if (!node) return;
    const nextProps: NodeProps = { ...(node.props ?? {}), ...patch };
    onUpdate({ props: nextProps });
  };

  const handleOpacityUpdate = (percent: number) => {
    if (!node) return;
    const clampedPercent = clampPercent(Number.isFinite(percent) ? percent : 100);
    const normalized = clampOpacityValue(clampedPercent / 100);
    const nextValue = normalized >= 0.995 ? undefined : normalized;
    setProps({ opacity: nextValue });
  };

  const handleImageFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProps({ src: reader.result, originalFileName: file.name });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const promptContainerGradient = () => {
    const background = window.prompt('Beschreibe den gewünschten Container-Hintergrund oder gib CSS ein.');
    if (!background) return;
    setProps({ bg: background });
  };

  const promptImage = async () => {
    const description = window.prompt('Welches Motiv soll das Bild zeigen? Beispiel: "modernes Team im Chat"');
    if (!description) return;
    setImageLoading(true);
    setImageError(null);
    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: description }),
      });
      const data = (await response.json().catch(() => ({}))) as { dataUrl?: string; error?: string };
      if (!response.ok) {
        throw new Error(typeof data?.error === 'string' ? data.error : 'Der Bildgenerator antwortet nicht.');
      }
      if (!data.dataUrl) {
        throw new Error('Der Bildgenerator lieferte keine Daten.');
      }
      setProps({ src: data.dataUrl, originalFileName: `ai-image-${Date.now()}.png`, aiPrompt: description });
    } catch (error) {
      console.error('KI Bildgenerator fehlgeschlagen', error);
      setImageError(error instanceof Error ? error.message : 'Unbekannter Fehler beim KI Bildgenerator.');
    } finally {
      setImageLoading(false);
    }
  };

  const askForPageGradient = () => {
    const description = window.prompt('Wie soll der Seitenhintergrund aussehen?');
    if (!description) return;
    onGenerateBackground(description);
  };

  const handleBackgroundFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        const url = `url("${dataUrl}")`;
        onChangeBackground(
          buildBackgroundImage({
            url,
            positionX: POSITION_DEFAULT,
            positionY: POSITION_DEFAULT,
            size: SIZE_DEFAULT,
          })
        );
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const applyColorOnlyBackground = () => {
    onChangeBackground('');
    onChangeBackgroundLayers([]);
  };

  const handleContainerBackgroundFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProps({
          containerBgImageUrl: reader.result,
          containerBgImagePosX: 50,
          containerBgImagePosY: 50,
          containerBgImageSize: 100,
        });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleQrImageFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProps({ qrImageOverride: reader.result });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const updateLegacyBackground = (patch: Partial<ParsedBackgroundImage>) => {
    if (!parsedLegacyBackground) return;
    const next: ParsedBackgroundImage = {
      url: parsedLegacyBackground.url,
      positionX: parsedLegacyBackground.positionX,
      positionY: parsedLegacyBackground.positionY,
      size: parsedLegacyBackground.size,
      ...patch,
    };
    onChangeBackground(buildBackgroundImage(next));
  };

  const handleBackgroundScaleChange = (value: number) => {
    if (!parsedLegacyBackground) return;
    const clamped = Math.min(200, Math.max(50, value));
    updateLegacyBackground({ size: `${clamped}%` });
  };

  const updateBackgroundSizeToken = (token: string) => {
    if (!parsedLegacyBackground) return;
    updateLegacyBackground({ size: token });
  };

  const handleBackgroundPositionChange = (axis: 'x' | 'y', value: number) => {
    if (!parsedLegacyBackground) return;
    const token = percentToToken(value, axis);
    updateLegacyBackground(axis === 'x' ? { positionX: token } : { positionY: token });
  };

  const applyPositionPreset = (xPercent: number, yPercent: number) => {
    if (!parsedLegacyBackground) return;
    updateLegacyBackground({
      positionX: percentToToken(xPercent, 'x'),
      positionY: percentToToken(yPercent, 'y'),
    });
  };

  const addBackgroundLayer = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const layer: BackgroundLayer = {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2),
      url: trimmed,
      positionX: 50,
      positionY: 50,
      size: 100,
    };
    onChangeBackgroundLayers([...backgroundLayers, layer]);
  };

  const handleBackgroundLayerFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        addBackgroundLayer(reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleAddLayerFromUrl = () => {
    const url = window.prompt('Bild-URL für den Layer eingeben');
    if (!url) return;
    addBackgroundLayer(url);
  };

  const updateBackgroundLayer = (id: string, patch: Partial<BackgroundLayer>) => {
    onChangeBackgroundLayers(
      backgroundLayers.map((layer) =>
        layer.id === id
          ? {
              ...layer,
              ...patch,
              positionX: typeof patch.positionX === 'number' ? clampPercent(patch.positionX) : layer.positionX,
              positionY: typeof patch.positionY === 'number' ? clampPercent(patch.positionY) : layer.positionY,
              size: typeof patch.size === 'number' ? clampLayerSize(patch.size) : layer.size,
            }
          : layer
      )
    );
  };

  const moveBackgroundLayer = (id: string, direction: 'up' | 'down') => {
    const index = backgroundLayers.findIndex((layer) => layer.id === id);
    if (index === -1) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= backgroundLayers.length) return;
    const next = [...backgroundLayers];
    const [layer] = next.splice(index, 1);
    next.splice(target, 0, layer);
    onChangeBackgroundLayers(next);
  };

  const removeBackgroundLayer = (id: string) => {
    onChangeBackgroundLayers(backgroundLayers.filter((layer) => layer.id !== id));
  };

  const updateNavItems = (next: NavbarItem[]) => {
    setProps({ navItems: next });
  };

  const handleNavItemChange = (id: string, patch: Partial<NavbarItem>) => {
    if (!isNavbarContainer) return;
    const next = navItems.map((item) => (item.id === id ? { ...item, ...patch } : item));
    updateNavItems(next);
  };

  const handleAddNavItem = () => {
    if (!isNavbarContainer) return;
    updateNavItems([
      ...navItems,
      {
        id: createNavId(),
        label: 'Navigation',
        action: 'navigate',
      },
    ]);
  };

  const handleRemoveNavItem = (id: string) => {
    if (!isNavbarContainer) return;
    const next = navItems.filter((item) => item.id !== id);
    updateNavItems(next.length ? next : []);
  };

  const updateDropdownOptionsState = (next: DropdownOption[]) => {
    setProps({ dropdownOptions: next });
  };

  const handleDropdownOptionChange = (id: string, patch: Partial<DropdownOption>) => {
    if (!isDropdownButton) return;
    const next = dropdownOptions.map((option) => (option.id === id ? { ...option, ...patch } : option));
    updateDropdownOptionsState(next);
  };

  const handleAddDropdownOption = () => {
    if (!isDropdownButton) return;
    updateDropdownOptionsState([
      ...dropdownOptions,
      {
        id: createDropdownOptionId(),
        label: `Option ${dropdownOptions.length + 1}`,
        action: 'navigate',
      },
    ]);
  };

  const handleRemoveDropdownOption = (id: string) => {
    if (!isDropdownButton) return;
    const next = dropdownOptions.filter((option) => option.id !== id);
    updateDropdownOptionsState(next.length ? next : [
      { id: createDropdownOptionId(), label: 'Option 1', action: 'navigate' },
    ]);
  };

  const updateTimeEntries = (next: TimeEntry[]) => {
    const existing = (node?.props?.timeTracking ?? {}) as Record<string, unknown>;
    setProps({ timeTracking: { ...existing, entries: next } });
  };

  const handleTimeEntryChange = (id: string, patch: Partial<TimeEntry>) => {
    if (!isTimeTrackingContainer) return;
    updateTimeEntries(
      timeEntries.map((entry) => {
        if (entry.id !== id) return entry;
        const nextEntry: TimeEntry = { ...entry, ...patch };
        if (typeof patch.seconds === 'number') {
          nextEntry.seconds = Math.max(0, patch.seconds);
        }
        return nextEntry;
      })
    );
  };

  const handleAddTimeEntry = () => {
    if (!isTimeTrackingContainer) return;
    updateTimeEntries([
      ...timeEntries,
      {
        id: createTimeEntryId(),
        label: 'Neuer Task',
        seconds: 0,
        startedAt: new Date().toISOString(),
      },
    ]);
  };

  const handleRemoveTimeEntry = (id: string) => {
    if (!isTimeTrackingContainer) return;
    updateTimeEntries(timeEntries.filter((entry) => entry.id !== id));
  };

  const handleClearTimeEntries = () => {
    if (!isTimeTrackingContainer) return;
    updateTimeEntries([]);
  };

  const handleRestoreDemoEntries = () => {
    if (!isTimeTrackingContainer) return;
    updateTimeEntries(createDefaultTimeEntries());
  };

  const handleTimeEntryStatusChange = (id: string, status: 'running' | 'done') => {
    if (!isTimeTrackingContainer) return;
    const nowIso = new Date().toISOString();
    const next = timeEntries.map((entry) => {
      if (entry.id === id) {
        return status === 'running'
          ? { ...entry, startedAt: entry.startedAt ?? nowIso, endedAt: undefined }
          : { ...entry, endedAt: nowIso };
      }
      if (status === 'running' && !entry.endedAt) {
        return { ...entry, endedAt: entry.endedAt ?? nowIso };
      }
      return entry;
    });
    updateTimeEntries(next);
  };

  const updateStatusBoard = (updater: (prev: StatusBoardState) => StatusBoardState) => {
    if (!isStatusBoardContainer) return;
    const prev = statusBoardState ?? normalizeStatusBoard(node?.props?.statusBoard);
    const next = updater(prev);
    const safeActive = next.options.some((option) => option.id === next.activeId)
      ? next.activeId
      : next.options[0]?.id ?? null;
    setProps({ statusBoard: { ...next, activeId: safeActive ?? null } });
  };

  const handleStatusBoardTitleChange = (value: string) => {
    updateStatusBoard((prev) => ({ ...prev, title: value }));
  };

  const handleStatusOptionChange = (id: string, patch: Partial<StatusOption>) => {
    updateStatusBoard((prev) => ({
      ...prev,
      options: prev.options.map((option) => (option.id === id ? { ...option, ...patch } : option)),
    }));
  };

  const handleAddStatusOption = () => {
    updateStatusBoard((prev) => {
      const nextIndex = prev.options.length;
      const newOption: StatusOption = {
        id: createStatusId(),
        label: `Status ${nextIndex + 1}`,
        color: STATUS_COLOR_CYCLE[nextIndex % STATUS_COLOR_CYCLE.length],
      };
      return { ...prev, options: [...prev.options, newOption] };
    });
  };

  const handleRemoveStatusOption = (id: string) => {
    updateStatusBoard((prev) => {
      const nextOptions = prev.options.filter((option) => option.id !== id);
      const nextActive = nextOptions.some((option) => option.id === prev.activeId)
        ? prev.activeId
        : nextOptions[0]?.id ?? null;
      return { ...prev, options: nextOptions, activeId: nextActive };
    });
  };

  const handleSetActiveStatus = (id: string) => {
    updateStatusBoard((prev) => ({ ...prev, activeId: id }));
  };

  const updateFolderTreePresets = (next: FolderPreset[]) => {
    if (!isFolderStructureContainer) return;
    setProps({ folderTree: folderPresetsToTree(next) });
  };

  const handleFolderPresetChange = (id: string, value: string) => {
    if (!isFolderStructureContainer) return;
    updateFolderTreePresets(
      folderPresets.map((preset) => (preset.id === id ? { ...preset, name: value } : preset))
    );
  };

  const handleRemoveFolderPreset = (id: string) => {
    if (!isFolderStructureContainer) return;
    const remaining = folderPresets.filter((preset) => preset.id !== id);
    updateFolderTreePresets(remaining);
  };

  const handleAddFolderPreset = () => {
    if (!isFolderStructureContainer) return;
    updateFolderTreePresets([
      ...folderPresets,
      { id: createGenericId(), name: `Ordner ${folderPresets.length + 1}`, children: [] },
    ]);
  };

  const handleFolderChildChange = (folderId: string, childId: string, name: string) => {
    if (!isFolderStructureContainer) return;
    updateFolderTreePresets(
      folderPresets.map((preset) =>
        preset.id === folderId
          ? {
              ...preset,
              children: preset.children.map((child) => (child.id === childId ? { ...child, name } : child)),
            }
          : preset
      )
    );
  };

  const handleAddFolderChild = (folderId: string) => {
    if (!isFolderStructureContainer) return;
    updateFolderTreePresets(
      folderPresets.map((preset) =>
        preset.id === folderId
          ? {
              ...preset,
              children: [...preset.children, { id: createGenericId(), name: `Unterordner ${preset.children.length + 1}` }],
            }
          : preset
      )
    );
  };

  const handleRemoveFolderChild = (folderId: string, childId: string) => {
    if (!isFolderStructureContainer) return;
    updateFolderTreePresets(
      folderPresets.map((preset) =>
        preset.id === folderId
          ? { ...preset, children: preset.children.filter((child) => child.id !== childId) }
          : preset
      )
    );
  };

  const updateTaskCollection = (key: 'tasks' | 'todoItems', items: TaskItem[]) => {
    setProps({ [key]: items });
  };

  const handleTaskItemChange = (collection: 'tasks' | 'todoItems', id: string, patch: Partial<TaskItem>) => {
    if (collection === 'tasks' && !isTaskManagerContainer) return;
    if (collection === 'todoItems' && !isTodoContainer) return;
    const source = collection === 'tasks' ? taskManagerItems : todoItems;
    const next = source.map((item) => (item.id === id ? { ...item, ...patch } : item));
    updateTaskCollection(collection, next);
  };

  const handleAddTaskItem = (collection: 'tasks' | 'todoItems') => {
    if (collection === 'tasks' && !isTaskManagerContainer) return;
    if (collection === 'todoItems' && !isTodoContainer) return;
    const source = collection === 'tasks' ? taskManagerItems : todoItems;
    updateTaskCollection(collection, [
      ...source,
      { id: createGenericId(), title: `Aufgabe ${source.length + 1}`, done: false },
    ]);
  };

  const handleRemoveTaskItem = (collection: 'tasks' | 'todoItems', id: string) => {
    if (collection === 'tasks' && !isTaskManagerContainer) return;
    if (collection === 'todoItems' && !isTodoContainer) return;
    const source = collection === 'tasks' ? taskManagerItems : todoItems;
    const next = source.filter((item) => item.id !== id);
    updateTaskCollection(collection, next.length ? next : []);
  };

  const updateAnalyticsState = (next: AnalyticsMetric[]) => {
    if (!isAnalyticsContainer) return;
    setProps({ analyticsMetrics: next });
  };

  const handleAnalyticsMetricChange = (id: string, patch: Partial<AnalyticsMetric>) => {
    if (!isAnalyticsContainer) return;
    updateAnalyticsState(analyticsMetrics.map((metric) => (metric.id === id ? { ...metric, ...patch } : metric)));
  };

  const handleAddAnalyticsMetric = () => {
    if (!isAnalyticsContainer) return;
    updateAnalyticsState([
      ...analyticsMetrics,
      { id: createGenericId(), label: `Kennzahl ${analyticsMetrics.length + 1}`, value: '—' },
    ]);
  };

  const handleRemoveAnalyticsMetric = (id: string) => {
    if (!isAnalyticsContainer) return;
    const next = analyticsMetrics.filter((metric) => metric.id !== id);
    updateAnalyticsState(next.length ? next : [{ id: createGenericId(), label: 'Kennzahl 1', value: '—' }]);
  };

  const handleAnalyticsHighlightChange = (value: string) => {
    if (!isAnalyticsContainer) return;
    setProps({ analyticsHighlight: value.trim() ? value : undefined });
  };

  const updateSupportTicketsState = (next: SupportTicket[]) => {
    if (!isSupportContainer) return;
    setProps({ supportTickets: next });
  };

  const handleSupportTicketChange = (id: string, patch: Partial<SupportTicket>) => {
    if (!isSupportContainer) return;
    updateSupportTicketsState(
      supportTickets.map((ticket) => (ticket.id === id ? { ...ticket, ...patch } : ticket))
    );
  };

  const updateAvatarTraitsState = (next: AvatarTrait[]) => {
    if (!isAvatarCreator) return;
    setProps({ avatarTraits: next });
  };

  const handleAvatarTraitChange = (id: string, patch: Partial<AvatarTrait>) => {
    if (!isAvatarCreator) return;
    updateAvatarTraitsState(avatarTraits.map((trait) => (trait.id === id ? { ...trait, ...patch } : trait)));
  };

  const handleAddAvatarTrait = () => {
    if (!isAvatarCreator) return;
    updateAvatarTraitsState([
      ...avatarTraits,
      { id: createGenericId(), label: `Eigenschaft ${avatarTraits.length + 1}`, value: 'Neu' },
    ]);
  };

  const handleRemoveAvatarTrait = (id: string) => {
    if (!isAvatarCreator) return;
    updateAvatarTraitsState(avatarTraits.filter((trait) => trait.id !== id));
  };

  const updateAvatarActionsState = (next: AvatarAction[]) => {
    if (!isAvatarCreator) return;
    setProps({ avatarActions: next });
  };

  const handleAvatarActionChange = (id: string, patch: Partial<AvatarAction>) => {
    if (!isAvatarCreator) return;
    updateAvatarActionsState(avatarActions.map((action) => (action.id === id ? { ...action, ...patch } : action)));
  };

  const handleAddAvatarAction = () => {
    if (!isAvatarCreator) return;
    updateAvatarActionsState([
      ...avatarActions,
      { id: createGenericId(), label: `Aktion ${avatarActions.length + 1}`, description: '' },
    ]);
  };

  const handleRemoveAvatarAction = (id: string) => {
    if (!isAvatarCreator) return;
    updateAvatarActionsState(avatarActions.filter((action) => action.id !== id));
  };

  const handleMapModeChange = (mode: MapMode) => {
    if (!isMapContainer) return;
    setProps({ mapMode: mode });
  };

  const handleMapFieldChange = (
    key: 'mapLocation' | 'mapModeLabel' | 'mapInfo' | 'mapActionLabel',
    value: string
  ) => {
    if (!isMapContainer) return;
    const hasValue = value.trim().length > 0;
    setProps({ [key]: hasValue ? value : undefined });
  };

  const handleAddSupportTicket = () => {
    if (!isSupportContainer) return;
    updateSupportTicketsState([
      ...supportTickets,
      { id: createGenericId(), subject: `Ticket ${supportTickets.length + 1}`, message: '' },
    ]);
  };

  const handleRemoveSupportTicket = (id: string) => {
    if (!isSupportContainer) return;
    const next = supportTickets.filter((ticket) => ticket.id !== id);
    updateSupportTicketsState(next.length ? next : []);
  };

  const handleSupportChannelChange = (value: 'ticket' | 'email' | 'chat') => {
    if (!isSupportContainer) return;
    setProps({ supportChannel: value });
  };

  const handleSupportTargetChange = (value: string) => {
    if (!isSupportContainer) return;
    const trimmed = value.trim();
    setProps({ supportTarget: trimmed || undefined });
  };

  const commitTableConfig = (next: TableConfig) => {
    if (!isTableContainer) return;
    const alignedRows = next.rows.map((row) => ({
      ...row,
      values: next.columns.map((_, index) => row.values[index] ?? ''),
    }));
    setProps({ tableConfig: { ...next, rows: alignedRows } });
  };

  const handleTableTitleChange = (value: string) => {
    if (!tableConfig || !isTableContainer) return;
    commitTableConfig({ ...tableConfig, title: value });
  };

  const handleTableColumnChange = (id: string, label: string) => {
    if (!tableConfig || !isTableContainer) return;
    const nextColumns = tableConfig.columns.map((column) => (column.id === id ? { ...column, label } : column));
    commitTableConfig({ ...tableConfig, columns: nextColumns });
  };

  const handleAddTableColumn = () => {
    if (!tableConfig || !isTableContainer) return;
    const nextColumns = [...tableConfig.columns, { id: createGenericId(), label: `Spalte ${tableConfig.columns.length + 1}` }];
    const nextRows = tableConfig.rows.map((row) => ({ ...row, values: [...row.values, ''] }));
    commitTableConfig({ ...tableConfig, columns: nextColumns, rows: nextRows });
  };

  const handleRemoveTableColumn = (id: string) => {
    if (!tableConfig || !isTableContainer) return;
    const index = tableConfig.columns.findIndex((column) => column.id === id);
    if (index === -1 || tableConfig.columns.length === 1) return;
    const nextColumns = tableConfig.columns.filter((column) => column.id !== id);
    const nextRows = tableConfig.rows.map((row) => {
      const nextValues = [...row.values];
      nextValues.splice(index, 1);
      return { ...row, values: nextValues };
    });
    commitTableConfig({ ...tableConfig, columns: nextColumns, rows: nextRows });
  };

  const handleTableRowChange = (rowId: string, columnIndex: number, value: string) => {
    if (!tableConfig || !isTableContainer) return;
    const nextRows = tableConfig.rows.map((row) => {
      if (row.id !== rowId) return row;
      const nextValues = [...row.values];
      nextValues[columnIndex] = value;
      return { ...row, values: nextValues };
    });
    commitTableConfig({ ...tableConfig, rows: nextRows });
  };

  const handleAddTableRow = () => {
    if (!tableConfig || !isTableContainer) return;
    commitTableConfig({
      ...tableConfig,
      rows: [
        ...tableConfig.rows,
        { id: createGenericId(), values: tableConfig.columns.map(() => '') },
      ],
    });
  };

  const handleRemoveTableRow = (rowId: string) => {
    if (!tableConfig || !isTableContainer) return;
    const nextRows = tableConfig.rows.filter((row) => row.id !== rowId);
    commitTableConfig({ ...tableConfig, rows: nextRows });
  };

  const commitNewsFeed = (next: NormalizedNewsFeed) => {
    if (!isNewsContainer) return;
    setProps({
      newsFeed: {
        title: next.title,
        items: next.items,
      },
    });
  };

  const handleNewsTitleChange = (value: string) => {
    if (!newsFeed || !isNewsContainer) return;
    commitNewsFeed({ ...newsFeed, title: value });
  };

  const handleAddNewsItem = () => {
    if (!newsFeed || !isNewsContainer) return;
    commitNewsFeed({
      ...newsFeed,
      items: [
        ...newsFeed.items,
        {
          id: createGenericId(),
          title: `Eintrag ${newsFeed.items.length + 1}`,
          body: '',
          imageUrl: '',
          date: new Date().toISOString(),
        },
      ],
    });
  };

  const handleRemoveNewsItem = (id: string) => {
    if (!newsFeed || !isNewsContainer) return;
    commitNewsFeed({ ...newsFeed, items: newsFeed.items.filter((item) => item.id !== id) });
  };

  const handleNewsItemChange = (id: string, patch: Partial<NewsItem>) => {
    if (!newsFeed || !isNewsContainer) return;
    commitNewsFeed({
      ...newsFeed,
      items: newsFeed.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  };

  return (
    <div className="p-4 space-y-4 text-sm bg-[#0b0b0f] h-full overflow-y-auto">
      <div className="font-semibold text-lg border-b border-[#222] pb-2">Eigenschaften</div>

      {isChatContainer && (
        <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-neutral-400">
            <span>Chat</span>
          </div>
          <label className="flex items-center gap-2 text-xs text-neutral-200">
            <input
              type="checkbox"
              className="h-4 w-4 accent-emerald-400"
              checked={chatShowFirstName}
              onChange={(e) => setProps({ chatShowFirstName: e.target.checked })}
            />
            <span>Vorname anzeigen</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-neutral-200">
            <input
              type="checkbox"
              className="h-4 w-4 accent-emerald-400"
              checked={chatShowLastName}
              onChange={(e) => setProps({ chatShowLastName: e.target.checked })}
            />
            <span>Nachname anzeigen</span>
          </label>
          <div className="space-y-1 text-xs text-neutral-300">
            <div className="text-[11px] uppercase tracking-[0.3em] text-neutral-400">Textfarbe</div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-8 w-10 cursor-pointer rounded border border-neutral-700 bg-neutral-800"
                value={chatTextColor}
                onChange={(e) => setProps({ chatTextColor: e.target.value })}
              />
              <input
                type="text"
                className="flex-1 rounded bg-neutral-800 px-2 py-1 text-sm"
                value={chatTextColor}
                onChange={(e) => setProps({ chatTextColor: e.target.value })}
                placeholder="#e5e7eb"
              />
            </div>
          </div>
        </div>
      )}

      {showPageBackgroundControls && (
        <div className="space-y-2">
          <button
            type="button"
            className="w-full flex items-center justify-between rounded border border-white/5 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 uppercase tracking-widest transition hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
            onClick={() => setBackgroundSectionOpen((prev) => !prev)}
            aria-expanded={backgroundSectionOpen}
            aria-controls="page-background-controls"
          >
            <span className="text-left">Seiten-Hintergrund</span>
            <span className="text-[11px] text-neutral-400">{backgroundSectionOpen ? '▲' : '▼'}</span>
          </button>
          {backgroundSectionOpen && (
            <div id="page-background-controls" className="space-y-4 rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-neutral-400">
                  <span>Basisfarbe</span>
                  <span className="text-[10px] text-neutral-500">wird unter allen Ebenen angezeigt</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-10 w-12 cursor-pointer rounded border border-neutral-700 bg-neutral-800"
                    value={normalizedBackgroundColor}
                    onChange={(e) => onChangeBackgroundColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 rounded bg-neutral-800 px-2 py-1.5 text-sm"
                    value={pageBackgroundColor}
                    placeholder="#05070f"
                    onChange={(e) => onChangeBackgroundColor(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    className="rounded border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-neutral-100 transition hover:bg-white/10"
                    onClick={applyColorOnlyBackground}
                  >Nur Farbe verwenden</button>
                  <span className="text-[11px] text-neutral-500">Entfernt Verlauf/Bilder und nutzt nur die Basisfarbe.</span>
                </div>
              </div>

              <label className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 text-xs text-neutral-200">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-emerald-400"
                  checked={backgroundSyncEnabled}
                  onChange={(event) => onToggleBackgroundSync(event.target.checked)}
                />
                <span>Hintergrund auf alle Seiten anwenden</span>
              </label>

              <div className="space-y-2 border-t border-white/10 pt-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-neutral-400">
                  <span>Verlauf &amp; CSS</span>
                  <span className="text-[10px] text-neutral-500">{pageBackground.length ? `${pageBackground.length} Zeichen` : 'leer'}</span>
                </div>
                <textarea
                  className="min-h-[60px] w-full rounded bg-neutral-800 px-2 py-1.5 text-sm"
                  value={pageBackground}
                  onChange={(e) => onChangeBackground(e.target.value)}
                />
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-neutral-100 transition hover:bg-white/10"
                    onClick={askForPageGradient}
                  >KI Verlauf</button>
                  <button
                    type="button"
                    className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-neutral-100 transition hover:bg-white/10"
                    onClick={() => backgroundFileInput.current?.click()}
                  >Einzelnes Bild</button>
                  <button
                    type="button"
                    className="rounded border border-white/10 px-3 py-1.5 font-semibold text-neutral-200 transition hover:bg-white/10"
                    onClick={onResetBackground}
                  >Zurücksetzen</button>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={backgroundFileInput}
                  className="hidden"
                  onChange={handleBackgroundFile}
                />
              </div>

              {hasLegacyImageBackground && (
                <div className="space-y-4 rounded-lg border border-white/10 bg-black/10 p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-neutral-400">
                      <span>Bildgröße</span>
                      <span>{backgroundSizeToken ?? 'cover'}</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={200}
                      step={5}
                      value={imageScalePercent}
                      onChange={(event) => handleBackgroundScaleChange(Number(event.target.value))}
                      className="w-full accent-emerald-400"
                    />
                    <div className="flex justify-between text-[11px] text-neutral-500">
                      <span>50%</span>
                      <span>{imageScalePercent}%</span>
                      <span>200%</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-neutral-100 hover:bg-white/10"
                        onClick={() => updateBackgroundSizeToken('cover')}
                      >Cover</button>
                      <button
                        type="button"
                        className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-neutral-100 hover:bg-white/10"
                        onClick={() => updateBackgroundSizeToken('contain')}
                      >Contain</button>
                      <button
                        type="button"
                        className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-neutral-100 hover:bg-white/10"
                        onClick={() => updateBackgroundSizeToken('100%')}
                      >100%</button>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-white/10 pt-3">
                    <div className="text-[11px] uppercase tracking-[0.3em] text-neutral-400">Legacy-Bildposition</div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-neutral-500">
                        <span>Horizontal</span>
                        <span>{Math.round(backgroundPosXPercent)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={backgroundPosXPercent}
                        onChange={(event) => handleBackgroundPositionChange('x', Number(event.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-neutral-500">
                        <span>Vertikal</span>
                        <span>{Math.round(backgroundPosYPercent)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={backgroundPosYPercent}
                        onChange={(event) => handleBackgroundPositionChange('y', Number(event.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <button
                        type="button"
                        className="rounded border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-neutral-100 hover:bg-white/10"
                        onClick={() => applyPositionPreset(0, 0)}
                      >Links oben</button>
                      <button
                        type="button"
                        className="rounded border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-neutral-100 hover:bg-white/10"
                        onClick={() => applyPositionPreset(50, 50)}
                      >Mitte</button>
                      <button
                        type="button"
                        className="rounded border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-neutral-100 hover:bg-white/10"
                        onClick={() => applyPositionPreset(100, 100)}
                      >Rechts unten</button>
                      <button
                        type="button"
                        className="rounded border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-neutral-100 hover:bg-white/10"
                        onClick={() => applyPositionPreset(0, 50)}
                      >Links Mitte</button>
                      <button
                        type="button"
                        className="rounded border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-neutral-100 hover:bg-white/10"
                        onClick={() => applyPositionPreset(50, 0)}
                      >Oben Mitte</button>
                      <button
                        type="button"
                        className="rounded border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-neutral-100 hover:bg-white/10"
                        onClick={() => applyPositionPreset(100, 50)}
                      >Rechts Mitte</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 border-t border-white/10 pt-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-neutral-400">
                  <span>Bild-Layer</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-neutral-100 hover:bg-white/10"
                      onClick={() => backgroundLayerInput.current?.click()}
                    >+ Upload</button>
                    <button
                      type="button"
                      className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-neutral-100 hover:bg-white/10"
                      onClick={handleAddLayerFromUrl}
                    >+ URL</button>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={backgroundLayerInput}
                  className="hidden"
                  onChange={handleBackgroundLayerFile}
                />
                {backgroundLayers.length === 0 ? (
                  <div className="rounded border border-dashed border-white/10 bg-white/5 px-3 py-2 text-[11px] text-neutral-400">
                    Noch keine Ebenen – kombiniere mehrere Bilder, um Reflexe oder Muster zu stapeln.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {backgroundLayers.map((layer, index) => (
                      <div key={layer.id} className="space-y-2 rounded-lg border border-white/10 bg-[#050912]/70 p-3">
                        <div className="flex items-center justify-between text-xs text-neutral-300">
                          <span>Ebene {index + 1}</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="rounded border border-white/10 px-2 py-1 text-[11px] text-neutral-200 transition hover:bg-white/10 disabled:opacity-40"
                              disabled={index === 0}
                              onClick={() => moveBackgroundLayer(layer.id, 'up')}
                            >↑</button>
                            <button
                              type="button"
                              className="rounded border border-white/10 px-2 py-1 text-[11px] text-neutral-200 transition hover:bg-white/10 disabled:opacity-40"
                              disabled={index === backgroundLayers.length - 1}
                              onClick={() => moveBackgroundLayer(layer.id, 'down')}
                            >↓</button>
                            <button
                              type="button"
                              className="rounded border border-rose-400/40 px-2 py-1 text-[11px] text-rose-200 transition hover:bg-rose-500/20"
                              onClick={() => removeBackgroundLayer(layer.id)}
                            >Entfernen</button>
                          </div>
                        </div>
                        <div
                          className="h-24 rounded-md border border-white/10 bg-neutral-900"
                          style={{
                            backgroundImage: `url(${layer.url})`,
                            backgroundSize: `${layer.size}%`,
                            backgroundPosition: `${layer.positionX}% ${layer.positionY}%`,
                            backgroundRepeat: 'no-repeat',
                          }}
                        />
                        <div className="space-y-1 text-[11px] text-neutral-400">
                          <label className="uppercase tracking-[0.2em]">Bildquelle</label>
                          <input
                            type="text"
                            className="w-full rounded bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100"
                            value={layer.url}
                            onChange={(event) => updateBackgroundLayer(layer.id, { url: event.target.value })}
                          />
                        </div>
                        <div className="space-y-2 border-t border-white/10 pt-2">
                          <div className="space-y-1 text-[11px] text-neutral-400">
                            <div className="flex items-center justify-between">
                              <span>Horizontal</span>
                              <span>{layer.positionX}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={1}
                              value={layer.positionX}
                              onChange={(event) => updateBackgroundLayer(layer.id, { positionX: Number(event.target.value) })}
                              className="w-full accent-cyan-400"
                            />
                          </div>
                          <div className="space-y-1 text-[11px] text-neutral-400">
                            <div className="flex items-center justify-between">
                              <span>Vertikal</span>
                              <span>{layer.positionY}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={1}
                              value={layer.positionY}
                              onChange={(event) => updateBackgroundLayer(layer.id, { positionY: Number(event.target.value) })}
                              className="w-full accent-cyan-400"
                            />
                          </div>
                          <div className="space-y-1 text-[11px] text-neutral-400">
                            <div className="flex items-center justify-between">
                              <span>Skalierung</span>
                              <span>{layer.size}%</span>
                            </div>
                            <input
                              type="range"
                              min={20}
                              max={300}
                              step={5}
                              value={layer.size}
                              onChange={(event) => updateBackgroundLayer(layer.id, { size: Number(event.target.value) })}
                              className="w-full accent-emerald-400"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {!backgroundSectionOpen && (
            <div className="space-y-1 rounded border border-dashed border-white/10 bg-black/10 px-3 py-2 text-[11px] text-neutral-400">
              <div>CSS: <span className="font-semibold text-neutral-200">{pageBackground.slice(0, 40)}{pageBackground.length > 40 ? '…' : ''}</span></div>
              <div>Farbe: <span className="font-semibold text-neutral-200">{normalizedBackgroundColor}</span></div>
            </div>
          )}
        </div>
      )}

      {!node && (
        <div className="flex flex-col items-center justify-center h-64 text-neutral-400 text-center">
          <div className="text-4xl mb-2">🎨</div>
          <div>Kein Element ausgewählt</div>
          <div className="text-xs mt-2">Wähle ein Element aus oder passe oben den Seitenhintergrund an.</div>
        </div>
      )}

      {!node && <div className="border-t border-[#222]" />}

      {!node && <div className="text-xs text-neutral-500">Tipp: Wähle ein Element auf der Leinwand, um weitere Eigenschaften anzuzeigen.</div>}

      {!node && <div className="h-px" />}

      {!node ? null : (
        <>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Position & Größe</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400">X</label>
                <input
                  type="number"
                  className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                  value={node.x ?? 0}
                  onChange={(e) => setFrame('x', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Y</label>
                <input
                  type="number"
                  className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                  value={node.y ?? 0}
                  onChange={(e) => setFrame('y', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Breite</label>
                <input
                  type="number"
                  className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                  value={node.w ?? 120}
                  onChange={(e) => setFrame('w', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Höhe</label>
                <input
                  type="number"
                  className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                  value={node.h ?? 40}
                  onChange={(e) => setFrame('h', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ausrichten</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  className="rounded border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-neutral-100 hover:bg-white/10"
                  onClick={() => alignNodePreset('left-middle')}
                >Links Mitte</button>
                <button
                  type="button"
                  className="rounded border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-neutral-100 hover:bg-white/10"
                  onClick={() => alignNodePreset('center')}
                >Mitte</button>
                <button
                  type="button"
                  className="rounded border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-neutral-100 hover:bg-white/10"
                  onClick={() => alignNodePreset('right-middle')}
                >Rechts Mitte</button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  className="rounded border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-neutral-100 hover:bg-white/10"
                  onClick={() => alignNodePreset('top-middle')}
                >Oben Mitte</button>
                <button
                  type="button"
                  className="rounded border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-neutral-100 hover:bg-white/10"
                  onClick={() => alignNodePreset('bottom-middle')}
                >Unten Mitte</button>
              </div>
            </div>
          </div>

          {node && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Transparenz</div>
              <div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Deckkraft</span>
                  <span>{nodeOpacityPercent}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={1}
                  value={nodeOpacityPercent}
                  onChange={(event) => handleOpacityUpdate(Number(event.target.value))}
                  className="w-full accent-emerald-400"
                />
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    max={100}
                    className="w-24 rounded bg-neutral-800 px-2 py-1.5 text-sm"
                    value={nodeOpacityPercent}
                    onChange={(event) => handleOpacityUpdate(Number(event.target.value))}
                  />
                  <span className="text-xs text-gray-500">%</span>
                  <button
                    type="button"
                    className="ml-auto rounded border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-neutral-200 hover:bg-white/10"
                    onClick={() => handleOpacityUpdate(100)}
                  >Reset</button>
                </div>
                <p className="text-[11px] text-neutral-500">Reduziere die Deckkraft für transparente Überlagerungen.</p>
              </div>
            </div>
          )}

          {node.type === 'text' && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Text</div>
              <div>
                <label className="text-xs text-gray-400">Inhalt</label>
                <textarea
                  className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm min-h-[60px]"
                  value={node.props?.text ?? ''}
                  onChange={(e) => setProps({ text: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Schriftgröße</label>
                <input
                  type="number"
                  className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                  value={node.style?.fontSize ?? 16}
                  onChange={(e) => setStyle({ fontSize: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Farbe</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-10 w-16 bg-neutral-800 rounded cursor-pointer"
                    value={node.style?.color ?? '#ffffff'}
                    onChange={(e) => setStyle({ color: e.target.value })}
                  />
                  <input
                    type="text"
                    className="flex-1 bg-neutral-800 rounded px-2 py-1.5 text-sm"
                    value={node.style?.color ?? '#ffffff'}
                    onChange={(e) => setStyle({ color: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {node.type === 'button' && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Button</div>
              <div>
                <label className="text-xs text-gray-400">Icon (Emoji oder Unicode)</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    ref={buttonIconInputRef}
                    className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                    placeholder="z.B. 🔘 oder ✓"
                    value={node.props?.icon ?? ''}
                    onChange={(e) => setProps({ icon: e.target.value })}
                  />
                  <select
                    className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm sm:max-w-[180px]"
                    value={buttonIconPresetSelection}
                    onChange={(event) => {
                      const { value } = event.target;
                      if (value === 'custom') {
                        buttonIconInputRef.current?.focus();
                        return;
                      }
                      const preset = BUTTON_ICON_PRESETS.find((candidate) => candidate.id === value);
                      if (!preset) return;
                      setProps({ icon: preset.value || undefined });
                    }}
                  >
                    {BUTTON_ICON_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                    <option value="custom">Eigenes Icon nutzen</option>
                  </select>
                </div>
                <p className="text-[11px] text-neutral-500">Nutze die Schnellwahl oder gib dein eigenes Icon ein.</p>
              </div>
              <div>
                <label className="text-xs text-gray-400">Text</label>
                <input
                  className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                  value={node.props?.label ?? ''}
                  onChange={(e) => setProps({ label: e.target.value })}
                />
              </div>

              {isDropdownButton && (
                <div className="space-y-3 rounded-xl border border-sky-500/40 bg-sky-500/5 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-200">Dropdown-Menü</div>
                  <p className="text-[11px] text-neutral-400">Füge Einträge hinzu und lege fest, was bei Auswahl passieren soll.</p>
                  {dropdownOptions.map((option, index) => {
                    const needsGenericTarget = ['call', 'email', 'chat', 'support-ticket'].includes(option.action);
                    return (
                      <div key={option.id} className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span>Option {index + 1}</span>
                          <button
                            type="button"
                            className="text-rose-300 transition hover:text-rose-200"
                            onClick={() => handleRemoveDropdownOption(option.id)}
                          >Entfernen</button>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Label</label>
                          <input
                            className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                            value={option.label}
                            onChange={(event) => handleDropdownOptionChange(option.id, { label: event.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Aktion</label>
                          <select
                            className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                            value={option.action}
                            onChange={(event) => handleDropdownOptionChange(option.id, { action: event.target.value as DropdownOption['action'] })}
                          >
                            <option value="navigate">Seite wechseln</option>
                            <option value="url">Website öffnen</option>
                            <option value="chat">Chat starten</option>
                            <option value="call">Anrufen</option>
                            <option value="email">E-Mail senden</option>
                            <option value="support-ticket">Support-Ticket</option>
                            <option value="login">Login</option>
                            <option value="logout">Logout</option>
                            <option value="register">Registrierung</option>
                            <option value="reset-password">Passwort zurücksetzen</option>
                            <option value="toggle-theme">Dark/Light Mode</option>
                          </select>
                        </div>

                        {option.action === 'navigate' && (
                          <>
                            <div>
                              <label className="text-xs text-gray-400">Zielseite</label>
                              <input
                                className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                                placeholder="Dashboard"
                                value={option.targetPage ?? ''}
                                onChange={(event) => handleDropdownOptionChange(option.id, { targetPage: event.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400">Anchor / URL (optional)</label>
                              <input
                                className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                                placeholder="#analytics"
                                value={option.target ?? ''}
                                onChange={(event) => handleDropdownOptionChange(option.id, { target: event.target.value })}
                              />
                            </div>
                          </>
                        )}

                        {option.action === 'url' && (
                          <div>
                            <label className="text-xs text-gray-400">URL</label>
                            <input
                              className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                              placeholder="https://example.com"
                              value={option.url ?? ''}
                              onChange={(event) => handleDropdownOptionChange(option.id, { url: event.target.value })}
                            />
                          </div>
                        )}

                        {needsGenericTarget && (
                          <div>
                            <label className="text-xs text-gray-400">Ziel / Kontakt</label>
                            <input
                              className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                              placeholder="z.B. +49 123 456"
                              value={option.target ?? ''}
                              onChange={(event) => handleDropdownOptionChange(option.id, { target: event.target.value })}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleAddDropdownOption}
                    className="w-full rounded border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/20"
                  >Option hinzufügen</button>
                </div>
              )}

              {isAdButton && (
                <div className="space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-200">Werbung</div>
                  <div>
                    <label className="text-xs text-gray-400">Badge</label>
                    <input
                      className="w-full bg-neutral-900 rounded px-2 py-1.5 text-sm"
                      placeholder="Anzeige"
                      value={node.props?.adBadge ?? ''}
                      onChange={(e) => setProps({ adBadge: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Überschrift</label>
                    <input
                      className="w-full bg-neutral-900 rounded px-2 py-1.5 text-sm"
                      placeholder="Bringe deine App groß raus"
                      value={node.props?.adHeadline ?? ''}
                      onChange={(e) => setProps({ adHeadline: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Beschreibung</label>
                    <textarea
                      className="w-full bg-neutral-900 rounded px-2 py-1.5 text-sm min-h-[60px]"
                      placeholder="Beschreibe dein Angebot"
                      value={node.props?.adDescription ?? ''}
                      onChange={(e) => setProps({ adDescription: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Zusatz (z.B. Leistungen)</label>
                    <input
                      className="w-full bg-neutral-900 rounded px-2 py-1.5 text-sm"
                      placeholder="AI-Optimierung & Reporting enthalten"
                      value={node.props?.adSubline ?? ''}
                      onChange={(e) => setProps({ adSubline: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Preis / Benefit</label>
                    <input
                      className="w-full bg-neutral-900 rounded px-2 py-1.5 text-sm"
                      placeholder="Ab 49 € / Monat"
                      value={node.props?.adPrice ?? ''}
                      onChange={(e) => setProps({ adPrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">CTA-Label</label>
                    <input
                      className="w-full bg-neutral-900 rounded px-2 py-1.5 text-sm"
                      placeholder="Jetzt buchen"
                      value={node.props?.adCtaLabel ?? node.props?.label ?? ''}
                      onChange={(e) => setProps({ adCtaLabel: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Bild-URL (optional)</label>
                    <input
                      className="w-full bg-neutral-900 rounded px-2 py-1.5 text-sm"
                      placeholder="https://…"
                      value={node.props?.adImageUrl ?? ''}
                      onChange={(e) => setProps({ adImageUrl: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-400">Aktion</label>
                <select
                  className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                  value={node.props?.action ?? 'none'}
                  onChange={(e) => setProps({ action: e.target.value })}
                >
                  <option value="none">Keine Aktion</option>
                  <option value="navigate">Seite wechseln</option>
                  <option value="url">Website öffnen</option>
                  <option value="chat">Chat starten</option>
                  <option value="call">Anrufen</option>
                  <option value="email">E-Mail senden</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="register">Registrierung</option>
                  <option value="reset-password">Passwort zurücksetzen</option>
                  <option value="upload-photo">Foto hochladen</option>
                  <option value="record-audio">Audio aufnehmen</option>
                  <option value="toggle-theme">Dark/Light Mode</option>
                </select>
              </div>

              {node.props?.action === 'navigate' && (
                <div>
                  <label className="text-xs text-gray-400">Zielseite</label>
                  <input
                    className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                    placeholder="Seiten-ID"
                    value={node.props?.targetPage ?? ''}
                    onChange={(e) => setProps({ targetPage: e.target.value })}
                  />
                </div>
              )}

              {node.props?.action === 'url' && (
                <div>
                  <label className="text-xs text-gray-400">URL</label>
                  <input
                    className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                    placeholder="https://example.com"
                    value={node.props?.url ?? ''}
                    onChange={(e) => setProps({ url: e.target.value })}
                  />
                </div>
              )}

              {node.props?.action === 'call' && (
                <div>
                  <label className="text-xs text-gray-400">Telefonnummer</label>
                  <input
                    className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                    placeholder="+49 123 456789"
                    value={node.props?.phoneNumber ?? ''}
                    onChange={(e) => setProps({ phoneNumber: e.target.value })}
                  />
                </div>
              )}

              {node.props?.action === 'email' && (
                <div>
                  <label className="text-xs text-gray-400">E-Mail Adresse</label>
                  <input
                    className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                    placeholder="info@example.com"
                    value={node.props?.emailAddress ?? ''}
                    onChange={(e) => setProps({ emailAddress: e.target.value })}
                  />
                </div>
              )}

              {node.props?.action === 'upload-photo' && (
                <>
                  <div>
                    <label className="text-xs text-gray-400">Erlaubte Dateitypen</label>
                    <input
                      className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                      placeholder="image/*"
                      value={typeof node.props?.uploadAccept === 'string' && node.props.uploadAccept ? node.props.uploadAccept : 'image/*'}
                      onChange={(e) => setProps({ uploadAccept: e.target.value })}
                    />
                    <p className="text-[11px] text-neutral-500">z.B. image/* oder image/png,image/jpeg</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Max. Dateigröße (MB)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                      value={
                        typeof node.props?.uploadMaxSizeMb === 'number' && Number.isFinite(node.props.uploadMaxSizeMb)
                          ? node.props.uploadMaxSizeMb
                          : 10
                      }
                      onChange={(e) => {
                        const nextValue = Number(e.target.value);
                        setProps({ uploadMaxSizeMb: Number.isFinite(nextValue) ? Math.max(1, nextValue) : undefined });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Bestätigungstext</label>
                    <input
                      className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                      placeholder="Foto erfolgreich ausgewählt!"
                      value={
                        typeof node.props?.uploadSuccessMessage === 'string' && node.props.uploadSuccessMessage
                          ? node.props.uploadSuccessMessage
                          : 'Foto erfolgreich ausgewählt!'
                      }
                      onChange={(e) => setProps({ uploadSuccessMessage: e.target.value })}
                    />
                    <p className="text-[11px] text-neutral-500">Tipp: Nutze {'{filename}'} als Platzhalter für den Dateinamen.</p>
                  </div>
                </>
              )}
            </div>
          )}

          {node.type === 'image' && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bild</div>
              <div>
                <label className="text-xs text-gray-400">Bild-Quelle</label>
                <input
                  className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                  placeholder="https://example.com/image.jpg"
                  value={node.props?.src ?? ''}
                  onChange={(e) => setProps({ src: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-white/10"
                  onClick={() => imageFileInput.current?.click()}
                >Eigenes Bild auswählen</button>
                <button
                  type="button"
                  onClick={() => void promptImage()}
                  disabled={imageLoading}
                  className={`flex-1 rounded border px-3 py-1.5 text-xs font-medium transition ${
                    imageLoading
                      ? 'cursor-not-allowed border-emerald-400/50 bg-emerald-500/10 text-emerald-200'
                      : 'border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10'
                  }`}
                >{imageLoading ? 'Generiere…' : 'KI Bild generieren'}</button>
              </div>
              {imageError && (
                <div className="rounded border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  {imageError}
                </div>
              )}
              <input
                ref={imageFileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFile}
              />
              <div className="text-xs text-gray-500 italic">
                Hinweis: Eigene Bilder werden lokal als Data-URL gespeichert und im Export berücksichtigt.
              </div>
            </div>
          )}

          {node.type === 'input' && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Eingabefeld</div>
              <div>
                <label className="text-xs text-gray-400">Typ</label>
                <select
                  className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                  value={node.props?.inputType ?? 'text'}
                  onChange={(e) => setProps({ inputType: e.target.value })}
                >
                  <option value="text">Text</option>
                  <option value="email">E-Mail</option>
                  <option value="password">Passwort</option>
                  <option value="tel">Telefon</option>
                  <option value="number">Zahl</option>
                  <option value="date">Datum</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400">Platzhalter / Label</label>
                <input
                  className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                  placeholder="Text"
                  value={node.props?.placeholder ?? node.props?.label ?? ''}
                  onChange={(e) => setProps({ placeholder: e.target.value, label: e.target.value })}
                />
              </div>
            </div>
          )}

          {node.type === 'container' && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Container</div>
              <div>
                <label className="text-xs text-gray-400">Hintergrund</label>
                <input
                  className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                  placeholder="#000000 oder gradient"
                  value={node.props?.bg ?? ''}
                  onChange={(e) => setProps({ bg: e.target.value })}
                />
              </div>
              <button
                type="button"
                onClick={promptContainerGradient}
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-white/10"
              >KI Hintergrund generieren</button>

              {isChatBackgroundContainer && (
                <div className="space-y-3 rounded-xl border border-emerald-400/40 bg-black/30 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-200">Chat-Hintergrund</div>
                  <div>
                    <label className="text-xs text-gray-400">Farbe</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="h-10 w-16 rounded border border-white/10 bg-neutral-900"
                        value={chatBackgroundColorValue}
                        onChange={(event) => setProps({ containerBgColor: event.target.value })}
                      />
                      <input
                        className="flex-1 rounded bg-neutral-900 px-2 py-1.5 text-sm"
                        placeholder="#0f172a"
                        value={chatBackgroundColorInputValue}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setProps({ containerBgColor: nextValue.trim() ? nextValue : undefined });
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500">Leer lassen für den Standard-Verlauf.</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Bild-URL (optional)</label>
                    <input
                      className="w-full rounded bg-neutral-900 px-2 py-1.5 text-sm"
                      placeholder="https://…"
                      value={node.props?.containerBgImageUrl ?? ''}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setProps({ containerBgImageUrl: nextValue.trim() ? nextValue : undefined });
                      }}
                    />
                    <p className="text-[11px] text-neutral-500">Unterstützt eigene Uploads oder öffentliche URLs.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="flex-1 rounded border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
                      onClick={() => containerBackgroundFileInput.current?.click()}
                    >Eigenes Bild hochladen</button>
                    <button
                      type="button"
                      className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-200 transition enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => setProps({ containerBgImageUrl: undefined })}
                      disabled={!chatBackgroundImageActive}
                    >Bild entfernen</button>
                  </div>
                  <input
                    ref={containerBackgroundFileInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleContainerBackgroundFile}
                  />
                  <div>
                    <label className="text-xs text-gray-400">Vorschau</label>
                    <div
                      className="mt-1 h-20 rounded-lg border border-white/10 bg-neutral-900"
                      style={chatBackgroundPreviewStyle}
                    />
                  </div>

                  {chatBackgroundImageActive && (
                    <div className="space-y-2 border-t border-white/10 pt-2">
                      <div className="space-y-1 text-[11px] text-neutral-400">
                        <div className="flex items-center justify-between">
                          <span>Horizontal</span>
                          <span>{chatBackgroundPosX}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={chatBackgroundPosX}
                          onChange={(event) => setProps({ containerBgImagePosX: Number(event.target.value) })}
                          className="w-full accent-emerald-400"
                        />
                      </div>
                      <div className="space-y-1 text-[11px] text-neutral-400">
                        <div className="flex items-center justify-between">
                          <span>Vertikal</span>
                          <span>{chatBackgroundPosY}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={chatBackgroundPosY}
                          onChange={(event) => setProps({ containerBgImagePosY: Number(event.target.value) })}
                          className="w-full accent-emerald-400"
                        />
                      </div>
                      <div className="space-y-1 text-[11px] text-neutral-400">
                        <div className="flex items-center justify-between">
                          <span>Skalierung</span>
                          <span>{chatBackgroundSize}%</span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={300}
                          step={5}
                          value={chatBackgroundSize}
                          onChange={(event) => setProps({ containerBgImageSize: Number(event.target.value) })}
                          className="w-full accent-emerald-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isQrContainer && (
                <div className="space-y-3 rounded-xl border border-blue-400/40 bg-blue-500/5 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-200">QR-Code</div>
                  <div>
                    <label className="text-xs text-gray-400">QR-Ziel / Inhalt</label>
                    <input
                      className="w-full rounded bg-neutral-900 px-2 py-1.5 text-sm"
                      placeholder="https://deine-app.com oder Text"
                      value={qrUrlValue}
                      onChange={(event) => setProps({ qrUrl: event.target.value })}
                    />
                    <p className="text-[11px] text-neutral-500">Wird für den automatisch generierten QR-Code verwendet.</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Hintergrundfarbe</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="h-10 w-16 rounded border border-white/10 bg-neutral-900"
                        value={qrBackgroundColorValue}
                        onChange={(event) => setProps({ qrBackgroundColor: event.target.value })}
                      />
                      <input
                        className="flex-1 rounded bg-neutral-900 px-2 py-1.5 text-sm"
                        placeholder="#020617"
                        value={qrBackgroundColorInputValue}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setProps({ qrBackgroundColor: nextValue.trim() ? nextValue : undefined });
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Eigenes QR-Bild (URL)</label>
                    <input
                      className="w-full rounded bg-neutral-900 px-2 py-1.5 text-sm"
                      placeholder="https://cdn.example.com/qr.png"
                      value={qrImageOverrideValue}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setProps({ qrImageOverride: nextValue.trim() ? nextValue : undefined });
                      }}
                    />
                    <p className="text-[11px] text-neutral-500">Lade alternativ ein eigenes QR-Bild hoch.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="flex-1 rounded border border-blue-400/40 bg-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-50 transition hover:bg-blue-500/30"
                      onClick={() => qrImageFileInput.current?.click()}
                    >Eigenes Bild hochladen</button>
                    <button
                      type="button"
                      className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-200 transition enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => setProps({ qrImageOverride: undefined })}
                      disabled={!qrHasCustomImage}
                    >Auf automatisch zurücksetzen</button>
                  </div>
                  <input
                    ref={qrImageFileInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleQrImageFile}
                  />
                  <div>
                    <label className="text-xs text-gray-400">Vorschau</label>
                    <div
                      className="mt-2 flex flex-col items-center gap-2 rounded-lg border border-white/10 p-3"
                      style={{ backgroundColor: qrBackgroundColorValue }}
                    >
                      <div className="rounded-xl bg-white p-2">
                        <img
                          src={qrPreviewImage}
                          alt="QR Code Vorschau"
                          className="h-32 w-32 object-contain"
                        />
                      </div>
                      {qrUrlValue?.trim() && (
                        <div className="text-center text-[10px] text-blue-100/80 break-all">
                          Scan: {qrUrlValue.trim()}
                        </div>
                      )}
                      {qrHasCustomImage && (
                        <div className="text-[10px] uppercase tracking-[0.2em] text-blue-200">Eigenes QR-Bild</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {isMapContainer && (
                <div className="space-y-3 rounded-xl border border-cyan-500/40 bg-cyan-500/5 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200">Kartenansicht</div>
                  <div>
                    <label className="text-xs text-gray-400">Standort / Suchbegriff</label>
                    <input
                      className="w-full rounded bg-neutral-900 px-2 py-1.5 text-sm"
                      placeholder="z.B. Berlin, Germany"
                      value={mapLocationValue}
                      onChange={(event) => handleMapFieldChange('mapLocation', event.target.value)}
                    />
                    <p className="text-[11px] text-neutral-500">Beliebiger Ort, Adresse oder Koordinate für das eingebettete Maps-Widget.</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Modus</label>
                    <select
                      className="w-full rounded bg-neutral-900 px-2 py-1.5 text-sm"
                      value={mapModeValue}
                      onChange={(event) => handleMapModeChange(event.target.value as MapMode)}
                    >
                      {MAP_MODE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-neutral-500">{selectedMapMode?.description}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Badge-Label (optional)</label>
                    <input
                      className="w-full rounded bg-neutral-900 px-2 py-1.5 text-sm"
                      placeholder={selectedMapMode?.label}
                      value={mapModeLabelValue}
                      onChange={(event) => handleMapFieldChange('mapModeLabel', event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Beschreibung / Info</label>
                    <textarea
                      className="w-full rounded bg-neutral-900 px-2 py-1.5 text-sm min-h-[60px]"
                      placeholder="Beschreibe, was die Karte zeigt."
                      value={mapInfoValue}
                      onChange={(event) => handleMapFieldChange('mapInfo', event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">CTA-Label</label>
                    <input
                      className="w-full rounded bg-neutral-900 px-2 py-1.5 text-sm"
                      placeholder={selectedMapMode?.action ?? 'Aktion ausführen'}
                      value={mapActionLabelValue}
                      onChange={(event) => handleMapFieldChange('mapActionLabel', event.target.value)}
                    />
                  </div>
                </div>
              )}

              {isAvatarCreator && (
                <div className="space-y-3 rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/5 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-fuchsia-200">Avatar Creator</div>
                  <p className="text-[11px] text-neutral-300">Beschreibe Eigenschaften und Aktionen, die der Avatar-Baustein anzeigen soll.</p>
                  <div>
                    <label className="text-xs text-gray-400">Titel</label>
                    <input
                      className="w-full rounded bg-neutral-900 px-2 py-1.5 text-sm"
                      placeholder="AI Avatar erstellen"
                      value={avatarTitleValue}
                      onChange={(event) => {
                        const next = event.target.value;
                        setProps({ avatarTitle: next.trim() ? next : undefined });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Beschreibung</label>
                    <textarea
                      className="w-full rounded bg-neutral-900 px-2 py-1.5 text-sm min-h-[60px]"
                      placeholder="Passe Gesicht, Outfit und Stimmung mit wenigen Klicks an."
                      value={avatarDescriptionValue}
                      onChange={(event) => {
                        const next = event.target.value;
                        setProps({ avatarDescription: next.trim() ? next : undefined });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Vorschau-Bild (URL)</label>
                    <input
                      className="w-full rounded bg-neutral-900 px-2 py-1.5 text-sm"
                      placeholder="https://.../avatar.png"
                      value={avatarPreviewUrlValue}
                      onChange={(event) => {
                        const next = event.target.value;
                        setProps({ avatarPreviewUrl: next.trim() ? next : undefined });
                      }}
                    />
                    <p className="text-[11px] text-neutral-400">Füge ein PNG/JPG oder Data-URL ein. Ohne Wert wird ein Platzhalter gezeigt.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-gray-400">Akzentfarbe</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          className="h-10 w-16 rounded border border-white/10 bg-neutral-900"
                          value={avatarAccentColorValue}
                          onChange={(event) => setProps({ avatarAccentColor: event.target.value })}
                        />
                        <input
                          className="flex-1 rounded bg-neutral-900 px-2 py-1.5 text-sm"
                          placeholder="#f472b6"
                          value={avatarAccentColorInputValue}
                          onChange={(event) => {
                            const next = event.target.value;
                            setProps({ avatarAccentColor: next.trim() ? next : undefined });
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Hintergrundfarbe</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          className="h-10 w-16 rounded border border-white/10 bg-neutral-900"
                          value={avatarBackgroundColorValue}
                          onChange={(event) => setProps({ avatarBackgroundColor: event.target.value })}
                        />
                        <input
                          className="flex-1 rounded bg-neutral-900 px-2 py-1.5 text-sm"
                          placeholder="#1a0f1f"
                          value={avatarBackgroundColorInputValue}
                          onChange={(event) => {
                            const next = event.target.value;
                            setProps({ avatarBackgroundColor: next.trim() ? next : undefined });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Eigenschaften</span>
                      <button
                        type="button"
                        className="text-fuchsia-200 transition hover:text-fuchsia-100"
                        onClick={handleAddAvatarTrait}
                      >+ Eigenschaft</button>
                    </div>
                    {avatarTraits.length === 0 && (
                      <div className="rounded border border-dashed border-white/15 bg-black/20 p-3 text-[11px] text-neutral-400">
                        Noch keine Eigenschaften hinterlegt. Füge Felder wie Style, Mood oder Material hinzu.
                      </div>
                    )}
                    {avatarTraits.map((trait, index) => (
                      <div key={trait.id} className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span>Eigenschaft {index + 1}</span>
                          <button
                            type="button"
                            className="text-rose-300 transition hover:text-rose-200"
                            onClick={() => handleRemoveAvatarTrait(trait.id)}
                          >Entfernen</button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <div className="sm:col-span-1">
                            <label className="text-xs text-gray-400">Label</label>
                            <input
                              className="w-full rounded bg-neutral-900 px-2 py-1.5 text-sm"
                              value={trait.label}
                              onChange={(event) => handleAvatarTraitChange(trait.id, { label: event.target.value })}
                            />
                          </div>
                          <div className="sm:col-span-1">
                            <label className="text-xs text-gray-400">Wert</label>
                            <input
                              className="w-full rounded bg-neutral-900 px-2 py-1.5 text-sm"
                              value={trait.value}
                              onChange={(event) => handleAvatarTraitChange(trait.id, { value: event.target.value })}
                            />
                          </div>
                          <div className="sm:col-span-1">
                            <label className="text-xs text-gray-400">Icon (optional)</label>
                            <input
                              className="w-full rounded bg-neutral-900 px-2 py-1.5 text-sm"
                              placeholder="z.B. ✨"
                              value={trait.icon ?? ''}
                              onChange={(event) => handleAvatarTraitChange(trait.id, { icon: event.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Aktionen / Buttons</span>
                      <button
                        type="button"
                        className="text-fuchsia-200 transition hover:text-fuchsia-100"
                        onClick={handleAddAvatarAction}
                      >+ Aktion</button>
                    </div>
                    {avatarActions.length === 0 && (
                      <div className="rounded border border-dashed border-white/15 bg-black/20 p-3 text-[11px] text-neutral-400">
                        Lege Buttons wie "Zufall generieren" oder "Download" an.
                      </div>
                    )}
                    {avatarActions.map((action, index) => {
                      const actionAccent = typeof action.accent === 'string' && action.accent.trim()
                        ? action.accent
                        : avatarAccentColorValue;
                      return (
                        <div key={action.id} className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                          <div className="flex items-center justify-between text-[11px] text-neutral-400">
                            <span>Aktion {index + 1}</span>
                            <button
                              type="button"
                              className="text-rose-300 transition hover:text-rose-200"
                              onClick={() => handleRemoveAvatarAction(action.id)}
                            >Entfernen</button>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Label</label>
                            <input
                              className="w-full rounded bg-neutral-900 px-2 py-1.5 text-sm"
                              value={action.label}
                              onChange={(event) => handleAvatarActionChange(action.id, { label: event.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Beschreibung</label>
                            <textarea
                              className="w-full rounded bg-neutral-900 px-2 py-1.5 text-sm min-h-[48px]"
                              value={action.description ?? ''}
                              placeholder="Beschreibt, was der Button ausführt."
                              onChange={(event) => handleAvatarActionChange(action.id, { description: event.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                              <label className="text-xs text-gray-400">Icon (optional)</label>
                              <input
                                className="w-full rounded bg-neutral-900 px-2 py-1.5 text-sm"
                                placeholder="z.B. 🎲"
                                value={action.icon ?? ''}
                                onChange={(event) => handleAvatarActionChange(action.id, { icon: event.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400">Akzentfarbe</label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  className="h-10 w-16 rounded border border-white/10 bg-neutral-900"
                                  value={actionAccent}
                                  onChange={(event) => handleAvatarActionChange(action.id, { accent: event.target.value })}
                                />
                                <input
                                  className="flex-1 rounded bg-neutral-900 px-2 py-1.5 text-sm"
                                  placeholder="#f472b6"
                                  value={action.accent ?? ''}
                                  onChange={(event) => {
                                    const next = event.target.value;
                                    handleAvatarActionChange(action.id, { accent: next.trim() ? next : undefined });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isNavbarContainer && (
                <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Navigation</div>
                  <p className="text-[11px] text-neutral-400">
                    Passe Label, Icon und Ziel für jede Kachel an. Aktionen funktionieren genauso wie bei Buttons.
                  </p>
                  {navItems.map((item, index) => {
                    const needsGenericTarget = ['call', 'email', 'chat', 'support-ticket'].includes(item.action);
                    const navIconValue = typeof item.icon === 'string' ? item.icon : '';
                    const navIconPresetSelection = (() => {
                      const preset = NAV_ICON_PRESETS.find((candidate) => candidate.value === navIconValue);
                      if (preset) return preset.id;
                      return navIconValue ? 'custom' : 'none';
                    })();
                    return (
                      <div key={item.id} className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span>Eintrag {index + 1}</span>
                          <button
                            type="button"
                            className="text-rose-300 transition hover:text-rose-200"
                            onClick={() => handleRemoveNavItem(item.id)}
                          >Entfernen</button>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Label</label>
                          <input
                            className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                            value={item.label}
                            onChange={(e) => handleNavItemChange(item.id, { label: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Icon (optional)</label>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                              className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                              placeholder="z.B. 📊"
                              value={navIconValue}
                              onChange={(e) => handleNavItemChange(item.id, { icon: e.target.value })}
                            />
                            <select
                              className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm sm:max-w-[180px]"
                              value={navIconPresetSelection}
                              onChange={(event) => {
                                const { value } = event.target;
                                if (value === 'custom') {
                                  return;
                                }
                                const preset = NAV_ICON_PRESETS.find((candidate) => candidate.id === value);
                                handleNavItemChange(item.id, { icon: preset?.value || undefined });
                              }}
                            >
                              {NAV_ICON_PRESETS.map((preset) => (
                                <option key={preset.id} value={preset.id}>{preset.label}</option>
                              ))}
                              <option value="custom">Eigenes Icon</option>
                            </select>
                          </div>
                          <p className="text-[11px] text-neutral-500">Wähle ein Preset oder tippe ein beliebiges Emoji / Symbol.</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Aktion</label>
                          <select
                            className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                            value={item.action}
                            onChange={(e) => handleNavItemChange(item.id, { action: e.target.value as NavbarItem['action'] })}
                          >
                            <option value="navigate">Seite wechseln</option>
                            <option value="url">Website öffnen</option>
                            <option value="chat">Chat starten</option>
                            <option value="call">Anrufen</option>
                            <option value="email">E-Mail senden</option>
                            <option value="support-ticket">Support-Ticket</option>
                            <option value="login">Login</option>
                            <option value="logout">Logout</option>
                            <option value="register">Registrierung</option>
                            <option value="reset-password">Passwort zurücksetzen</option>
                            <option value="toggle-theme">Dark/Light Mode</option>
                          </select>
                        </div>

                        {item.action === 'navigate' && (
                          <>
                            <div>
                              <label className="text-xs text-gray-400">Zielseite (Name oder ID)</label>
                              <input
                                className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                                placeholder="z.B. Unternehmen"
                                value={item.targetPage ?? ''}
                                onChange={(e) => handleNavItemChange(item.id, { targetPage: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400">Eigenes Ziel / Anker (optional)</label>
                              <input
                                className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                                placeholder="#unternehmen oder /dashboard"
                                value={item.target ?? ''}
                                onChange={(e) => handleNavItemChange(item.id, { target: e.target.value })}
                              />
                            </div>
                          </>
                        )}

                        {item.action === 'url' && (
                          <div>
                            <label className="text-xs text-gray-400">URL</label>
                            <input
                              className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                              placeholder="https://example.com"
                              value={item.url ?? ''}
                              onChange={(e) => handleNavItemChange(item.id, { url: e.target.value })}
                            />
                          </div>
                        )}

                        {needsGenericTarget && (
                          <div>
                            <label className="text-xs text-gray-400">Ziel (Telefon, E-Mail oder Kanal)</label>
                            <input
                              className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                              placeholder="z.B. +49 123 456"
                              value={item.target ?? ''}
                              onChange={(e) => handleNavItemChange(item.id, { target: e.target.value })}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleAddNavItem}
                    className="w-full rounded border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
                  >+ Navigationseintrag</button>
                </div>
              )}

              {isTimeTrackingContainer && (
                <div className="space-y-3 rounded-xl border border-sky-500/40 bg-sky-500/5 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">Zeiterfassung</div>
                  <p className="text-[11px] text-neutral-400">
                    Bearbeite Aufgaben, Laufzeiten und Start-/Endzeiten. Über die Buttons kannst du Einträge starten oder beenden.
                  </p>
                  {timeEntries.length === 0 && (
                    <div className="rounded-lg border border-dashed border-sky-500/40 bg-black/20 p-3 text-[11px] text-neutral-400">
                      Noch keine Einträge vorhanden. Lege unten neue Einträge an oder stelle die Demo-Daten wieder her.
                    </div>
                  )}
                  {timeEntries.map((entry, index) => {
                    const isRunning = !entry.endedAt;
                    const startedLocal = toDateTimeLocal(entry.startedAt);
                    const endedLocal = toDateTimeLocal(entry.endedAt);
                    const minutes = Number.isFinite(entry.seconds) ? Math.round((entry.seconds ?? 0) / 60) : 0;
                    return (
                      <div key={entry.id} className="space-y-2 rounded-lg border border-white/10 bg-black/40 p-3">
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span>Eintrag {index + 1}</span>
                          <div className="flex items-center gap-2">
                            <span className={isRunning ? 'text-lime-300' : 'text-neutral-500'}>
                              {isRunning ? 'Laufend' : 'Gestoppt'}
                            </span>
                            <button
                              type="button"
                              className="text-rose-300 transition hover:text-rose-200"
                              onClick={() => handleRemoveTimeEntry(entry.id)}
                            >Entfernen</button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Label</label>
                          <input
                            className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                            value={entry.label}
                            onChange={(e) => handleTimeEntryChange(entry.id, { label: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Dauer (Minuten)</label>
                          <input
                            type="number"
                            min={0}
                            className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                            value={Number.isFinite(minutes) ? minutes : 0}
                            onChange={(e) => {
                              const parsed = Number(e.target.value);
                              const sanitizedMinutes = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
                              handleTimeEntryChange(entry.id, { seconds: sanitizedMinutes * 60 });
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-400">Gestartet</label>
                            <input
                              type="datetime-local"
                              className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                              value={startedLocal}
                              onChange={(e) => handleTimeEntryChange(entry.id, { startedAt: fromDateTimeLocal(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Gestoppt</label>
                            <input
                              type="datetime-local"
                              className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                              value={endedLocal}
                              onChange={(e) => handleTimeEntryChange(entry.id, { endedAt: fromDateTimeLocal(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className={`flex-1 rounded border px-3 py-1.5 text-xs font-semibold transition ${
                              isRunning
                                ? 'border-rose-400/50 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20'
                                : 'border-lime-400/40 bg-lime-500/20 text-lime-100 hover:bg-lime-500/30'
                            }`}
                            onClick={() => handleTimeEntryStatusChange(entry.id, isRunning ? 'done' : 'running')}
                          >{isRunning ? 'Stoppen' : 'Starten'}</button>
                          <button
                            type="button"
                            className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-neutral-200 hover:bg-white/10"
                            onClick={() => handleTimeEntryChange(entry.id, { endedAt: undefined })}
                          >Reset Endzeit</button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleAddTimeEntry}
                      className="flex-1 rounded border border-sky-400/50 bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-100 transition hover:bg-sky-500/30"
                    >+ Eintrag</button>
                    <button
                      type="button"
                      onClick={handleClearTimeEntries}
                      disabled={timeEntries.length === 0}
                      className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >Alle löschen</button>
                    <button
                      type="button"
                      onClick={handleRestoreDemoEntries}
                      className="w-full rounded border border-dotted border-sky-300/40 px-3 py-1.5 text-xs font-semibold text-sky-200 transition hover:bg-sky-500/10"
                    >Demo-Daten wiederherstellen</button>
                  </div>
                </div>
              )}

              {isStatusBoardContainer && statusBoardState && (
                <div className="space-y-3 rounded-xl border border-cyan-500/40 bg-cyan-500/5 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Status Board</div>
                  <p className="text-[11px] text-neutral-400">Definiere eigene Stati, Farben und Beschreibungen. Über den Stern setzt du den aktiven Status.</p>
                  <div>
                    <label className="text-xs text-gray-400">Titel</label>
                    <input
                      className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                      value={statusBoardState.title}
                      onChange={(e) => handleStatusBoardTitleChange(e.target.value)}
                    />
                  </div>
                  {statusBoardState.options.length === 0 && (
                    <div className="rounded-lg border border-dashed border-white/20 bg-black/20 px-3 py-2 text-[11px] text-neutral-400">
                      Noch keine Statuswerte angelegt. Füge unten neue Stati hinzu.
                    </div>
                  )}
                  {statusBoardState.options.map((option, index) => {
                    const isActive = option.id === statusBoardState.activeId;
                    return (
                      <div key={option.id} className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span>Status {index + 1}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                                isActive
                                  ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100'
                                  : 'border-white/15 bg-white/5 text-neutral-400 hover:bg-white/10'
                              }`}
                              onClick={() => handleSetActiveStatus(option.id)}
                            >{isActive ? 'Aktiv' : 'Aktivieren'}</button>
                            <button
                              type="button"
                              className="text-rose-300 transition hover:text-rose-200"
                              onClick={() => handleRemoveStatusOption(option.id)}
                            >Entfernen</button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Label</label>
                          <input
                            className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                            value={option.label}
                            onChange={(e) => handleStatusOptionChange(option.id, { label: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Beschreibung (optional)</label>
                          <textarea
                            className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm min-h-[60px]"
                            value={option.description ?? ''}
                            onChange={(e) => handleStatusOptionChange(option.id, { description: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Farbe</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              className="h-10 w-16 rounded border border-white/10 bg-neutral-900"
                              value={option.color ?? '#22c55e'}
                              onChange={(e) => handleStatusOptionChange(option.id, { color: e.target.value })}
                            />
                            <input
                              className="flex-1 bg-neutral-800 rounded px-2 py-1.5 text-sm"
                              placeholder="#22c55e"
                              value={option.color ?? ''}
                              onChange={(e) => handleStatusOptionChange(option.id, { color: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleAddStatusOption}
                    className="w-full rounded border border-cyan-400/40 bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/30"
                  >+ Status</button>
                </div>
              )}

              {isFolderStructureContainer && (
                <div className="space-y-3 rounded-xl border border-blue-500/40 bg-blue-500/5 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">Ordnerstruktur</div>
                  <p className="text-[11px] text-neutral-400">Lege fest, welche Ordner beim Einfügen des Bausteins bereits vorhanden sind.</p>
                  {folderPresets.length === 0 && (
                    <div className="rounded border border-dashed border-white/10 px-3 py-2 text-[11px] text-neutral-400">Noch keine Ordner hinterlegt.</div>
                  )}
                  {folderPresets.map((preset, index) => (
                    <div key={preset.id} className="space-y-2 rounded-lg border border-white/10 bg-black/40 p-3">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400">
                        <span>Ordner {index + 1}</span>
                        <button
                          type="button"
                          className="text-rose-300 transition hover:text-rose-100"
                          onClick={() => handleRemoveFolderPreset(preset.id)}
                        >Entfernen</button>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Name</label>
                        <input
                          className="w-full rounded bg-neutral-800 px-2 py-1.5 text-sm"
                          value={preset.name}
                          onChange={(event) => handleFolderPresetChange(preset.id, event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400">Unterordner (optional)</label>
                        {preset.children.map((child) => (
                          <div key={child.id} className="flex items-center gap-2">
                            <input
                              className="flex-1 rounded bg-neutral-800 px-2 py-1.5 text-sm"
                              value={child.name}
                              onChange={(event) => handleFolderChildChange(preset.id, child.id, event.target.value)}
                            />
                            <button
                              type="button"
                              className="rounded border border-white/10 px-2 py-1 text-[11px] text-neutral-300 hover:bg-white/10"
                              onClick={() => handleRemoveFolderChild(preset.id, child.id)}
                            >✕</button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="w-full rounded border border-blue-400/40 bg-blue-500/10 px-2 py-1 text-[11px] text-blue-100 hover:bg-blue-500/20"
                          onClick={() => handleAddFolderChild(preset.id)}
                        >+ Unterordner</button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="w-full rounded border border-blue-400/40 bg-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-50 transition hover:bg-blue-500/30"
                    onClick={handleAddFolderPreset}
                  >+ Ordner</button>
                </div>
              )}

              {isTaskManagerContainer && (
                <div className="space-y-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Aufgabenverteilung</div>
                  <p className="text-[11px] text-neutral-400">Bereite Aufgaben für dein Team vor. Sie erscheinen direkt im Widget.</p>
                  {taskManagerItems.length === 0 && (
                    <div className="rounded border border-dashed border-white/10 px-3 py-2 text-[11px] text-neutral-400">Noch keine Aufgaben angelegt.</div>
                  )}
                  {taskManagerItems.map((task, index) => (
                    <div key={task.id} className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400">
                        <span>Aufgabe {index + 1}</span>
                        <button
                          type="button"
                          className="text-rose-300 transition hover:text-rose-200"
                          onClick={() => handleRemoveTaskItem('tasks', task.id)}
                        >Entfernen</button>
                      </div>
                      <input
                        className="w-full rounded bg-neutral-800 px-2 py-1.5 text-sm"
                        value={task.title}
                        onChange={(event) => handleTaskItemChange('tasks', task.id, { title: event.target.value })}
                      />
                      <label className="flex items-center gap-2 text-[11px] text-neutral-400">
                        <input
                          type="checkbox"
                          className="h-3 w-3"
                          checked={task.done}
                          onChange={(event) => handleTaskItemChange('tasks', task.id, { done: event.target.checked })}
                        />
                        Erledigt
                      </label>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="w-full rounded border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-500/30"
                    onClick={() => handleAddTaskItem('tasks')}
                  >+ Aufgabe</button>
                </div>
              )}

              {isAnalyticsContainer && (
                <div className="space-y-3 rounded-xl border border-sky-500/40 bg-sky-500/5 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">Analytics</div>
                  <p className="text-[11px] text-neutral-400">Karten und Highlight-Text bestimmen, welche Zahlen der Baustein zeigt.</p>
                  {analyticsMetrics.length === 0 && (
                    <div className="rounded border border-dashed border-white/10 px-3 py-2 text-[11px] text-neutral-400">Noch keine Kennzahlen.</div>
                  )}
                  {analyticsMetrics.map((metric, index) => (
                    <div key={metric.id} className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400">
                        <span>Kennzahl {index + 1}</span>
                        <button
                          type="button"
                          className="text-rose-300 transition hover:text-rose-200"
                          onClick={() => handleRemoveAnalyticsMetric(metric.id)}
                        >Entfernen</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400">Label</label>
                          <input
                            className="w-full rounded bg-neutral-800 px-2 py-1.5 text-sm"
                            value={metric.label}
                            onChange={(event) => handleAnalyticsMetricChange(metric.id, { label: event.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Wert</label>
                          <input
                            className="w-full rounded bg-neutral-800 px-2 py-1.5 text-sm"
                            value={metric.value}
                            onChange={(event) => handleAnalyticsMetricChange(metric.id, { value: event.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Beschreibung (optional)</label>
                        <input
                          className="w-full rounded bg-neutral-800 px-2 py-1.5 text-sm"
                          value={metric.description ?? ''}
                          onChange={(event) => handleAnalyticsMetricChange(metric.id, { description: event.target.value })}
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="w-full rounded border border-sky-400/40 bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-50 transition hover:bg-sky-500/30"
                    onClick={handleAddAnalyticsMetric}
                  >+ Kennzahl</button>
                  <div>
                    <label className="text-xs text-gray-400">Highlight / Kampagne</label>
                    <input
                      className="w-full rounded bg-neutral-800 px-2 py-1.5 text-sm"
                      placeholder="Top-Kampagne: 🚀 Launch KW12"
                      value={analyticsHighlightValue}
                      onChange={(event) => handleAnalyticsHighlightChange(event.target.value)}
                    />
                  </div>
                </div>
              )}

              {isSupportContainer && (
                <div className="space-y-3 rounded-xl border border-cyan-500/40 bg-cyan-500/5 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Support & Tickets</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400">Kanal</label>
                      <select
                        className="w-full rounded bg-neutral-800 px-2 py-1.5 text-sm"
                        value={supportChannelValue}
                        onChange={(event) => handleSupportChannelChange(event.target.value as 'ticket' | 'email' | 'chat')}
                      >
                        <option value="ticket">Ticket</option>
                        <option value="email">E-Mail</option>
                        <option value="chat">Chat</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Ziel (E-Mail / Chat-ID)</label>
                      <input
                        className="w-full rounded bg-neutral-800 px-2 py-1.5 text-sm"
                        value={supportTargetValue}
                        placeholder="support@appschmiede.dev"
                        onChange={(event) => handleSupportTargetChange(event.target.value)}
                      />
                    </div>
                  </div>
                  {supportTickets.length === 0 && (
                    <div className="rounded border border-dashed border-white/10 px-3 py-2 text-[11px] text-neutral-400">Noch keine Tickets hinterlegt.</div>
                  )}
                  {supportTickets.map((ticket, index) => (
                    <div key={ticket.id} className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400">
                        <span>Ticket {index + 1}</span>
                        <button
                          type="button"
                          className="text-rose-300 transition hover:text-rose-200"
                          onClick={() => handleRemoveSupportTicket(ticket.id)}
                        >Entfernen</button>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Betreff</label>
                        <input
                          className="w-full rounded bg-neutral-800 px-2 py-1.5 text-sm"
                          value={ticket.subject}
                          onChange={(event) => handleSupportTicketChange(ticket.id, { subject: event.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Nachricht (optional)</label>
                        <textarea
                          className="w-full rounded bg-neutral-800 px-2 py-1.5 text-sm min-h-[60px]"
                          value={ticket.message ?? ''}
                          onChange={(event) => handleSupportTicketChange(ticket.id, { message: event.target.value })}
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="w-full rounded border border-cyan-400/40 bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-50 transition hover:bg-cyan-500/30"
                    onClick={handleAddSupportTicket}
                  >+ Ticket</button>
                </div>
              )}

              {isTableContainer && tableConfig && (
                <div className="space-y-3 rounded-xl border border-yellow-500/40 bg-yellow-500/5 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-200">Tabelle</div>
                  <div>
                    <label className="text-xs text-gray-400">Titel</label>
                    <input
                      className="w-full rounded bg-neutral-800 px-2 py-1.5 text-sm"
                      value={tableConfig.title}
                      onChange={(event) => handleTableTitleChange(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-neutral-400">
                      <span>Spalten</span>
                      <button
                        type="button"
                        className="text-yellow-200 transition hover:text-yellow-100"
                        onClick={handleAddTableColumn}
                      >+ Spalte</button>
                    </div>
                    {tableConfig.columns.map((column) => (
                      <div key={column.id} className="flex items-center gap-2">
                        <input
                          className="flex-1 rounded bg-neutral-800 px-2 py-1.5 text-sm"
                          value={column.label}
                          onChange={(event) => handleTableColumnChange(column.id, event.target.value)}
                        />
                        <button
                          type="button"
                          disabled={tableConfig.columns.length === 1}
                          className="rounded border border-white/10 px-2 py-1 text-[11px] text-neutral-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => handleRemoveTableColumn(column.id)}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-neutral-400">
                      <span>Zeilen</span>
                      <button
                        type="button"
                        className="text-yellow-200 transition hover:text-yellow-100"
                        onClick={handleAddTableRow}
                      >+ Zeile</button>
                    </div>
                    {tableConfig.rows.length === 0 && (
                      <div className="rounded border border-dashed border-white/10 px-3 py-2 text-[11px] text-neutral-400">Noch keine Zeilen hinterlegt.</div>
                    )}
                    {tableConfig.rows.map((row) => (
                      <div key={row.id} className="space-y-1 rounded-lg border border-white/10 bg-black/30 p-2">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="text-rose-300 text-[11px] hover:text-rose-200"
                            onClick={() => handleRemoveTableRow(row.id)}
                          >Zeile entfernen</button>
                        </div>
                        <div className="grid gap-2" style={{ gridTemplateColumns: buildGridTemplate(tableConfig.columns.length) }}>
                          {tableConfig.columns.map((column, columnIndex) => (
                            <input
                              key={`${row.id}-${column.id}`}
                              className="rounded bg-neutral-800 px-2 py-1.5 text-sm"
                              value={row.values[columnIndex] ?? ''}
                              placeholder={column.label}
                              onChange={(event) => handleTableRowChange(row.id, columnIndex, event.target.value)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isNewsContainer && newsFeed && (
                <div className="space-y-3 rounded-xl border border-rose-500/40 bg-rose-500/5 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-200">News</div>
                  <div>
                    <label className="text-xs text-gray-400">Titel</label>
                    <input
                      className="w-full rounded bg-neutral-800 px-2 py-1.5 text-sm"
                      value={newsFeed.title}
                      onChange={(event) => handleNewsTitleChange(event.target.value)}
                      placeholder="News"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-neutral-400">
                      <span>Einträge</span>
                      <button
                        type="button"
                        className="text-rose-200 transition hover:text-rose-100"
                        onClick={handleAddNewsItem}
                      >+ Eintrag</button>
                    </div>
                    {newsFeed.items.length === 0 && (
                      <div className="rounded border border-dashed border-white/10 px-3 py-2 text-[11px] text-neutral-400">Noch keine Einträge.</div>
                    )}

                    {newsFeed.items.map((item, index) => (
                      <div key={item.id} className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span>Eintrag {index + 1}</span>
                          <button
                            type="button"
                            className="text-rose-300 transition hover:text-rose-200"
                            onClick={() => handleRemoveNewsItem(item.id)}
                          >Entfernen</button>
                        </div>

                        <div>
                          <label className="text-xs text-gray-400">Titel</label>
                          <input
                            className="w-full rounded bg-neutral-800 px-2 py-1.5 text-sm"
                            value={item.title}
                            onChange={(event) => handleNewsItemChange(item.id, { title: event.target.value })}
                            placeholder="Titel"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-400">Datum (optional)</label>
                          <input
                            className="w-full rounded bg-neutral-800 px-2 py-1.5 text-sm"
                            value={item.date ?? ''}
                            onChange={(event) => handleNewsItemChange(item.id, { date: event.target.value })}
                            placeholder="2025-01-31"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-400">Bild-URL (optional)</label>
                          <input
                            className="w-full rounded bg-neutral-800 px-2 py-1.5 text-sm"
                            value={item.imageUrl ?? ''}
                            onChange={(event) => handleNewsItemChange(item.id, { imageUrl: event.target.value })}
                            placeholder="https://..."
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-400">Text (optional)</label>
                          <textarea
                            className="w-full rounded bg-neutral-800 px-2 py-1.5 text-sm min-h-[70px]"
                            value={item.body ?? ''}
                            onChange={(event) => handleNewsItemChange(item.id, { body: event.target.value })}
                            placeholder="Kurzbeschreibung..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isTodoContainer && (
                <div className="space-y-3 rounded-xl border border-purple-500/40 bg-purple-500/5 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-200">Todo-Liste</div>
                  <p className="text-[11px] text-neutral-400">Definiere Einträge, die sofort im Widget erscheinen.</p>
                  {todoItems.length === 0 && (
                    <div className="rounded border border-dashed border-white/10 px-3 py-2 text-[11px] text-neutral-400">Noch keine Todos.</div>
                  )}
                  {todoItems.map((item, index) => (
                    <div key={item.id} className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400">
                        <span>Todo {index + 1}</span>
                        <button
                          type="button"
                          className="text-rose-300 transition hover:text-rose-200"
                          onClick={() => handleRemoveTaskItem('todoItems', item.id)}
                        >Entfernen</button>
                      </div>
                      <input
                        className="w-full rounded bg-neutral-800 px-2 py-1.5 text-sm"
                        value={item.title}
                        onChange={(event) => handleTaskItemChange('todoItems', item.id, { title: event.target.value })}
                      />
                      <label className="flex items-center gap-2 text-[11px] text-neutral-400">
                        <input
                          type="checkbox"
                          className="h-3 w-3"
                          checked={item.done}
                          onChange={(event) => handleTaskItemChange('todoItems', item.id, { done: event.target.checked })}
                        />
                        Erledigt
                      </label>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="w-full rounded border border-purple-400/40 bg-purple-500/20 px-3 py-1.5 text-xs font-semibold text-purple-50 transition hover:bg-purple-500/30"
                    onClick={() => handleAddTaskItem('todoItems')}
                  >+ Todo</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
