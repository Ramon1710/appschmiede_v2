"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useI18n } from '@/lib/i18n';

type Role = "owner" | "admin" | "editor" | "viewer";
type RegistrationMode = "open" | "invite" | "approval";
type NotificationSummary = "realtime" | "daily" | "weekly";

type Settings = {
  projectLabel: string;
  defaultRole: Role;
  roles: Record<Role, boolean>;
  registration: {
    mode: RegistrationMode;
    requireCompany: boolean;
    requireAddress: boolean;
    requirePhone: boolean;
    requireTaxId: boolean;
  };
  login: {
    password: boolean;
    magicLink: boolean;
    passkey: boolean;
    social: boolean;
    twoFactor: boolean;
    sessionTimeout: number;
  };
  notifications: {
    channels: {
      email: boolean;
      push: boolean;
      sms: boolean;
      inApp: boolean;
    };
    topics: {
      product: boolean;
      incidents: boolean;
      marketing: boolean;
      onboarding: boolean;
    };
    summary: NotificationSummary;
    quietHours: {
      start: string;
      end: string;
    };
  };
};

const getRoleLabels = (lang: 'de' | 'en'): Record<Role, { label: string; description: string }> =>
  lang === 'en'
    ? {
        owner: { label: 'Owner', description: 'All permissions including billing.' },
        admin: { label: 'Admin', description: 'Manage projects, invite members.' },
        editor: { label: 'Editor', description: 'Edit pages & publish.' },
        viewer: { label: 'Viewer', description: 'Read-only, no changes.' },
      }
    : {
        owner: { label: 'Owner', description: 'Alle Rechte inklusive Abrechnung.' },
        admin: { label: 'Admin', description: 'Projekte verwalten, Mitglieder einladen.' },
        editor: { label: 'Editor', description: 'Seiten bearbeiten & veröffentlichen.' },
        viewer: { label: 'Viewer', description: 'Nur lesen, keine Änderungen.' },
      };

const getRegistrationModes = (
  lang: 'de' | 'en'
): Array<{ value: RegistrationMode; title: string; description: string }> =>
  lang === 'en'
    ? [
        { value: 'open', title: 'Open registration', description: 'Anyone with the link can register.' },
        { value: 'invite', title: 'Invite only', description: 'New users need an invitation.' },
        { value: 'approval', title: 'Approval required', description: 'Registrations must be approved.' },
      ]
    : [
        { value: 'open', title: 'Offene Registrierung', description: 'Jeder mit dem Link darf sich registrieren.' },
        { value: 'invite', title: 'Nur Einladung', description: 'Neue Nutzer:innen benötigen eine Einladung.' },
        { value: 'approval', title: 'Genehmigungspflicht', description: 'Registrierungen müssen freigeschaltet werden.' },
      ];

const getNotificationSummaries = (lang: 'de' | 'en'): Array<{ value: NotificationSummary; label: string }> =>
  lang === 'en'
    ? [
        { value: 'realtime', label: 'Instant' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
      ]
    : [
        { value: 'realtime', label: 'Sofort' },
        { value: 'daily', label: 'Täglich' },
        { value: 'weekly', label: 'Wöchentlich' },
      ];

const createDefaultSettings = (lang: 'de' | 'en' = 'de'): Settings => ({
  projectLabel: lang === 'en' ? 'My project' : 'Mein Projekt',
  defaultRole: "editor",
  roles: { owner: true, admin: true, editor: true, viewer: true },
  registration: {
    mode: "open",
    requireCompany: true,
    requireAddress: false,
    requirePhone: true,
    requireTaxId: false,
  },
  login: {
    password: true,
    magicLink: true,
    passkey: false,
    social: false,
    twoFactor: true,
    sessionTimeout: 30,
  },
  notifications: {
    channels: {
      email: true,
      push: true,
      sms: false,
      inApp: true,
    },
    topics: {
      product: true,
      incidents: true,
      marketing: false,
      onboarding: true,
    },
    summary: "daily",
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
  },
});

const mergeSettings = (incoming: Partial<Settings>): Settings => {
  const base = createDefaultSettings();
  return {
    ...base,
    ...incoming,
    roles: { ...base.roles, ...(incoming.roles ?? {}) },
    registration: { ...base.registration, ...(incoming.registration ?? {}) },
    login: { ...base.login, ...(incoming.login ?? {}) },
    notifications: {
      ...base.notifications,
      ...(incoming.notifications ?? {}),
      channels: {
        ...base.notifications.channels,
        ...(incoming.notifications?.channels ?? {}),
      },
      topics: {
        ...base.notifications.topics,
        ...(incoming.notifications?.topics ?? {}),
      },
      quietHours: {
        ...base.notifications.quietHours,
        ...(incoming.notifications?.quietHours ?? {}),
      },
    },
  };
};

export default function SettingsClient() {
  const { lang } = useI18n();
  const tr = (de: string, en: string) => (lang === 'en' ? en : de);
  const roleLabels = useMemo(() => getRoleLabels(lang), [lang]);
  const registrationModes = useMemo(() => getRegistrationModes(lang), [lang]);
  const notificationSummaries = useMemo(() => getNotificationSummaries(lang), [lang]);

  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const storageKey = useMemo(
    () => `appschmiede-settings-${projectId ?? "global"}`,
    [projectId]
  );
  const [settings, setSettings] = useState<Settings>(() => createDefaultSettings(lang));
  const [savingState, setSavingState] = useState<"idle" | "saved">("idle");
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setStorageReady(false);
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Settings>;
        setSettings(mergeSettings(parsed));
      } else {
        setSettings(createDefaultSettings(lang));
      }
    } catch (error) {
      console.warn(lang === 'en' ? 'Could not read saved settings' : 'Konnte gespeicherte Einstellungen nicht lesen', error);
      setSettings(createDefaultSettings(lang));
    } finally {
      setStorageReady(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch (error) {
      console.warn(lang === 'en' ? 'Could not save settings' : 'Konnte Einstellungen nicht speichern', error);
    }
  }, [settings, storageKey, storageReady]);

  const handleRoleToggle = (role: Role) => {
    setSettings((prev) => ({
      ...prev,
      roles: { ...prev.roles, [role]: !prev.roles[role] },
    }));
  };

  const handleChannelToggle = (channel: keyof Settings["notifications"]["channels"]) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        channels: {
          ...prev.notifications.channels,
          [channel]: !prev.notifications.channels[channel],
        },
      },
    }));
  };

  const handleTopicToggle = (topic: keyof Settings["notifications"]["topics"]) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        topics: {
          ...prev.notifications.topics,
          [topic]: !prev.notifications.topics[topic],
        },
      },
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingState("saved");
    window.setTimeout(() => setSavingState("idle"), 4000);
  };

  const handleReset = () => {
    setSettings(createDefaultSettings(lang));
    setSavingState("idle");
  };

  const editorHref = projectId ? `/editor?projectId=${projectId}` : "/editor";

  const registrationFields = lang === 'en'
    ? [
        { key: 'requireCompany', label: 'Require company name' },
        { key: 'requireAddress', label: 'Require address' },
        { key: 'requirePhone', label: 'Require phone number' },
        { key: 'requireTaxId', label: 'Store tax ID' },
      ]
    : [
        { key: 'requireCompany', label: 'Firmennamen abfragen' },
        { key: 'requireAddress', label: 'Adresse verpflichtend' },
        { key: 'requirePhone', label: 'Telefonnummer anfordern' },
        { key: 'requireTaxId', label: 'Steuer-ID speichern' },
      ];

  const loginOptions = lang === 'en'
    ? [
        { key: 'password', label: 'Email & password' },
        { key: 'magicLink', label: 'Magic link' },
        { key: 'passkey', label: 'Passkeys / FIDO2' },
        { key: 'social', label: 'Social login' },
        { key: 'twoFactor', label: 'Require 2FA' },
      ]
    : [
        { key: 'password', label: 'E-Mail & Passwort' },
        { key: 'magicLink', label: 'Magic Link' },
        { key: 'passkey', label: 'Passkeys / FIDO2' },
        { key: 'social', label: 'Social Login' },
        { key: 'twoFactor', label: '2FA Pflicht' },
      ];

  return (
    <div className="min-h-screen bg-[#05070e] text-neutral-100 flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">{tr('Globale App-Einstellungen', 'Global app settings')}</p>
              <h1 className="text-3xl font-semibold">{tr('Projektweite Konfiguration', 'Project-wide configuration')}</h1>
              <p className="text-sm text-neutral-400">
                {tr(
                  'Definiere Berechtigungen, Registrierungs- & Login-Formate sowie Push-Benachrichtigungen für deine App.',
                  'Define permissions, registration & login formats, and push notifications for your app.'
                )}
                {projectId ? ` Aktuelles Projekt: ${projectId}` : ""}
              </p>
            </div>
            <Link
              href={editorHref}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {tr('← Zurück zum Editor', '← Back to editor')}
            </Link>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Sections identical to previous implementation */}
            <section className="rounded-2xl border border-white/10 bg-[#0b0b12] p-6 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="text-sm font-semibold text-neutral-200">{tr('Rechte & Rollen', 'Permissions & roles')}</div>
                <p className="text-sm text-neutral-400">
                  {tr(
                    'Aktiviere die Rollen, die deinem Team zur Verfügung stehen sollen und definiere eine Standardrolle.',
                    'Enable the roles your team should have access to and define a default role.'
                  )}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(roleLabels).map(([key, meta]) => (
                  <label
                    key={key}
                    className={`rounded-xl border px-4 py-3 text-sm transition ${
                      settings.roles[key as Role]
                        ? "border-emerald-400/50 bg-emerald-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4"
                        checked={settings.roles[key as Role]}
                        onChange={() => handleRoleToggle(key as Role)}
                      />
                      <div>
                        <div className="font-semibold">{meta.label}</div>
                        <p className="text-xs text-neutral-400">{meta.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-neutral-500">{tr('Standardrolle', 'Default role')}</label>
                <select
                  className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
                  value={settings.defaultRole}
                  onChange={(event) => setSettings((prev) => ({ ...prev, defaultRole: event.target.value as Role }))}
                >
                  {Object.entries(roleLabels).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0b0b12] p-6 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="text-sm font-semibold text-neutral-200">{tr('Registrierungs-Workflow', 'Registration workflow')}</div>
                <p className="text-sm text-neutral-400">
                  {tr(
                    'Lege fest, wie Nutzer:innen beitreten und welche Daten verpflichtend sind.',
                    'Define how users join and which data is required.'
                  )}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {registrationModes.map((mode) => (
                  <label
                    key={mode.value}
                    className={`rounded-2xl border px-4 py-3 text-sm transition ${
                      settings.registration.mode === mode.value
                        ? "border-cyan-400/60 bg-cyan-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="registration-mode"
                        className="mt-1"
                        checked={settings.registration.mode === mode.value}
                        onChange={() => setSettings((prev) => ({
                          ...prev,
                          registration: { ...prev.registration, mode: mode.value },
                        }))}
                      />
                      <div>
                        <div className="font-semibold">{mode.title}</div>
                        <p className="text-xs text-neutral-400">{mode.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {registrationFields.map((field) => (
                  <label key={field.key} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={settings.registration[field.key as keyof Settings["registration"]] as boolean}
                      onChange={() =>
                        setSettings((prev) => ({
                          ...prev,
                          registration: {
                            ...prev.registration,
                            [field.key]: !prev.registration[field.key as keyof Settings["registration"]],
                          },
                        }))
                      }
                    />
                    <span>{field.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0b0b12] p-6 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="text-sm font-semibold text-neutral-200">{tr('Login & Sicherheit', 'Login & security')}</div>
                <p className="text-sm text-neutral-400">
                  {tr('Kombiniere die Login-Methoden, die deine App unterstützen soll.', 'Combine the login methods your app should support.')}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {loginOptions.map((option) => (
                  <label key={option.key} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={settings.login[option.key as keyof Settings["login"]] as boolean}
                      onChange={() =>
                        setSettings((prev) => ({
                          ...prev,
                          login: {
                            ...prev.login,
                            [option.key]: !prev.login[option.key as keyof Settings["login"]],
                          },
                        }))
                      }
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-neutral-500">{tr('Session-Timeout (Minuten)', 'Session timeout (minutes)')}</label>
                <input
                  type="number"
                  min={5}
                  max={1440}
                  value={settings.login.sessionTimeout}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      login: { ...prev.login, sessionTimeout: Number(event.target.value) },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0b0b12] p-6 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="text-sm font-semibold text-neutral-200">{tr('Push & Benachrichtigungen', 'Push & notifications')}</div>
                <p className="text-sm text-neutral-400">
                  {tr(
                    'Steuere Kanäle, Themen und Ruhezeiten für globale Mitteilungen.',
                    'Control channels, topics and quiet hours for global announcements.'
                  )}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {(
                  Object.keys(settings.notifications.channels) as Array<
                    keyof Settings["notifications"]["channels"]
                  >
                ).map((channel) => (
                  <label key={channel} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={settings.notifications.channels[channel]}
                      onChange={() => handleChannelToggle(channel)}
                    />
                    <span className="capitalize">{channel}</span>
                  </label>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {(
                  Object.keys(settings.notifications.topics) as Array<
                    keyof Settings["notifications"]["topics"]
                  >
                ).map((topic) => (
                  <label key={topic} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={settings.notifications.topics[topic]}
                      onChange={() => handleTopicToggle(topic)}
                    />
                    <span className="capitalize">{topic}</span>
                  </label>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-xs uppercase tracking-widest text-neutral-500">{tr('Zusammenfassung', 'Summary')}</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
                    value={settings.notifications.summary}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          summary: event.target.value as NotificationSummary,
                        },
                      }))
                    }
                  >
                    {notificationSummaries.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-neutral-500">{tr('Ruhezeit Start', 'Quiet hours start')}</label>
                  <input
                    type="time"
                    value={settings.notifications.quietHours.start}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          quietHours: { ...prev.notifications.quietHours, start: event.target.value },
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-neutral-500">{tr('Ruhezeit Ende', 'Quiet hours end')}</label>
                  <input
                    type="time"
                    value={settings.notifications.quietHours.end}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          quietHours: { ...prev.notifications.quietHours, end: event.target.value },
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 text-sm text-neutral-400">
                {savingState === "saved" ? (
                  <span className="text-emerald-300">{tr('✓ Einstellungen gespeichert (lokal)', '✓ Settings saved (local)')}</span>
                ) : (
                  <span>{tr('Änderungen werden lokal im Browser gesichert.', 'Changes are stored locally in your browser.')}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:bg-white/10"
                >
                  {tr('Zurücksetzen', 'Reset')}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-400 hover:to-cyan-400"
                >
                  {tr('Einstellungen speichern', 'Save settings')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
