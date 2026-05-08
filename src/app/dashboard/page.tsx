// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import Header from '@/components/Header';
import UnauthenticatedScreen from '@/components/UnauthenticatedScreen';
import GuidedTour from '@/components/GuidedTour';
import type { Project } from '@/lib/db-projects';
import { subscribeProjects } from '@/lib/db-projects';
import { TEMP_FREE_ACCESS_CUTOFF_LABEL_DE, TEMP_FREE_ACCESS_CUTOFF_LABEL_EN } from '@/config/billing';
import { getStoredProjectId } from '@/lib/editor-storage';
import { useI18n } from '@/lib/i18n';
import useUserProfile from '@/hooks/useUserProfile';

export default function DashboardPage() {
  const { lang } = useI18n();
  const tr = (de: string, en: string) => (lang === 'en' ? en : de);
  const freePhaseLabel = lang === 'en' ? TEMP_FREE_ACCESS_CUTOFF_LABEL_EN : TEMP_FREE_ACCESS_CUTOFF_LABEL_DE;
  const locale = lang === 'en' ? 'en-US' : 'de-DE';
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);

  const forceStartToken = searchParams.get('tour') === 'welcome' ? 'welcome' : null;
  const shouldAutoStartTour = !profileLoading && Boolean(profile?.onboarding?.welcomeTourPending);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u ? { uid: u.uid, email: u.email } : null)), []);

  useEffect(() => {
    if (!user?.uid) return;
    const off = subscribeProjects(user.uid, (p) => setProjects(p));
    return () => off();
  }, [user?.uid]);

  useEffect(() => {
    const hydrate = () => setActiveProjectId(getStoredProjectId());
    hydrate();
    window.addEventListener('storage', hydrate);
    return () => window.removeEventListener('storage', hydrate);
  }, []);

  useEffect(() => {
    if (forceStartToken !== 'welcome') return;
    router.replace('/dashboard');
  }, [forceStartToken, router]);

  useEffect(() => {
    if (!user?.uid || !shouldAutoStartTour) return;
    void setDoc(
      doc(db, 'users', user.uid),
      {
        onboarding: {
          welcomeTourPending: false,
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }, [shouldAutoStartTour, user?.uid]);

  if (!user)
    return (
      <UnauthenticatedScreen
        badge={tr('Dashboard', 'Dashboard')}
        description={tr(
          'Melde dich an, um dein Dashboard zu sehen, Projekte zu öffnen oder neue Apps zu starten.',
          'Sign in to see your dashboard, open projects, or start new apps.'
        )}
      />
    );

  const tourSteps = [
    {
      id: 'dashboard-cta',
      title: tr('Loslegen mit Projekten', 'Get started with projects'),
      description: tr(
        'Hier startest du entweder ein neues Projekt oder springst direkt zu bestehenden Arbeitsflächen.',
        'Start a new project or jump into existing workspaces.'
      ),
    },
    {
      id: 'dashboard-shortcuts',
      title: tr('Schnellzugriffe', 'Shortcuts'),
      description: tr('Diese Kacheln bringen dich ohne Umwege in Projekte, Editor oder Vorlagen.', 'These tiles take you straight to projects, the editor, or templates.'),
    },
    {
      id: 'dashboard-recent',
      title: tr('Zuletzt bearbeitet', 'Recently edited'),
      description: tr(
        'Hier findest du die Projekte, die du zuletzt geöffnet hast – perfekt zum Weiterarbeiten.',
        'Pick up where you left off with your most recently opened projects.'
      ),
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen w-full bg-neutral-950 px-4 py-10 text-neutral-100 lg:px-10">
        <div className="flex w-full flex-col gap-6">
            <header className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <span className="ml-auto text-sm opacity-70">{user.email}</span>
            </header>

            <section className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-neutral-900/80 backdrop-blur-md p-6 shadow-2xl md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-400/80">{tr('Willkommen zurück', 'Welcome back')}</p>
                <h2 className="text-4xl font-semibold leading-tight">{tr('Baue deine nächste App in Minuten.', 'Build your next app in minutes.')}</h2>
                <p className="text-sm text-neutral-400">
                  {tr(
                    `Verwalte deine Projekte, teste neue Ideen im Editor und nutze alle Vorlagen ${freePhaseLabel} kostenlos. Nur KI-Aktionen brauchen aktuell Coins.`,
                    `Manage projects, test ideas in the editor, and use every template for free ${freePhaseLabel}. Only AI actions currently require coins.`
                  )}
                </p>
                <div className="flex gap-3 pt-2 text-sm">
                  <Link
                    href="/projects"
                    data-tour-id="dashboard-cta"
                    className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:from-cyan-400 hover:to-blue-400"
                  >
                    {tr('Projekte öffnen', 'Open projects')}
                  </Link>
                  <Link
                    href="/editor"
                    className="rounded-full border border-white/30 px-4 py-2 font-semibold text-neutral-100 hover:bg-white/10"
                  >
                    {tr('Direkt zum Editor', 'Go to editor')}
                  </Link>
                </div>
              </div>
              <div className="relative mx-auto flex h-48 w-48 items-center justify-center md:mx-0 md:h-56 md:w-56">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-fuchsia-600 blur-3xl opacity-40" />
                <Image src="/logo.png" alt="AppSchmiede Logo" width={220} height={220} priority className="relative drop-shadow-2xl" />
              </div>
            </section>

            {/* Quick Links */}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3" data-tour-id="dashboard-shortcuts">
              <Link
                href="/projects"
                className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur-sm p-6 transition hover:bg-neutral-800/80"
              >
                <div className="text-4xl">📁</div>
                <span className="font-semibold">{tr('Projekte', 'Projects')}</span>
                <span className="text-xs text-neutral-400">{tr('Alle Projekte verwalten', 'Manage all projects')}</span>
              </Link>
              <Link
                href="/editor"
                className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur-sm p-6 transition hover:bg-neutral-800/80"
              >
                <div className="text-4xl">✏️</div>
                <span className="font-semibold">{tr('Editor', 'Editor')}</span>
                <span className="text-xs text-neutral-400">{tr('Neues Projekt erstellen', 'Create a new project')}</span>
              </Link>
              <Link
                href="/tools/templates"
                className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur-sm p-6 transition hover:bg-neutral-800/80"
              >
                <div className="text-4xl">🧩</div>
                <span className="font-semibold">{tr('Vorlagen', 'Templates')}</span>
                <span className="text-xs text-neutral-400">{tr('Fertige Apps kostenlos kopieren', 'Copy ready-made apps for free')}</span>
              </Link>
            </section>

            {/* Recent Projects */}
            <section className="rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur-sm p-4 space-y-3" data-tour-id="dashboard-recent">
              <h2 className="font-semibold">{tr('Zuletzt bearbeitet', 'Recently edited')}</h2>
              {projects.length === 0 ? (
                <div className="text-sm opacity-70">
                  {tr('Keine Projekte gefunden. Erstelle ein neues Projekt über "Projekte".', 'No projects found. Create one via “Projects”.')}
                </div>
              ) : (
                <div className="space-y-2">
                  {[...projects]
                    .sort((a, b) => {
                      const getTime = (value: any) => {
                        if (!value) return 0;
                        if (typeof value.toMillis === 'function') return value.toMillis();
                        if (typeof value.toDate === 'function') return value.toDate().getTime();
                        if (typeof value.seconds === 'number') return value.seconds * 1000;
                        return Number(value) || 0;
                      };
                      return getTime(b.updatedAt) - getTime(a.updatedAt);
                    })
                    .slice(0, 3)
                    .map((p) => {
                      const isActive = p.id === activeProjectId;
                      const icon = p.icon?.trim() || '📱';
                      const dateLabel = p.updatedAt?.toDate
                        ? new Date(p.updatedAt.toDate()).toLocaleDateString(locale, {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : tr('Neu', 'New');
                      return (
                        <Link
                          key={p.id}
                          href={`/editor?id=${p.id}`}
                          className={`flex items-center gap-3 rounded-xl border border-white/10 p-3 transition hover:bg-neutral-800 ${isActive ? 'border-cyan-400/40 bg-cyan-500/5' : ''}`}
                        >
                          <div className="text-2xl">{icon}</div>
                          <div className="flex-1">
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-neutral-400">{dateLabel}</div>
                          </div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                            {isActive ? tr('Aktiv', 'Active') : tr('Weiter', 'Continue')}
                          </div>
                        </Link>
                      );
                    })}
                </div>
              )}
            </section>
          </div>
      </main>
      <GuidedTour storageKey="tour-dashboard" steps={tourSteps} autoStart={shouldAutoStartTour} forceStartToken={forceStartToken} />
    </>
  );
}
