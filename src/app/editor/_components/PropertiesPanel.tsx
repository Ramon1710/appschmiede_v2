// path: src/app/editor/_components/PropertiesPanel.tsx
'use client';

import React, { useMemo, useRef, useState } from 'react';
import type { Node as EditorNode, NodeProps, NodeStyle, NavbarItem, TimeEntry, StatusOption, BackgroundLayer } from '@/lib/editorTypes';

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

const STATUS_PRESETS: StatusOption[] = [
  { id: createStatusId(), label: 'Neu', color: '#0EA5E9', description: 'Frisch reingekommen' },
  { id: createStatusId(), label: 'In Arbeit', color: '#A855F7', description: 'Gerade in Bearbeitung' },
  { id: createStatusId(), label: 'Feedback', color: '#F97316', description: 'Wartet auf Feedback' },
  { id: createStatusId(), label: 'Freigegeben', color: '#22C55E', description: 'Bereit zum Launch' },
];

const STATUS_COLOR_CYCLE = ['#0EA5E9', '#A855F7', '#F97316', '#22C55E', '#14B8A6', '#FACC15'];

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
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [backgroundSectionOpen, setBackgroundSectionOpen] = useState(true);
  const isNavbarContainer = node?.type === 'container' && node.props?.component === 'navbar';
  const isTimeTrackingContainer = node?.type === 'container' && node.props?.component === 'time-tracking';
  const isStatusBoardContainer = node?.type === 'container' && node.props?.component === 'status-board';
  const isButtonSelected = node?.type === 'button';
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

  const navItems = useMemo(
    () => (isNavbarContainer ? normalizeNavItems(node?.props?.navItems) : []),
    [isNavbarContainer, node?.props?.navItems]
  );
  const timeEntries = useMemo(
    () => (isTimeTrackingContainer ? normalizeTimeEntries(node?.props?.timeTracking?.entries) : []),
    [isTimeTrackingContainer, node?.props?.timeTracking?.entries]
  );
  const statusBoardState = useMemo(
    () => (isStatusBoardContainer ? normalizeStatusBoard(node?.props?.statusBoard) : null),
    [isStatusBoardContainer, node?.props?.statusBoard]
  );

  const setFrame = (key: 'x' | 'y' | 'w' | 'h', value: number) => {
    if (!node) return;
    if (!Number.isFinite(value)) return;
    onUpdate({ [key]: Math.round(value) } as Partial<EditorNode>);
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

  return (
    <div className="p-4 space-y-4 text-sm bg-[#0b0b0f] h-full overflow-y-auto">
      <div className="font-semibold text-lg border-b border-[#222] pb-2">Eigenschaften</div>

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
          </div>

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
                <input
                  className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                  placeholder="z.B. 🔘 oder ✓"
                  value={node.props?.icon ?? ''}
                  onChange={(e) => setProps({ icon: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Label</label>
                <input
                  className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                  value={node.props?.label ?? ''}
                  onChange={(e) => setProps({ label: e.target.value })}
                />
              </div>
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
                  placeholder="z.B. Name eingeben..."
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

              {isNavbarContainer && (
                <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Navigation</div>
                  <p className="text-[11px] text-neutral-400">
                    Passe Label, Icon und Ziel für jede Kachel an. Aktionen funktionieren genauso wie bei Buttons.
                  </p>
                  {navItems.map((item, index) => {
                    const needsGenericTarget = ['call', 'email', 'chat', 'support-ticket'].includes(item.action);
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
                          <input
                            className="w-full bg-neutral-800 rounded px-2 py-1.5 text-sm"
                            placeholder="z.B. 📊"
                            value={item.icon ?? ''}
                            onChange={(e) => handleNavItemChange(item.id, { icon: e.target.value })}
                          />
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
