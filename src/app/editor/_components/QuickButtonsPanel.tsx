'use client';

import React, { useState } from 'react';
import { COIN_COSTS } from '@/config/coins';
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
  const quickButtonCostLabel = tr(`${COIN_COSTS.quickButton} Coin`, `${COIN_COSTS.quickButton} coin`);
  const [expanded, setExpanded] = useState<string[]>(['contact']);
  const [searchQuery, setSearchQuery] = useState('');

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

  const toggle = (categoryId: string) => {
    setExpanded((prev) => (prev.includes(categoryId) ? prev.filter((entry) => entry !== categoryId) : [...prev, categoryId]));
  };

  const filteredCategories = categories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => tr(item.label.de, item.label.en).toLowerCase().includes(searchQuery.toLowerCase())),
    }))
    .filter((category) => category.items.length > 0);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#222] p-3">
        <input
          type="text"
          placeholder={tr('Fertige Buttons suchen...', 'Search quick buttons...')}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded border border-[#333] bg-neutral-900 px-3 py-2 text-sm placeholder:text-neutral-500"
        />
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {filteredCategories.map((category) => {
          const isExpanded = expanded.includes(category.id);
          return (
            <div key={category.id} className="overflow-hidden rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => toggle(category.id)}
                className="flex w-full items-center gap-2 bg-neutral-900 px-3 py-2 text-left text-sm font-semibold hover:bg-neutral-800"
              >
                <span className="flex-1">{tr(category.name.de, category.name.en)}</span>
                <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-100">{quickButtonCostLabel}</span>
                <span className="text-xs text-neutral-500">{isExpanded ? '▼' : '▶'}</span>
              </button>

              {isExpanded && (
                <div className="space-y-1 bg-neutral-950/50 p-2">
                  {category.items.map((item) => (
                    <button
                      key={`${category.id}-${item.preset}`}
                      type="button"
                      onClick={() => onCreatePage(item.preset)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2 text-left text-sm hover:bg-white/10"
                      title={tr(item.label.de, item.label.en)}
                    >
                      <span className="flex min-w-0 items-center gap-2 text-neutral-100">
                        <span>{item.icon}</span>
                        <span className="truncate">{tr(item.label.de, item.label.en)}</span>
                      </span>
                      <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-100">{quickButtonCostLabel}</span>
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

