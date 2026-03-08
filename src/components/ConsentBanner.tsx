'use client';

import { useEffect, useState } from 'react';
import {
  buildPrivacyConsent,
  dispatchPrivacyConsentChanged,
  PRIVACY_SETTINGS_EVENT,
  readPrivacyConsent,
  writePrivacyConsent,
  type PrivacyConsent,
} from '@/lib/privacy-consent';

function ConsentSettingsDialog({
  analyticsEnabled,
  onAnalyticsChange,
  onClose,
  onSave,
  onAcceptAll,
  onRejectAll,
}: {
  analyticsEnabled: boolean;
  onAnalyticsChange: (value: boolean) => void;
  onClose: () => void;
  onSave: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#090d16] p-6 text-sm text-neutral-200 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Datenschutzeinstellungen</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-300">
              Sie können hier festlegen, welche optionalen Technologien verwendet werden. Ihre Auswahl wirkt nur für die Zukunft und kann jederzeit erneut geändert werden.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-200 transition hover:bg-white/10"
            aria-label="Datenschutzeinstellungen schließen"
          >
            Schließen
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-white">Essenziell</h3>
                <p className="mt-2 leading-6 text-neutral-300">
                  Diese Technologien sind erforderlich, damit die Website und Ihr Nutzerkonto funktionieren. Dazu gehören insbesondere Login-Sitzungen, Sicherheitsfunktionen, Lastverteilung sowie technisch notwendige Speicherungen. Diese Kategorie kann nicht deaktiviert werden.
                </p>
              </div>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                Immer aktiv
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-white">Analyse</h3>
                <p className="mt-2 leading-6 text-neutral-300">
                  Mit Ihrer Einwilligung nutzen wir Firebase Analytics, um zu verstehen, wie unsere Website und Web-App verwendet werden. So können wir Reichweite, Nutzung und Funktionen verbessern. Dabei können Cookies oder vergleichbare Technologien auf Ihrem Endgerät eingesetzt und Nutzungsdaten pseudonym verarbeitet werden.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-white/10 bg-[#050814] px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-300">Aktiv</span>
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(event) => onAnalyticsChange(event.target.checked)}
                  className="h-4 w-4 accent-cyan-400"
                />
              </label>
            </div>
          </section>

          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-6 text-amber-100">
            <span className="font-semibold">Hinweis:</span> Push-Benachrichtigungen werden nicht über den Cookie-Banner aktiviert, sondern separat über Ihre Browser-Einwilligung gesteuert.
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onSave}
            className="rounded-full border border-white/10 bg-white px-5 py-2.5 text-sm font-semibold text-[#050814] transition hover:bg-neutral-200"
          >
            Auswahl speichern
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
          >
            Alle akzeptieren
          </button>
          <button
            type="button"
            onClick={onRejectAll}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-neutral-100 transition hover:bg-white/10"
          >
            Alle ablehnen
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [consent, setConsent] = useState<PrivacyConsent | null>(null);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const savedConsent = readPrivacyConsent();
    setConsent(savedConsent);
    setAnalyticsEnabled(savedConsent?.analytics ?? false);
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleOpenSettings = () => setSettingsOpen(true);
    window.addEventListener(PRIVACY_SETTINGS_EVENT, handleOpenSettings);
    return () => window.removeEventListener(PRIVACY_SETTINGS_EVENT, handleOpenSettings);
  }, []);

  const applyConsent = (nextAnalytics: boolean) => {
    const nextConsent = buildPrivacyConsent(nextAnalytics);
    writePrivacyConsent(nextConsent);
    dispatchPrivacyConsentChanged(nextConsent);
    setConsent(nextConsent);
    setAnalyticsEnabled(nextAnalytics);
    setSettingsOpen(false);
  };

  if (!mounted) {
    return null;
  }

  const shouldShowBanner = consent === null;

  return (
    <>
      {shouldShowBanner && !settingsOpen && (
        <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#050814]/95 px-4 py-4 shadow-2xl backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="max-w-4xl text-sm leading-6 text-neutral-200">
              Wir verwenden technisch notwendige Cookies und ähnliche Technologien, damit myappschmiede.com sicher funktioniert, Logins möglich sind und grundlegende Einstellungen gespeichert werden können. Analyse-Technologien (Firebase Analytics) verwenden wir nur mit Ihrer Einwilligung. Sie können Ihre Auswahl jederzeit über Datenschutzeinstellungen im Footer ändern.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-shrink-0">
              <button
                type="button"
                onClick={() => applyConsent(true)}
                className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Alle akzeptieren
              </button>
              <button
                type="button"
                onClick={() => applyConsent(false)}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-neutral-100 transition hover:bg-white/10"
              >
                Alle ablehnen
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="rounded-full border border-white/10 bg-white px-5 py-2.5 text-sm font-semibold text-[#050814] transition hover:bg-neutral-200"
              >
                Einstellungen
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <ConsentSettingsDialog
          analyticsEnabled={analyticsEnabled}
          onAnalyticsChange={setAnalyticsEnabled}
          onClose={() => setSettingsOpen(false)}
          onSave={() => applyConsent(analyticsEnabled)}
          onAcceptAll={() => applyConsent(true)}
          onRejectAll={() => applyConsent(false)}
        />
      )}
    </>
  );
}