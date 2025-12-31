// src/app/editor/_components/CategorizedToolbox.tsx
'use client';
import React, { useState } from 'react';
import type { NodeType, NodeProps, NavbarItem } from '@/lib/editorTypes';

interface ToolboxProps {
  onAdd: (type: NodeType, defaultProps?: NodeProps) => void;
}

type Category = {
  name: string;
  icon: string;
  items: Array<{ type: NodeType; label: string; icon: string; defaultProps?: NodeProps }>;
};

export default function CategorizedToolbox({ onAdd }: ToolboxProps) {
  const [expanded, setExpanded] = useState<string[]>(['allgemein']);
  const [searchQuery, setSearchQuery] = useState('');
  const categories: Category[] = [
    {
      name: 'Alleine Funktionen',
      icon: '🎨',
      items: [
        { type: 'text', label: 'Text', icon: '📝' },
        { type: 'button', label: 'Button', icon: '🔘' },
        { type: 'input', label: 'Eingabefeld', icon: '📥' },
        { type: 'image', label: 'Bild', icon: '🖼️' },
        { type: 'container', label: 'KI-Chat', icon: '🤖', defaultProps: { component: 'ai-chat' } },
      ],
    },
    {
      name: 'Login & Auth',
      icon: '🔐',
      items: [
        { type: 'input', label: 'Email-Feld', icon: '📧', defaultProps: { placeholder: 'E-Mail-Adresse', inputType: 'email' } },
        { type: 'input', label: 'Passwort-Feld', icon: '🔒', defaultProps: { placeholder: 'Passwort', inputType: 'password' } },
        { type: 'button', label: 'Login', icon: '✅', defaultProps: { label: 'Anmelden', action: 'login', target: '/login' } },
        { type: 'button', label: 'Registrieren', icon: '📝', defaultProps: { label: 'Registrieren', action: 'register', target: '/register' } },
        { type: 'button', label: 'Passwort vergessen', icon: '🧠', defaultProps: { label: 'Passwort vergessen?', action: 'reset-password', target: '/reset' } },
        { type: 'button', label: 'Foto hochladen', icon: '📷', defaultProps: { label: 'Foto wählen', action: 'upload-photo' } },
      ],
    },
    {
      name: 'Kommunikation',
      icon: '💬',
      items: [
        { type: 'container', label: 'Chatfenster', icon: '💬', defaultProps: { component: 'chat' } },
        { type: 'button', label: 'Anrufbutton', icon: '📞', defaultProps: { label: 'Anrufen', action: 'call' } },
        {
          type: 'button',
          label: 'Werbung',
          icon: '📢',
          defaultProps: {
            component: 'ad-banner',
            label: 'Jetzt buchen',
            action: 'url',
            url: 'https://www.appschmiede.app',
            adBadge: 'Anzeige',
            adHeadline: 'Dein Produkt vor der richtigen Zielgruppe',
            adDescription: 'Starte Kampagnen direkt aus deiner App und erreiche Nutzer:innen in Minuten.',
            adSubline: 'Inklusive Tracking & AI-Kampagnen',
            adCtaLabel: 'Mehr erfahren',
            adPrice: 'Ab 49 € / Monat',
            adImageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=640&q=80',
          },
        },
      ],
    },
    {
      name: 'Interaktiv',
      icon: '✨',
      items: [
        { type: 'container', label: 'QR-Code', icon: '📱', defaultProps: { component: 'qr-code' } },
        { type: 'button', label: 'Dark/Light Mode', icon: '🌓', defaultProps: { action: 'toggle-theme' } },
        { type: 'input', label: 'Checkbox', icon: '☑️', defaultProps: { inputType: 'checkbox', label: 'Zustimmen' } },
        { type: 'input', label: 'Datum', icon: '📅', defaultProps: { inputType: 'date' } },
      ],
    },
    {
      name: 'Kopfzeile & Navigation',
      icon: '🧭',
      items: [
        {
          type: 'container',
          label: 'Navigationsleiste',
          icon: '🧭',
          defaultProps: {
            component: 'navbar',
            navItems: [
              { id: crypto.randomUUID(), label: 'Home', action: 'navigate', target: '/' } as NavbarItem,
              { id: crypto.randomUUID(), label: 'Editor', action: 'navigate', target: '/editor' } as NavbarItem,
              { id: crypto.randomUUID(), label: 'Logout', action: 'logout' } as NavbarItem,
            ],
          },
        },
        { type: 'button', label: 'Logout', icon: '🚪', defaultProps: { label: 'Abmelden', action: 'logout' } },
        { type: 'button', label: 'Dropdown-Menü', icon: '📋', defaultProps: { component: 'dropdown' } },
      ],
    },
    {
      name: 'Unternehmen',
      icon: '🏢',
      items: [
        {
          type: 'container',
          label: 'Bautagebuch',
          icon: '🧱',
          defaultProps: {
            component: 'bautagebuch',
            bautagebuch: {
              title: 'Tagesberichte',
              entries: [
                {
                  id: crypto.randomUUID(),
                  date: new Date().toISOString().slice(0, 10),
                  note: 'Beispiel: Material geliefert, Arbeiten begonnen.',
                },
              ],
            },
          },
        },
        {
          type: 'container',
          label: 'Phasenboard',
          icon: '🧩',
          defaultProps: {
            component: 'phasenboard',
            phasenboard: {
              title: 'Bauphasen',
              phases: [
                { id: crypto.randomUUID(), title: 'Planung' },
                { id: crypto.randomUUID(), title: 'Ausführung' },
                { id: crypto.randomUUID(), title: 'Abnahme' },
              ],
              cards: [],
            },
          },
        },
        {
          type: 'container',
          label: 'Schichtplan',
          icon: '🗓️',
          defaultProps: {
            component: 'table',
            tableConfig: {
              title: 'Schichtplan',
              columns: [
                { id: crypto.randomUUID(), label: 'Tag' },
                { id: crypto.randomUUID(), label: 'Schicht' },
                { id: crypto.randomUUID(), label: 'Team' },
              ],
              rows: [
                { id: crypto.randomUUID(), values: ['Mo', 'Früh', 'Team A'] },
                { id: crypto.randomUUID(), values: ['Di', 'Spät', 'Team B'] },
              ],
            },
          },
        },
        {
          type: 'container',
          label: 'Zeiterfassung',
          icon: '⏱️',
          defaultProps: {
            component: 'time-tracking',
            timeTracking: { entries: [] },
          },
        },
        {
          type: 'container',
          label: 'Statusanzeige',
          icon: '🟢',
          defaultProps: {
            component: 'status-board',
            statusBoard: {
              title: 'Status',
              options: [
                { id: crypto.randomUUID(), label: 'Verfügbar', color: '#22c55e', description: 'Direkt einsatzbereit' },
                { id: crypto.randomUUID(), label: 'Gebucht', color: '#f97316', description: 'Für Kund:innen reserviert' },
                { id: crypto.randomUUID(), label: 'Offen', color: '#0ea5e9', description: 'Wartet auf Bestätigung' },
              ],
            },
          },
        },
        {
          type: 'container',
          label: 'Ordnerstruktur',
          icon: '📁',
          defaultProps: {
            component: 'folder-structure',
            folderTree: [
              { id: crypto.randomUUID(), name: 'Vertrieb', children: [] },
              { id: crypto.randomUUID(), name: 'Marketing', children: [] },
            ],
          },
        },
        {
          type: 'container',
          label: 'Aufgabenverteilung',
          icon: '📋',
          defaultProps: {
            component: 'task-manager',
            tasks: [
              { id: crypto.randomUUID(), title: 'Kickoff vorbereiten', done: false },
              { id: crypto.randomUUID(), title: 'UX-Wireframes', done: true },
            ],
          },
        },
        {
          type: 'container',
          label: 'Analytics',
          icon: '📊',
          defaultProps: {
            component: 'analytics',
            analyticsMetrics: [
              { id: crypto.randomUUID(), label: 'Visits', value: '1.204', description: 'letzte 24h' },
              { id: crypto.randomUUID(), label: 'Conversion', value: '3,4%', description: '+0,6% vs. Vortag' },
            ],
            analyticsHighlight: 'Top-Kampagne: 🚀 Launch KW12',
          },
        },
        {
          type: 'container',
          label: 'Support/Tickets',
          icon: '🎫',
          defaultProps: {
            component: 'support',
            supportChannel: 'ticket',
            supportTarget: 'support@appschmiede.dev',
            supportTickets: [
              {
                id: crypto.randomUUID(),
                subject: 'Login Hilfe',
                message: 'Kundin meldet 2FA-Problem.',
                createdAt: new Date().toISOString(),
                channel: 'ticket',
              },
            ],
          },
        },
        {
          type: 'container',
          label: 'Tabelle',
          icon: '📊',
          defaultProps: {
            component: 'table',
            tableConfig: {
              title: 'Team Übersicht',
              columns: [
                { id: crypto.randomUUID(), label: 'Name' },
                { id: crypto.randomUUID(), label: 'Rolle' },
                { id: crypto.randomUUID(), label: 'Status' },
              ],
              rows: [
                { id: crypto.randomUUID(), values: ['Alex', 'Design', '✅ Online'] },
                { id: crypto.randomUUID(), values: ['Sam', 'Engineering', '🟡 beschäftigt'] },
              ],
            },
          },
        },
      ],
    },
    {
      name: 'Medien & Inhalte',
      icon: '📹',
      items: [
        {
          type: 'container',
          label: 'News',
          icon: '📰',
          defaultProps: {
            component: 'news',
            newsFeed: {
              title: 'News',
              items: [
                {
                  id: crypto.randomUUID(),
                  title: 'Neuer Beitrag',
                  body: 'Hier kannst du aktuelle Informationen eintragen – optional mit Bild.',
                  imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
                  date: new Date().toISOString().slice(0, 10),
                },
              ],
            },
          },
        },
        { type: 'container', label: 'Kalender', icon: '📅', defaultProps: { component: 'calendar', calendarFocusDate: new Date().toISOString() } },
        {
          type: 'container',
          label: 'Todo-Liste',
          icon: '✅',
          defaultProps: {
            component: 'todo',
            todoItems: [
              { id: crypto.randomUUID(), title: 'Dokumentation prüfen', done: false },
              { id: crypto.randomUUID(), title: 'Release vorbereiten', done: true },
            ],
          },
        },
        {
          type: 'container',
          label: 'Kartenansicht (GPS)',
          icon: '🗺️',
          defaultProps: {
            component: 'map',
            mapLocation: 'Berlin, Germany',
            mapMode: 'live-tracking',
            mapInfo: 'Trackt live, wo sich dein Team befindet – aktualisiert alle 2 Minuten.',
            mapModeLabel: 'Live Tracking',
            mapActionLabel: 'Tracking öffnen',
          },
        },
        { type: 'container', label: 'Videoplayer', icon: '📹', defaultProps: { component: 'video-player', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } },
        { type: 'container', label: 'Audio Recorder', icon: '🎤', defaultProps: { component: 'audio-recorder', audioNotes: [] } },
      ],
    },
    {
      name: 'Spaß & Games',
      icon: '🎮',
      items: [
        { type: 'container', label: 'Tic Tac Toe', icon: '❌', defaultProps: { component: 'game-tictactoe' } },
        { type: 'container', label: 'Würfel', icon: '🎲', defaultProps: { component: 'game-dice' } },
        { type: 'container', label: 'Snake', icon: '🐍', defaultProps: { component: 'game-snake' } },
        {
          type: 'container',
          label: 'Avatar erstellen',
          icon: '👤',
          defaultProps: {
            component: 'avatar-creator',
            avatarTitle: 'Avatar erstellen',
            avatarDescription: 'Generiere neue Outfits, Moods und KI-Stile in Sekunden.',
            avatarPreviewUrl: 'https://placehold.co/160x160/1a0f1f/f9a8d4?text=AI',
            avatarAccentColor: '#f472b6',
            avatarBackgroundColor: '#1a0f1f',
            avatarTraits: [
              { id: crypto.randomUUID(), label: 'Mood', value: 'Focused', icon: '🧠' },
              { id: crypto.randomUUID(), label: 'Style', value: 'Neon', icon: '✨' },
              { id: crypto.randomUUID(), label: 'Outfit', value: 'Streetwear', icon: '🧥' },
            ],
            avatarActions: [
              {
                id: crypto.randomUUID(),
                label: 'Zufall generieren',
                description: 'KI mixt Gesichtszüge und Farben.',
                icon: '🎲',
                accent: '#f472b6',
              },
              {
                id: crypto.randomUUID(),
                label: 'Outfit wechseln',
                description: 'Cycle zwischen Presets.',
                icon: '🧢',
                accent: '#c084fc',
              },
            ],
          },
        },
      ],
    },
  ];

  const toggle = (name: string) => {
    setExpanded((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };

  // Filter categories and items based on search query
  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-3 border-b border-[#222]">
        <input
          type="text"
          placeholder="Komponente suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-900 border border-[#333] rounded px-3 py-2 text-sm placeholder:text-neutral-500"
        />
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto space-y-1 p-2">
        {filteredCategories.map((cat) => {
          const isExpanded = expanded.includes(cat.name);
          return (
            <div key={cat.name} className="border border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => toggle(cat.name)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-left text-sm font-semibold"
              >
                <span>{cat.icon}</span>
                <span className="flex-1">{cat.name}</span>
                <span className="text-xs text-neutral-500">{isExpanded ? '▼' : '▶'}</span>
              </button>
              {isExpanded && (
                <div className="bg-neutral-950/50 p-2 space-y-1">
                  {cat.items.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => onAdd(item.type, item.defaultProps)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-white/10 hover:bg-white/10 text-left"
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
