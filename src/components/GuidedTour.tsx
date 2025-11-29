'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

export type TourStep = {
  id: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
};

export type GuidedTourProps = {
  storageKey: string;
  steps: TourStep[];
  autoStart?: boolean;
  restartLabel?: string;
  className?: string;
};

const PADDING = 12;

export default function GuidedTour({
  storageKey,
  steps,
  autoStart = true,
  restartLabel = 'Tutorial',
  className,
}: GuidedTourProps) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => setMounted(true), []);

  const seenKey = useMemo(() => `${storageKey}:seen`, [storageKey]);

  const close = useCallback(() => {
    setActive(null);
    setHighlightRect(null);
  }, []);

  const start = useCallback(() => {
    if (!steps.length) return;
    setActive(0);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(seenKey, '1');
    }
  }, [seenKey, steps.length]);

  const next = useCallback(() => {
    setActive((prev) => {
      if (prev === null) return prev;
      if (prev >= steps.length - 1) return null;
      return prev + 1;
    });
  }, [steps.length]);

  const prev = useCallback(() => {
    setActive((prev) => {
      if (prev === null) return prev;
      if (prev <= 0) return prev;
      return prev - 1;
    });
  }, []);

  useEffect(() => {
    if (!autoStart || !steps.length || typeof window === 'undefined') return;
    const hasSeen = window.localStorage.getItem(seenKey);
    if (!hasSeen) {
      start();
    }
  }, [autoStart, seenKey, start, steps.length]);

  useEffect(() => {
    if (active === null) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        next();
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, close, next, prev]);

  useLayoutEffect(() => {
    if (active === null) return;
    const step = steps[active];
    if (!step) {
      setHighlightRect(null);
      return;
    }

    const updateRect = () => {
      const elements = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour-id="${step.id}"]`));
      for (const element of elements) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setHighlightRect(rect);
          return;
        }
      }
      setHighlightRect(null);
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [active, steps]);

  if (!mounted) return null;

  const restartButton = (
    <button
      type="button"
      className={`fixed z-30 top-4 right-4 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 shadow-lg backdrop-blur transition hover:border-cyan-400/60 hover:text-white ${className ?? ''}`}
      onClick={start}
    >
      {restartLabel}
    </button>
  );

  if (active === null) {
    return restartButton;
  }

  const step = steps[active];

  return (
    <>
      {restartButton}
      {createPortal(
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur" onClick={close} />
          {highlightRect && (
            <div
              className="pointer-events-none"
              style={{
                position: 'fixed',
                top: highlightRect.top - PADDING,
                left: highlightRect.left - PADDING,
                width: highlightRect.width + PADDING * 2,
                height: highlightRect.height + PADDING * 2,
                borderRadius: 16,
                boxShadow: '0 0 0 9999px rgba(2,6,23,0.78), 0 15px 45px rgba(6,182,212,0.3)',
                border: '2px solid rgba(14, 165, 233, 0.8)',
                backgroundColor: 'rgba(6,182,212,0.08)',
                transition: 'all 0.2s ease',
              }}
            />
          )}
          <div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4">
            <div className="pointer-events-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-[#050b17]/95 p-6 text-white shadow-2xl">
              <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-300">Schritt {active + 1} / {steps.length}</p>
              <h2 className="mt-3 text-2xl font-semibold">{step.title}</h2>
              <p className="mt-3 text-base text-neutral-100">{step.description}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="flex-1 rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/60 hover:text-white"
                  onClick={close}
                >
                  Abbrechen
                </button>
                {active > 0 && (
                  <button
                    type="button"
                    className="rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/60 hover:text-white"
                    onClick={prev}
                  >
                    Zurück
                  </button>
                )}
                <button
                  type="button"
                  className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
                  onClick={active === steps.length - 1 ? close : next}
                >
                  {active === steps.length - 1 ? 'Fertig' : 'Weiter'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
