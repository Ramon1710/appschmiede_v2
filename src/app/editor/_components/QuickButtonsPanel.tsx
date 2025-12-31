'use client';

import React from 'react';
import type { NodeProps, NodeType } from '@/lib/editorTypes';

type PresetItem = {
  label: string;
  icon: string;
  type: NodeType;
  defaultProps: NodeProps;
};

type PresetCategory = {
  name: string;
  items: PresetItem[];
};

interface QuickButtonsPanelProps {
  onAdd: (type: NodeType, defaultProps?: NodeProps) => void;
}

export default function QuickButtonsPanel({ onAdd }: QuickButtonsPanelProps) {
  const categories: PresetCategory[] = [
    {
      name: 'Kontakt',
      items: [
        {
          type: 'button',
          label: 'Kontaktseite',
          icon: '☎️',
          defaultProps: { label: 'Kontakt', icon: '☎️', action: 'navigate', targetPage: '/kontakt' },
        },
        {
          type: 'button',
          label: 'Karte',
          icon: '🗺️',
          defaultProps: { label: 'Karte', icon: '🗺️', action: 'url', url: 'https://maps.google.com' },
        },
        {
          type: 'button',
          label: 'Allg. Anfrage',
          icon: '❓',
          defaultProps: { label: 'Anfrage', icon: '❓', action: 'email', emailAddress: 'info@example.com' },
        },
        {
          type: 'button',
          label: 'Öffnungszeiten',
          icon: '🕒',
          defaultProps: { label: 'Öffnungszeiten', icon: '🕒', action: 'navigate', targetPage: '#oeffnungszeiten' },
        },
      ],
    },
    {
      name: 'Information',
      items: [
        {
          type: 'button',
          label: 'Galerie',
          icon: '🖼️',
          defaultProps: { label: 'Galerie', icon: '🖼️', action: 'navigate', targetPage: '#galerie' },
        },
        {
          type: 'button',
          label: 'Video',
          icon: '🎥',
          defaultProps: { label: 'Video', icon: '🎥', action: 'url', url: 'https://youtube.com' },
        },
        {
          type: 'button',
          label: 'Text und Bild',
          icon: '📝',
          defaultProps: { label: 'Text & Bild', icon: '📝', action: 'none' },
        },
        {
          type: 'button',
          label: 'News Center',
          icon: '📰',
          defaultProps: { label: 'News', icon: '📰', action: 'navigate', targetPage: '#news' },
        },
        {
          type: 'button',
          label: 'Preisliste',
          icon: '€',
          defaultProps: { label: 'Preisliste', icon: '€', action: 'navigate', targetPage: '#preise' },
        },
        {
          type: 'button',
          label: 'Produktkatalog',
          icon: '🧾',
          defaultProps: { label: 'Katalog', icon: '🧾', action: 'navigate', targetPage: '#produkte' },
        },
        {
          type: 'button',
          label: 'Feedback',
          icon: '⭐',
          defaultProps: { label: 'Feedback', icon: '⭐', action: 'navigate', targetPage: '#feedback' },
        },
        {
          type: 'button',
          label: 'Veranstaltungen',
          icon: '🎟️',
          defaultProps: { label: 'Events', icon: '🎟️', action: 'navigate', targetPage: '#events' },
        },
        {
          type: 'button',
          label: 'Filialfinder',
          icon: '📍',
          defaultProps: { label: 'Filialfinder', icon: '📍', action: 'url', url: 'https://maps.google.com' },
        },
      ],
    },
    {
      name: 'Kommunikation',
      items: [
        {
          type: 'button',
          label: 'Facebook',
          icon: '📘',
          defaultProps: { label: 'Facebook', icon: '📘', action: 'url', url: 'https://facebook.com' },
        },
        {
          type: 'button',
          label: 'Twitter',
          icon: '🐦',
          defaultProps: { label: 'Twitter', icon: '🐦', action: 'url', url: 'https://twitter.com' },
        },
        {
          type: 'button',
          label: 'RSS Feed',
          icon: '📡',
          defaultProps: { label: 'RSS', icon: '📡', action: 'url', url: 'https://example.com/rss.xml' },
        },
      ],
    },
    {
      name: 'Business',
      items: [
        {
          type: 'button',
          label: 'Shop',
          icon: '🛒',
          defaultProps: { label: 'Shop', icon: '🛒', action: 'url', url: 'https://example.com/shop' },
        },
        {
          type: 'button',
          label: 'Reservierung',
          icon: '🧾',
          defaultProps: { label: 'Reservierung', icon: '🧾', action: 'navigate', targetPage: '#reservierung' },
        },
        {
          type: 'button',
          label: 'Terminanfrage',
          icon: '📅',
          defaultProps: { label: 'Terminanfrage', icon: '📅', action: 'navigate', targetPage: '#termin' },
        },
        {
          type: 'button',
          label: 'Gutscheine',
          icon: '🎁',
          defaultProps: { label: 'Gutscheine', icon: '🎁', action: 'navigate', targetPage: '#gutscheine' },
        },
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
                onClick={() => onAdd(item.type, item.defaultProps)}
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
