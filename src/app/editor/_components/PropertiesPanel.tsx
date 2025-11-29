// path: src/app/editor/_components/PropertiesPanel.tsx
'use client';

import React, { useMemo, useRef, useState } from 'react';
import type { Node as EditorNode, NodeProps, NodeStyle, NavbarItem, TimeEntry } from '@/lib/editorTypes';

const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const FALLBACK_COLOR = '#0f172a';
const createNavId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `nav_${Math.random().toString(36).slice(2)}`;
const createTimeEntryId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `time_${Math.random().toString(36).slice(2)}`;

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

interface PropertiesPanelProps {
  node: EditorNode | null;
  onUpdate: (patch: Partial<EditorNode>) => void;
  pageBackground: string;
  onChangeBackground: (value: string) => void;
  onGenerateBackground: (description: string) => void;
  onResetBackground: () => void;
}

export default function PropertiesPanel({
  node,
  onUpdate,
  pageBackground,
  onChangeBackground,
  onGenerateBackground,
  onResetBackground,
}: PropertiesPanelProps) {
  const imageFileInput = useRef<HTMLInputElement | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const setFrame = (k: 'x' | 'y' | 'w' | 'h', v: number) =>
    onUpdate({ [k]: Number.isFinite(v) ? v : 0 } as Partial<EditorNode>);

  const setProps = (patch: NodeProps) =>
    onUpdate({ props: { ...(node?.props ?? {}), ...patch } });

  const setStyle = (patch: NodeStyle) =>
    onUpdate({ style: { ...(node?.style ?? {}), ...patch } });

  const promptContainerGradient = () => {
    const description = window.prompt('Beschreibe den Hintergrund. Beispiel: "dunkler Weltraum mit violetten Akzenten"');
    if (!description) return;
    const colors = ['#38BDF8', '#6366F1', '#F472B6', '#22D3EE', '#F97316', '#A855F7'];
    const hash = [...description].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const first = colors[hash % colors.length];
    const second = colors[(hash + 3) % colors.length];
    const third = colors[(hash + 5) % colors.length];
    const gradient = `linear-gradient(140deg, ${first}, ${second}, ${third})`;
    setProps({ bg: gradient });
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

  const backgroundIsColor = HEX_COLOR_REGEX.test(pageBackground.trim());
  const isNavbarContainer = node?.type === 'container' && node.props?.component === 'navbar';
  const isTimeTrackingContainer = node?.type === 'container' && node.props?.component === 'time-tracking';
  const navItems = useMemo(() => (isNavbarContainer ? normalizeNavItems(node?.props?.navItems) : []), [isNavbarContainer, node?.props?.navItems]);
  const timeEntries = useMemo(
    () => (isTimeTrackingContainer ? normalizeTimeEntries(node?.props?.timeTracking?.entries) : []),
    [isTimeTrackingContainer, node?.props?.timeTracking?.entries]
  );

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

  return (
    <div className="p-4 space-y-4 text-sm bg-[#0b0b0f] h-full overflow-y-auto">
      <div className="font-semibold text-lg border-b border-[#222] pb-2">Eigenschaften</div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Seiten-Hintergrund</div>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-neutral-800 rounded px-2 py-1.5 text-sm"
            value={pageBackground}
            onChange={(e) => onChangeBackground(e.target.value)}
          />
          <input
            type="color"
            className="h-10 w-12 bg-neutral-800 rounded cursor-pointer border border-neutral-700"
            value={backgroundIsColor ? pageBackground : FALLBACK_COLOR}
            onChange={(e) => onChangeBackground(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-white/10"
            onClick={askForPageGradient}
          >KI Hintergrund</button>
          <button
            type="button"
            className="rounded border border-white/10 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/10"
            onClick={onResetBackground}
          >Zurücksetzen</button>
        </div>
      </div>

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
            </div>
          )}
        </>
      )}
    </div>
  );
}
