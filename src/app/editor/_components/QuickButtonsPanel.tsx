'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n';

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
  label: { de: string; en: string };
  icon: string;
  preset: QuickButtonPresetKey;
};

type PresetCategory = {
  id: string;
  name: { de: string; en: string };
  items: PresetItem[];
};

interface QuickButtonsPanelProps {
  onCreatePage: (preset: QuickButtonPresetKey) => void;
}

export default function QuickButtonsPanel({ onCreatePage }: QuickButtonsPanelProps) {
  const { lang } = useI18n();
  const tr = (de: string, en: string) => (lang === 'en' ? en : de);

  const categories: PresetCategory[] = [
    {
      id: 'contact',
      name: { de: 'Kontakt', en: 'Contact' },
      items: [
        { preset: 'contact-list', label: { de: 'Kontaktliste', en: 'Contact list' }, icon: '☎️' },
        { preset: 'contacts', label: { de: 'Ansprechpartner', en: 'Contacts' }, icon: '👤' },
        { preset: 'opening-hours', label: { de: 'Öffnungszeiten', en: 'Opening hours' }, icon: '🕒' },
      ],
    },
    {
      id: 'info',
      name: { de: 'Information', en: 'Info' },
      items: [
        { preset: 'news', label: { de: 'News', en: 'News' }, icon: '📰' },
        { preset: 'important-links', label: { de: 'Wichtige Links', en: 'Important links' }, icon: '🔗' },
        { preset: 'shift-plan', label: { de: 'Schichtplan', en: 'Shift plan' }, icon: '🗓️' },
      ],
    },
    {
      id: 'organization',
      name: { de: 'Organisation', en: 'Organization' },
      items: [
        { preset: 'tasks', label: { de: 'Aufgaben', en: 'Tasks' }, icon: '✅' },
        { preset: 'calendar', label: { de: 'Kalender', en: 'Calendar' }, icon: '📅' },
        { preset: 'course-plan', label: { de: 'Kursplan', en: 'Course plan' }, icon: '📚' },
        { preset: 'table-reservations', label: { de: 'Tischplanung & Reservierungen', en: 'Table reservations' }, icon: '🍽️' },
      ],
    },
    {
      id: 'communication',
      name: { de: 'Kommunikation', en: 'Communication' },
      items: [
        { preset: 'communication', label: { de: 'Kommunikation', en: 'Communication' }, icon: '📣' },
        { preset: 'chat', label: { de: 'Chat', en: 'Chat' }, icon: '💬' },
        { preset: 'feedback', label: { de: 'Feedback', en: 'Feedback' }, icon: '⭐' },
      ],
    },
    {
      id: 'business',
      name: { de: 'Business', en: 'Business' },
      items: [
        { preset: 'benefits', label: { de: 'Benefits', en: 'Benefits' }, icon: '🎁' },
        { preset: 'time-tracking-reports', label: { de: 'Zeiterfassung & Berichte', en: 'Time tracking & reports' }, icon: '🧾' },
        { preset: 'member-status', label: { de: 'Mitgliederstatus', en: 'Member status' }, icon: '🪪' },
      ],
    },
    {
      id: 'tools',
      name: { de: 'Tools', en: 'Tools' },
      items: [
        { preset: 'map', label: { de: 'Karte', en: 'Map' }, icon: '🗺️' },
        { preset: 'location', label: { de: 'Standort', en: 'Location' }, icon: '📍' },
        { preset: 'qr-code', label: { de: 'QR-Code', en: 'QR code' }, icon: '📱' },
        { preset: 'timer', label: { de: 'Timer', en: 'Timer' }, icon: '⏱️' },
        { preset: 'tracking-recording', label: { de: 'Tracking & Aufzeichnung', en: 'Tracking & recording' }, icon: '🎥' },
      ],
    },
    {
      id: 'construction',
      name: { de: 'Baustelle', en: 'Construction' },
      items: [
        { preset: 'bautagebuch', label: { de: 'Bautagebuch', en: 'Construction log' }, icon: '🧱' },
        { preset: 'phasenboard', label: { de: 'Phasenboard', en: 'Phase board' }, icon: '🧩' },
      ],
    },
  ];

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-1">
      {categories.map((category) => (
        <div key={category.id} className="space-y-2">
          <div className="text-xs font-semibold text-neutral-200">{tr(category.name.de, category.name.en)}</div>
          <div className="grid grid-cols-2 gap-2">
            {category.items.map((item) => (
              <button
                key={`${category.id}-${item.preset}`}
                type="button"
                onClick={() => onCreatePage(item.preset)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs font-semibold text-neutral-100 transition hover:bg-white/10"
                title={tr(item.label.de, item.label.en)}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="truncate">{tr(item.label.de, item.label.en)}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

