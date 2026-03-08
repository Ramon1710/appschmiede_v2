// src/app/editor/_components/CategorizedToolbox.tsx
'use client';
import React, { useState } from 'react';
import { COIN_COSTS, type CoinActionKey } from '@/config/coins';
import type { NodeType, NodeProps, NavbarItem } from '@/lib/editorTypes';
import { useI18n } from '@/lib/i18n';

interface ToolboxProps {
  onAdd: (type: NodeType, defaultProps?: NodeProps, options?: { coinAction?: CoinActionKey }) => void | Promise<void>;
}

type Category = {
  id: string;
  name: string;
  icon: string;
  items: Array<{ type: NodeType; label: string; icon: string; defaultProps?: NodeProps }>;
};

export default function CategorizedToolbox({ onAdd }: ToolboxProps) {
  const { lang } = useI18n();
  const tr = (de: string, en: string) => (lang === 'en' ? en : de);
  const numberLocale = lang === 'en' ? 'en-US' : 'de-DE';
  const formatCoins = (value: number) =>
    new Intl.NumberFormat(numberLocale, { minimumFractionDigits: value % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 }).format(value);

  const [expanded, setExpanded] = useState<string[]>(['basic']);
  const [searchQuery, setSearchQuery] = useState('');
  const categories: Category[] = [
    {
      id: 'basic',
      name: tr('Allgemeine Funktionen', 'Basic functions'),
      icon: '🎨',
      items: [
        { type: 'text', label: tr('Text', 'Text'), icon: '📝' },
        { type: 'button', label: tr('Button', 'Button'), icon: '🔘' },
        { type: 'input', label: tr('Eingabefeld', 'Input field'), icon: '📥' },
        { type: 'image', label: tr('Bild', 'Image'), icon: '🖼️' },
        { type: 'container', label: tr('KI-Chat', 'AI chat'), icon: '🤖', defaultProps: { component: 'ai-chat' } },
      ],
    },
    {
      id: 'auth',
      name: tr('Login & Auth', 'Login & auth'),
      icon: '🔐',
      items: [
        {
          type: 'input',
          label: tr('Email-Feld', 'Email field'),
          icon: '📧',
          defaultProps: { placeholder: tr('E-Mail-Adresse', 'Email address'), inputType: 'email' },
        },
        {
          type: 'input',
          label: tr('Passwort-Feld', 'Password field'),
          icon: '🔒',
          defaultProps: { placeholder: tr('Passwort', 'Password'), inputType: 'password' },
        },
        { type: 'button', label: tr('Login', 'Login'), icon: '✅', defaultProps: { label: tr('Anmelden', 'Sign in'), action: 'login', target: '/login' } },
        {
          type: 'button',
          label: tr('Registrieren', 'Register'),
          icon: '📝',
          defaultProps: { label: tr('Registrieren', 'Register'), action: 'register', target: '/register' },
        },
        {
          type: 'button',
          label: tr('Passwort vergessen', 'Forgot password'),
          icon: '🧠',
          defaultProps: { label: tr('Passwort vergessen?', 'Forgot password?'), action: 'reset-password', target: '/reset' },
        },
        { type: 'button', label: tr('Foto hochladen', 'Upload photo'), icon: '📷', defaultProps: { label: tr('Foto wählen', 'Choose photo'), action: 'upload-photo' } },
      ],
    },
    {
      id: 'communication',
      name: tr('Kommunikation', 'Communication'),
      icon: '💬',
      items: [
        { type: 'container', label: tr('Chatfenster', 'Chat window'), icon: '💬', defaultProps: { component: 'chat' } },
        { type: 'button', label: tr('Anrufbutton', 'Call button'), icon: '📞', defaultProps: { label: tr('Anrufen', 'Call'), action: 'call' } },
        {
          type: 'button',
          label: tr('Tischreservierung', 'Table reservation'),
          icon: '🍽️',
          defaultProps: {
            label: tr('Tisch reservieren', 'Reserve table'),
            icon: '🍽️',
            action: 'email',
            emailAddress: 'reservierung@deinbetrieb.de',
          },
        },
        {
          type: 'button',
          label: tr('Werbung', 'Ad'),
          icon: '📢',
          defaultProps: {
            component: 'ad-banner',
            label: tr('Jetzt buchen', 'Book now'),
            action: 'url',
            url: 'https://www.appschmiede.app',
            adBadge: tr('Anzeige', 'Ad'),
            adHeadline: tr('Dein Produkt vor der richtigen Zielgruppe', 'Your product in front of the right audience'),
            adDescription: tr('Starte Kampagnen direkt aus deiner App und erreiche Nutzer:innen in Minuten.', 'Launch campaigns directly from your app and reach users in minutes.'),
            adSubline: tr('Inklusive Tracking & AI-Kampagnen', 'Includes tracking & AI campaigns'),
            adCtaLabel: tr('Mehr erfahren', 'Learn more'),
            adPrice: tr('Ab 49 € / Monat', 'From €49 / month'),
            adImageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=640&q=80',
          },
        },
      ],
    },
    {
      id: 'interactive',
      name: tr('Interaktiv', 'Interactive'),
      icon: '✨',
      items: [
        { type: 'container', label: tr('QR-Code', 'QR code'), icon: '📱', defaultProps: { component: 'qr-code' } },
        {
          type: 'container',
          label: tr('Timer', 'Timer'),
          icon: '⏲️',
          defaultProps: {
            component: 'timer',
            timer: { label: tr('Timer', 'Timer'), mode: 'countdown', seconds: 15 * 60 },
          },
        },
        { type: 'button', label: tr('Dark/Light Mode', 'Dark/light mode'), icon: '🌓', defaultProps: { action: 'toggle-theme' } },
        { type: 'input', label: tr('Checkbox', 'Checkbox'), icon: '☑️', defaultProps: { inputType: 'checkbox', label: tr('Zustimmen', 'Agree') } },
        { type: 'input', label: tr('Datum', 'Date'), icon: '📅', defaultProps: { inputType: 'date' } },
      ],
    },
    {
      id: 'nav',
      name: tr('Kopfzeile & Navigation', 'Header & navigation'),
      icon: '🧭',
      items: [
        {
          type: 'container',
          label: tr('Navigationsleiste', 'Navigation bar'),
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
        { type: 'button', label: tr('Logout', 'Logout'), icon: '🚪', defaultProps: { label: tr('Abmelden', 'Sign out'), action: 'logout' } },
        { type: 'button', label: tr('Dropdown-Menü', 'Dropdown menu'), icon: '📋', defaultProps: { component: 'dropdown' } },
      ],
    },
    {
      id: 'business',
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
      id: 'media',
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
      id: 'fun',
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

  const getCoinActionForCategory = (categoryId: string): CoinActionKey => (categoryId === 'basic' ? 'basicComponent' : 'component');

  const getCoinLabel = (action: CoinActionKey) => {
    const amount = COIN_COSTS[action];
    if (amount <= 0) {
      return tr('Kostenfrei', 'Free');
    }
    return tr(`${formatCoins(amount)} Coin`, `${formatCoins(amount)} coin`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-3 border-b border-[#222]">
        <input
          type="text"
          placeholder={tr('Komponente suchen...', 'Search components...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-900 border border-[#333] rounded px-3 py-2 text-sm placeholder:text-neutral-500"
        />
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto space-y-1 p-2">
        {filteredCategories.map((cat) => {
          const isExpanded = expanded.includes(cat.id);
          const coinAction = getCoinActionForCategory(cat.id);
          const coinLabel = getCoinLabel(coinAction);
          return (
            <div key={cat.id} className="border border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => toggle(cat.id)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-left text-sm font-semibold"
              >
                <span>{cat.icon}</span>
                <span className="flex-1">{cat.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${coinAction === 'basicComponent' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-amber-500/15 text-amber-200'}`}>
                  {coinLabel}
                </span>
                <span className="text-xs text-neutral-500">{isExpanded ? '▼' : '▶'}</span>
              </button>
              {isExpanded && (
                <div className="bg-neutral-950/50 p-2 space-y-1">
                  {cat.items.map((item) => (
                    <button
                      key={`${cat.id}-${item.label}`}
                      onClick={() => void onAdd(item.type, item.defaultProps, { coinAction })}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg border border-white/10 hover:bg-white/10 text-left"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span>{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${coinAction === 'basicComponent' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-amber-500/15 text-amber-200'}`}>
                        {coinLabel}
                      </span>
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
