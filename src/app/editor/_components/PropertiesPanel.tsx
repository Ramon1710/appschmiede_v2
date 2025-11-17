// path: src/app/editor/_components/PropertiesPanel.tsx
'use client';

import React, { useRef } from 'react';
import type { Node as EditorNode, NodeProps, NodeStyle } from '@/lib/editorTypes';

const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const FALLBACK_COLOR = '#0f172a';

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

  const promptImage = () => {
    const description = window.prompt('Welches Motiv soll das Bild zeigen? Beispiel: "modernes Team im Chat"');
    if (!description) return;
    const url = `https://source.unsplash.com/featured/800x600/?${encodeURIComponent(description)}`;
    setProps({ src: url });
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
                  onClick={promptImage}
                  className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-white/10"
                >KI Bild generieren</button>
              </div>
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
