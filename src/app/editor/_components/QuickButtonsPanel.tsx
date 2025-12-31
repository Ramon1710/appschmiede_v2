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
  | 'phasenboard';

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
      name: 'Kommunikation',
      items: [
        { preset: 'important-links', label: 'Linksammlung', icon: '🔗' },
      ],
    },
    {
      name: 'Business',
      items: [
        { preset: 'benefits', label: 'Benefits', icon: '🎁' },
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
