"use client";

import React from "react";
import type { Node as EditorNode } from "../../../lib/editorTypes";

type Props = {
  selected: EditorNode | null;
  onChange: (patch: Partial<EditorNode>) => void;
};

const PropertiesPanel: React.FC<Props> = ({ selected, onChange }) => {
  if (!selected) {
    return (
      <div className="px-4 py-6 text-sm text-gray-400">
        Nichts ausgewählt. Klicke ein Element im Canvas an.
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 text-sm">
      <div className="text-gray-300">
        <div className="font-medium mb-1">Element</div>
        <div className="text-xs opacity-70">ID: {selected.id} • Typ: {selected.type}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <LabeledNumber label="X" value={selected.x ?? 0} onChange={(v) => onChange({ x: v })} />
        <LabeledNumber label="Y" value={selected.y ?? 0} onChange={(v) => onChange({ y: v })} />
        <LabeledNumber label="Breite" value={selected.w ?? 140} onChange={(v) => onChange({ w: v })} />
        <LabeledNumber label="Höhe" value={selected.h ?? 40} onChange={(v) => onChange({ h: v })} />
      </div>

      {selected.type === "text" && (
        <>
          <LabeledInput
            label="Text"
            value={selected.props?.text ?? ""}
            onChange={(v) => onChange({ props: { ...selected.props, text: v } })}
          />
          <LabeledSelect
            label="Ausrichtung"
            value={selected.props?.align ?? "left"}
            options={[
              { value: "left", label: "Links" },
              { value: "center", label: "Zentriert" },
              { value: "right", label: "Rechts" },
            ]}
            onChange={(v) => onChange({ props: { ...selected.props, align: v } })}
          />
          <LabeledColor
            label="Farbe"
            value={selected.props?.color ?? "#ffffff"}
            onChange={(v) => onChange({ props: { ...selected.props, color: v } })}
          />
          <LabeledNumber
            label="Schriftgröße"
            value={selected.props?.size ?? 16}
            onChange={(v) => onChange({ props: { ...selected.props, size: v } })}
          />
        </>
      )}

      {selected.type === "button" && (
        <>
          <LabeledInput
            label="Label"
            value={selected.props?.label ?? "Button"}
            onChange={(v) => onChange({ props: { ...selected.props, label: v } })}
          />
          <LabeledSelect
            label="Variante"
            value={selected.props?.variant ?? "primary"}
            options={[
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
            ]}
            onChange={(v) => onChange({ props: { ...selected.props, variant: v } })}
          />
        </>
      )}

      {selected.type === "image" && (
        <LabeledInput
          label="Bild-URL"
          value={selected.props?.src ?? ""}
          onChange={(v) => onChange({ props: { ...selected.props, src: v } })}
        />
      )}

      {selected.type === "input" && (
        <LabeledInput
          label="Platzhalter"
          value={selected.props?.placeholder ?? ""}
          onChange={(v) => onChange({ props: { ...selected.props, placeholder: v } })}
        />
      )}
    </div>
  );
};

export default PropertiesPanel;

/* ------- kleine Form Controls ------- */
function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void; }) {
  return (
    <label className="block">
      <span className="text-gray-300">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-[#0f1113] border border-[#2a2d31] rounded px-3 py-2 outline-none"
      />
    </label>
  );
}

function LabeledNumber({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void; }) {
  return (
    <label className="block">
      <span className="text-gray-300">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full bg-[#0f1113] border border-[#2a2d31] rounded px-3 py-2 outline-none"
      />
    </label>
  );
}

function LabeledSelect({
  label, value, options, onChange,
}: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-gray-300">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-[#0f1113] border border-[#2a2d31] rounded px-3 py-2 outline-none"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function LabeledColor({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void; }) {
  return (
    <label className="block">
      <span className="text-gray-300">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 rounded bg-[#0f1113] border border-[#2a2d31] p-1"
      />
    </label>
  );
}
