"use client";

import { useEffect, useMemo, useRef } from 'react';

const AD_CLIENT = 'ca-pub-9591311841405142';

type GoogleAdSlotProps = {
  slotId?: string;
  slotKey?: string;
  className?: string;
  style?: React.CSSProperties;
  format?: string;
  layout?: string;
  backgroundFallback?: React.ReactNode;
};

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

const resolveSlot = (slotId?: string, slotKey?: string) => {
  if (slotId) return slotId;
  if (!slotKey) return undefined;
  const envKey = `NEXT_PUBLIC_ADSENSE_SLOT_${slotKey}`;
  if (typeof process !== 'undefined') {
    return process.env[envKey];
  }
  return undefined;
};

export default function GoogleAdSlot({
  slotId,
  slotKey,
  className,
  style,
  format = 'auto',
  layout,
  backgroundFallback,
}: GoogleAdSlotProps) {
  const resolvedSlot = useMemo(() => resolveSlot(slotId, slotKey), [slotId, slotKey]);
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!resolvedSlot || typeof window === 'undefined') return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.warn('AdSense slot could not be filled', error);
    }
  }, [resolvedSlot]);

  if (!resolvedSlot) {
    return (
      <div className={`rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300 ${className ?? ''}`}>
        <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Anzeige</p>
        <div className="mt-2 text-neutral-300">
          {backgroundFallback ?? 'Konfiguriere ein Google AdSense Slot-ID, um hier Werbung anzuzeigen.'}
        </div>
      </div>
    );
  }

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle block overflow-hidden rounded-2xl border border-white/10 bg-black/20 ${className ?? ''}`}
      style={style ?? { display: 'block', minHeight: 250 }}
      data-ad-client={AD_CLIENT}
      data-ad-slot={resolvedSlot}
      data-ad-format={format}
      data-ad-layout={layout}
      data-full-width-responsive="true"
    />
  );
}
