'use client';

import React from 'react';

export type QuickButtonPresetKey =
  | 'contact-list'
  | 'opening-hours'
  | 'important-links'
  | 'news'
  | 'shift-plan'
  | 'benefits'
  | 'contacts'
  | 'bautagebuch'
  | 'phasenboard'
  | 'tasks'
  | 'communication'
  | 'chat'
  | 'calendar'
  | 'map'
  | 'qr-code'
  | 'timer'
  | 'time-tracking-reports'
  | 'course-plan'
  | 'feedback'
  | 'location'
  | 'member-status'
  | 'table-reservations'
  | 'tracking-recording';

type PresetItem = {
  label: string;
  icon: string;
  preset: QuickButtonPresetKey;
};

type PresetCategory = {
  name: string;
  items: PresetItem[];
};

interface QuickButtonsPanelProps {
  onCreatePage: (preset: QuickButtonPresetKey) => void;
}

export default function QuickButtonsPanel({ onCreatePage }: QuickButtonsPanelProps) {
  const categories: PresetCategory[] = [
    {
      name: 'Kontakt',
      items: [
        { preset: 'contact-list', label: 'Kontaktliste', icon: '☎️' },
        { preset: 'contacts', label: 'Ansprechpartner', icon: '👤' },
        { preset: 'opening-hours', label: 'Öffnungszeiten', icon: '🕒' },
      ],
    },
    {
      name: 'Information',
      items: [
        { preset: 'news', label: 'News', icon: '📰' },
        { preset: 'important-links', label: 'Wichtige Links', icon: '🔗' },
        { preset: 'shift-plan', label: 'Schichtplan', icon: '🗓️' },
      ],
    },
    {
      name: 'Organisation',
      items: [
        { preset: 'tasks', label: 'Aufgaben', icon: '✅' },
        { preset: 'calendar', label: 'Kalender', icon: '📅' },
        { preset: 'course-plan', label: 'Kursplan', icon: '📚' },
        { preset: 'table-reservations', label: 'Tischplanung & Reservierungen', icon: '🍽️' },
      ],
    },
    {
      name: 'Kommunikation',
      items: [
        { preset: 'communication', label: 'Kommunikation', icon: '📣' },
        { preset: 'chat', label: 'Chat', icon: '💬' },
        { preset: 'feedback', label: 'Feedback', icon: '⭐' },
      ],
    },
    {
      name: 'Business',
      items: [
        { preset: 'benefits', label: 'Benefits', icon: '🎁' },
        { preset: 'time-tracking-reports', label: 'Zeiterfassung & Berichte', icon: '🧾' },
        { preset: 'member-status', label: 'Mitgliederstatus', icon: '🪪' },
      ],
    },
    {
      name: 'Tools',
      items: [
        { preset: 'map', label: 'Karte', icon: '🗺️' },
        { preset: 'location', label: 'Standort', icon: '📍' },
        { preset: 'qr-code', label: 'QR-Code', icon: '📱' },
        { preset: 'timer', label: 'Timer', icon: '⏱️' },
        { preset: 'tracking-recording', label: 'Tracking & Aufzeichnung', icon: '🎥' },
      ],
    },
    {
      name: 'Baustelle',
      items: [
        { preset: 'bautagebuch', label: 'Bautagebuch', icon: '🧱' },
        { preset: 'phasenboard', label: 'Phasenboard', icon: '🧩' },
      ],
    },
  ];

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-1">
      {categories.map((category) => (
        <div key={category.name} className="space-y-2">
          <div className="text-xs font-semibold text-neutral-200">{category.name}</div>
          <div className="grid grid-cols-2 gap-2">
            {category.items.map((item) => (
              <button
                key={`${category.name}-${item.label}`}
                type="button"
                onClick={() => onCreatePage(item.preset)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs font-semibold text-neutral-100 transition hover:bg-white/10"
                title={item.label}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

