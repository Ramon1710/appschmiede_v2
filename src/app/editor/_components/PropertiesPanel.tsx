// path: src/app/editor/_components/PropertiesPanel.tsx
'use client';

import React from 'react';
import { useI18n } from '@/components/I18nProviderClient';

export default function PropertiesPanel({ selected, onChange }: any) {
  const { t } = useI18n();

  if (!selected) {
    return (
      <div>
        <div className="kicker">{t('props.title')}</div>
        <div className="text-sm text-muted mt-3">Wähle ein Element im Editor.</div>
      </div>
    );
  }

  if (selected.type === 'text') {
    return (
      <div>
        <div className="kicker mb-3">Text</div>
        <label className="text-sm mb-1 block">Text</label>
        <input className="w-full mb-3" value={selected.props?.text || ''} onChange={(e) => onChange({ props: { ...selected.props, text: e.target.value } })} />
        <label className="text-sm mb-1 block">Farbe</label>
        <input type="color" className="mb-3" value={selected.props?.color || '#ffffff'} onChange={(e) => onChange({ props: { ...selected.props, color: e.target.value } })} />
        <label className="text-sm mb-1 block">Größe: {selected.props?.fontSize || 16}px</label>
        <input type="range" min={10} max={48} value={selected.props?.fontSize || 16} onChange={(e) => onChange({ props: { ...selected.props, fontSize: Number(e.target.value) } })} />
      </div>
    );
  }

  if (selected.type === 'button') {
    return (
      <div>
        <div className="kicker mb-3">Button</div>
        <label className="text-sm mb-1 block">Label</label>
        <input className="w-full mb-3" value={selected.props?.label || ''} onChange={(e) => onChange({ props: { ...selected.props, label: e.target.value } })} />
        <label className="text-sm mb-1 block">Hintergrund</label>
        <input type="color" className="mb-3" value={selected.props?.bg || '#8b5cf6'} onChange={(e) => onChange({ props: { ...selected.props, bg: e.target.value } })} />
        <label className="text-sm mb-1 block">Textfarbe</label>
        <input type="color" value={selected.props?.color || '#ffffff'} onChange={(e) => onChange({ props: { ...selected.props, color: e.target.value } })} />
      </div>
    );
  }

  if (selected.type === 'image') {
    return (
      <div>
        <div className="kicker mb-3">Bild</div>
        <label className="text-sm mb-1 block">Bild-URL</label>
        <input className="w-full" value={selected.props?.src || ''} onChange={(e) => onChange({ props: { ...selected.props, src: e.target.value } })} />
      </div>
    );
  }

  if (selected.type === 'input') {
    return (
      <div>
        <div className="kicker mb-3">Eingabefeld</div>
        <label className="text-sm mb-1 block">Placeholder</label>
        <input className="w-full" value={selected.props?.placeholder || ''} onChange={(e) => onChange({ props: { ...selected.props, placeholder: e.target.value } })} />
      </div>
    );
  }

  if (selected.type === 'container') {
    return (
      <div>
        <div className="kicker mb-3">Container</div>
        <label className="text-sm mb-1 block">Hintergrund</label>
        <input type="color" value={selected.props?.bg || '#ffffff'} onChange={(e) => onChange({ props: { ...selected.props, bg: e.target.value } })} />
      </div>
    );
  }

  return <div>Keine Eigenschaften verfügbar.</div>;
}
