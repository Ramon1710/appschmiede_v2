// src/app/tools/gewerke/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import Header from '@/components/Header';
import UnauthenticatedScreen from '@/components/UnauthenticatedScreen';
import { auth, db } from '@/lib/firebase';
import type { PageTree } from '@/lib/editorTypes';
import { useI18n } from '@/lib/i18n';
import { DEFAULT_PROJECT_ICON } from '@/lib/db-projects';

const LAST_PROJECT_STORAGE_KEY = 'appschmiede:last-project';

type IndustryId =
  | 'handwerk'
  | 'friseur'
  | 'gastronomie'
  | 'fitness'
  | 'immobilien'
  | 'verein';

type AppVariantId = 'presence' | 'booking' | 'team' | 'shop';

type Industry = {
  id: IndustryId;
  label: { de: string; en: string };
  description: { de: string; en: string };
  icon: string;
  variants: AppVariantId[];
};

type WizardAnswers = {
  projectName: string;
  audience: 'customers' | 'team';
  wantsLogin: boolean;
  wantsRegister: boolean;
  wantsPasswordReset: boolean;
  wantsChat: boolean;
  wantsSupport: boolean;
  wantsUploads: boolean;
  wantsBooking: boolean;
  wantsCatalog: boolean;
  wantsNews: boolean;
  wantsMap: boolean;
  wantsOnlineStatus: boolean;
  wantsQr: boolean;
  wantsTimeTracking: boolean;
  wantsTasks: boolean;
  wantsProjects: boolean;
  wantsNotifications: boolean;
};

type GeneratedPage = Omit<PageTree, 'id' | 'createdAt' | 'updatedAt'>;

type GeneratePagesResponse = {
  pages: GeneratedPage[];
};

const fallbackId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;

const INDUSTRIES: Industry[] = [
  {
    id: 'handwerk',
    label: { de: 'Handwerk', en: 'Crafts' },
    description: { de: 'Angebote, Kontakt, Projekte & Team.', en: 'Quotes, contact, projects & team.' },
    icon: '🛠️',
    variants: ['presence', 'booking', 'team'],
  },
  {
    id: 'friseur',
    label: { de: 'Friseur / Beauty', en: 'Hair & Beauty' },
    description: { de: 'Termin, Leistungen, Galerie & Kontakt.', en: 'Appointments, services, gallery & contact.' },
    icon: '💇‍♀️',
    variants: ['presence', 'booking'],
  },
  {
    id: 'gastronomie',
    label: { de: 'Gastronomie', en: 'Food & Beverage' },
    description: { de: 'Menü, Reservierung, News & Kontakt.', en: 'Menu, reservations, news & contact.' },
    icon: '🍽️',
    variants: ['presence', 'booking'],
  },
  {
    id: 'fitness',
    label: { de: 'Fitness / Studio', en: 'Fitness' },
    description: { de: 'Kurse, Community, Support & Updates.', en: 'Classes, community, support & updates.' },
    icon: '🏋️',
    variants: ['presence', 'team'],
  },
  {
    id: 'immobilien',
    label: { de: 'Immobilien', en: 'Real Estate' },
    description: { de: 'Objekte, Besichtigungen, Leads.', en: 'Listings, viewings, leads.' },
    icon: '🏡',
    variants: ['presence', 'team'],
  },
  {
    id: 'verein',
    label: { de: 'Verein / Community', en: 'Community' },
    description: { de: 'News, Termine, Support.', en: 'News, events, support.' },
    icon: '🤝',
    variants: ['presence', 'team'],
  },
];

const VARIANTS: Record<
  AppVariantId,
  {
    label: { de: string; en: string };
    description: { de: string; en: string };
    icon: string;
  }
> = {
  presence: {
    label: { de: 'Info & Kontakt', en: 'Info & Contact' },
    description: { de: 'Landing, Leistungen/Infos, Kontakt.', en: 'Landing, services/info, contact.' },
    icon: '📣',
  },
  booking: {
    label: { de: 'Termin & Buchung', en: 'Booking' },
    description: { de: 'Termin-Anfragen plus Kontakt.', en: 'Appointment requests plus contact.' },
    icon: '📅',
  },
  team: {
    label: { de: 'Team & Intern', en: 'Team & Internal' },
    description: { de: 'Schichtplan/Tasks/Chat – intern.', en: 'Scheduling/tasks/chat – internal.' },
    icon: '👥',
  },
  shop: {
    label: { de: 'Katalog & Shop', en: 'Catalog & Shop' },
    description: { de: 'Produkte/Leistungen plus Bestellungen.', en: 'Products/services plus orders.' },
    icon: '🛒',
  },
};

function buildPrompt(args: {
  lang: 'de' | 'en';
  industry: Industry;
  variant: AppVariantId;
  answers: WizardAnswers;
}) {
  const { lang, industry, variant, answers } = args;

  const base =
    lang === 'en'
      ? `Create an app for the industry: ${industry.label.en}. App type: ${VARIANTS[variant].label.en}.`
      : `Erstelle eine App für das Gewerk: ${industry.label.de}. App-Typ: ${VARIANTS[variant].label.de}.`;

  const keywords: string[] = [];

  // Audience drives company-suite page generation
  if (answers.audience === 'team' || variant === 'team') {
    keywords.push('unternehmen');
  }

  if (answers.wantsLogin) keywords.push('login');
  if (answers.wantsRegister) keywords.push('registrieren');
  if (answers.wantsPasswordReset) keywords.push('passwort reset');

  if (answers.wantsChat) keywords.push('chat');
  if (answers.wantsSupport) keywords.push('support ticket hilfe');
  if (answers.wantsUploads) keywords.push('upload foto');

  if (answers.wantsBooking) keywords.push('termin buchung reservierung');
  if (answers.wantsCatalog) {
    keywords.push(industry.id === 'gastronomie' ? 'menü speisekarte' : 'katalog shop produkte');
  }
  if (answers.wantsNews) keywords.push('news updates');
  if (answers.wantsMap) keywords.push('standort map');
  if (answers.wantsOnlineStatus) keywords.push('online status');
  if (answers.wantsQr) keywords.push('qr code');

  // Company suite modules
  if (answers.wantsTimeTracking) keywords.push('zeit tracking');
  if (answers.wantsTasks) keywords.push('aufgaben todo');
  if (answers.wantsProjects) keywords.push('projekt');
  if (answers.wantsNotifications) keywords.push('benachrichtigung');

  const needs = keywords.length
    ? lang === 'en'
      ? `Include pages and features for: ${keywords.join(', ')}.`
      : `Erzeuge Seiten & Funktionen für: ${keywords.join(', ')}.`
    : lang === 'en'
      ? 'Keep it simple and usable.'
      : 'Halte es simpel und direkt nutzbar.';

  return `${base} ${needs}`.trim();
}

type WizardStep = 0 | 1 | 2 | 3;

const isIndustryId = (value: string): value is IndustryId => {
  return INDUSTRIES.some((i) => i.id === value);
};

const getWizardRouteState = (pathname: string): { step: WizardStep; industryId: IndustryId | null } => {
  if (pathname.startsWith('/wizard/name-it')) return { step: 0, industryId: null };
  if (pathname === '/wizard/choose-it') return { step: 1, industryId: null };
  const match = pathname.match(/^\/wizard\/choose-it\/([^/]+)\/?$/);
  if (match && isIndustryId(match[1])) return { step: 2, industryId: match[1] };
  return { step: 0, industryId: null };
};

export default function TradesWizardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { lang } = useI18n();

  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const initialRoute = useMemo(() => getWizardRouteState(pathname ?? ''), [pathname]);
  const [step, setStep] = useState<WizardStep>(() => initialRoute.step);
  const [selectedIndustryId, setSelectedIndustryId] = useState<IndustryId | null>(() => initialRoute.industryId);
  const [selectedVariant, setSelectedVariant] = useState<AppVariantId | null>(null);

  const [answers, setAnswers] = useState<WizardAnswers>({
    projectName: lang === 'en' ? 'My App' : 'Meine App',
    audience: 'customers',
    wantsLogin: true,
    wantsRegister: true,
    wantsPasswordReset: false,
    wantsChat: false,
    wantsSupport: true,
    wantsUploads: false,
    wantsBooking: false,
    wantsCatalog: true,
    wantsNews: false,
    wantsMap: false,
    wantsOnlineStatus: false,
    wantsQr: false,
    wantsTimeTracking: false,
    wantsTasks: false,
    wantsProjects: false,
    wantsNotifications: false,
  });

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = useMemo(
    () =>
      lang === 'en'
        ? {
            badge: 'Industries',
            unauth: 'Sign in to create an app from an industry wizard.',
            title: 'Industries & App Wizard',
            subtitle: 'Pick your industry, answer a few questions and we create a ready-to-edit app project.',
            stepIndustry: 'Choose an industry',
            stepVariant: 'Choose an app type',
            stepQa: 'Quick questions',
            create: 'Create app project',
            creating: 'Creating…',
            back: 'Back',
            next: 'Next',
            projectName: 'Project name',
            audience: 'Audience',
            audienceCustomers: 'Customers / Public',
            audienceTeam: 'Team / Internal',
            wantsLogin: 'Login page',
            wantsRegister: 'Register page',
            wantsPasswordReset: 'Password reset',
            wantsChat: 'Chat page',
            wantsSupport: 'Support / Tickets',
            wantsUploads: 'Photo uploads',
            wantsBooking: 'Booking / Appointments',
            wantsCatalog: 'Catalog / Menu',
            wantsNews: 'News / Updates',
            wantsMap: 'Map / Locations',
            wantsOnlineStatus: 'Online status / presence',
            wantsQr: 'QR code page',
            companyModules: 'Internal modules',
            wantsTimeTracking: 'Time tracking',
            wantsTasks: 'Tasks / Todo',
            wantsProjects: 'Projects / folders',
            wantsNotifications: 'Notifications',
          }
        : {
            badge: 'Gewerke',
            unauth: 'Melde dich an, um über den Gewerk-Assistenten eine App zu erstellen.',
            title: 'Gewerke & App-Assistent',
            subtitle: 'Gewerk auswählen, kurz Fragen beantworten und wir erstellen im Hintergrund ein fertiges Projekt.',
            stepIndustry: 'Gewerk auswählen',
            stepVariant: 'App-Typ auswählen',
            stepQa: 'Kurzfragen',
            create: 'App-Projekt erstellen',
            creating: 'Wird erstellt…',
            back: 'Zurück',
            next: 'Weiter',
            projectName: 'Projektname',
            audience: 'Zielgruppe',
            audienceCustomers: 'Kund:innen / Öffentlich',
            audienceTeam: 'Team / Intern',
            wantsLogin: 'Login-Seite',
            wantsRegister: 'Registrierung',
            wantsPasswordReset: 'Passwort zurücksetzen',
            wantsChat: 'Chat-Seite',
            wantsSupport: 'Support / Tickets',
            wantsUploads: 'Foto-Uploads',
            wantsBooking: 'Termin / Buchung',
            wantsCatalog: 'Katalog / Menü',
            wantsNews: 'News / Updates',
            wantsMap: 'Karte / Standorte',
            wantsOnlineStatus: 'Online-Status / Anwesenheit',
            wantsQr: 'QR-Code Seite',
            companyModules: 'Interne Module',
            wantsTimeTracking: 'Zeiterfassung',
            wantsTasks: 'Aufgaben / Todo',
            wantsProjects: 'Projekte / Ordner',
            wantsNotifications: 'Benachrichtigungen',
          },
    [lang]
  );

  const selectedIndustry = useMemo(
    () => (selectedIndustryId ? INDUSTRIES.find((i) => i.id === selectedIndustryId) ?? null : null),
    [selectedIndustryId]
  );

  useEffect(() => {
    const next = getWizardRouteState(pathname ?? '');
    setStep(next.step);
    if (next.industryId) setSelectedIndustryId(next.industryId);
  }, [pathname]);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u ? { uid: u.uid, email: u.email } : null);
        setAuthReady(true);
      }),
    []
  );

  useEffect(() => {
    setAnswers((prev) => {
      if (prev.projectName && prev.projectName !== 'Meine App' && prev.projectName !== 'My App') return prev;
      return { ...prev, projectName: lang === 'en' ? 'My App' : 'Meine App' };
    });
  }, [lang]);

  const goNameIt = () => {
    setSelectedVariant(null);
    router.push('/wizard/name-it');
  };

  const goChooseIt = () => {
    setSelectedVariant(null);
    router.push('/wizard/choose-it');
  };

  const goChooseItIndustry = (industryId: IndustryId) => {
    setSelectedVariant(null);
    router.push(`/wizard/choose-it/${industryId}`);
  };

  const createProject = async () => {
    if (!user) return;
    if (!selectedIndustry || !selectedVariant) return;

    setCreating(true);
    setError(null);

    try {
      const prompt = buildPrompt({
        lang: lang === 'en' ? 'en' : 'de',
        industry: selectedIndustry,
        variant: selectedVariant,
        answers,
      });

      const res = await fetch('/api/ai/generate-pages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error(`generate-pages failed: ${res.status}`);
      }

      const data = (await res.json()) as GeneratePagesResponse;
      const pages = Array.isArray(data?.pages) ? data.pages : [];

      if (pages.length === 0) {
        throw new Error('No pages generated');
      }

      const projectId = fallbackId();

      await setDoc(doc(db, 'projects', projectId), {
        name: answers.projectName?.trim() ? answers.projectName.trim() : selectedIndustry.label.de,
        ownerId: user.uid,
        ownerUid: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastOpenedAt: serverTimestamp(),
        icon: DEFAULT_PROJECT_ICON,
      });

      await Promise.all(
        pages.map(async (p) => {
          const pageId = fallbackId();
          await setDoc(doc(collection(db, 'projects', projectId, 'pages'), pageId), {
            name: p.name,
            folder: p.folder ?? null,
            tree: p.tree,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        })
      );

      try {
        window.localStorage.setItem(LAST_PROJECT_STORAGE_KEY, projectId);
      } catch {
        // ignore
      }

      setStep(3);
      router.push(`/editor?projectId=${projectId}`);
    } catch (e) {
      console.error('Trades wizard create failed', e);
      setError(lang === 'en' ? 'Could not create the project. Please try again.' : 'Projekt konnte nicht erstellt werden. Bitte versuche es erneut.');
    } finally {
      setCreating(false);
    }
  };

  if (!authReady) return null;

  if (!user) {
    return (
      <>
        <Header />
        <UnauthenticatedScreen badge={copy.badge} description={copy.unauth} />
      </>
    );
  }

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 lg:px-10">
        <header className="space-y-2">
          <div className="text-xs uppercase tracking-[0.35em] text-neutral-500">{copy.badge}</div>
          <h1 className="text-3xl font-semibold">{copy.title}</h1>
          <p className="max-w-2xl text-sm text-neutral-300">{copy.subtitle}</p>
        </header>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="mt-8 rounded-2xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur-sm">
          {step === 0 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold">{lang === 'en' ? 'Name it' : 'Name it'}</div>
              <label className="space-y-2 rounded-2xl border border-white/10 bg-neutral-950/40 p-4">
                <div className="text-xs uppercase tracking-widest text-neutral-500">{copy.projectName}</div>
                <input
                  value={answers.projectName}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, projectName: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                  placeholder={lang === 'en' ? 'e.g. Hair Studio' : 'z.B. Haarstudio'}
                />
              </label>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={goChooseIt}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold transition hover:bg-white/10"
                >
                  {copy.next}
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{copy.stepIndustry}</div>
                <button type="button" className="text-sm text-neutral-300 hover:text-white" onClick={goNameIt}>
                  {copy.back}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {INDUSTRIES.map((industry) => {
                  const isActive = selectedIndustryId === industry.id;
                  return (
                    <button
                      key={industry.id}
                      type="button"
                      onClick={() => setSelectedIndustryId(industry.id)}
                      className={`flex flex-col gap-2 rounded-2xl border p-5 text-left transition hover:bg-white/5 ${
                        isActive ? 'border-cyan-400/50 bg-white/5' : 'border-white/10 bg-neutral-950/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{industry.icon}</div>
                        <div className="font-semibold">{lang === 'en' ? industry.label.en : industry.label.de}</div>
                      </div>
                      <div className="text-sm text-neutral-300">
                        {lang === 'en' ? industry.description.en : industry.description.de}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedIndustryId) goChooseItIndustry(selectedIndustryId);
                  }}
                  disabled={!selectedIndustryId}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-50"
                >
                  {copy.next}
                </button>
              </div>
            </div>
          )}

          {step === 2 && selectedIndustry && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{lang === 'en' ? 'Choose it' : 'Choose it'}</div>
                <button type="button" className="text-sm text-neutral-300 hover:text-white" onClick={goChooseIt}>
                  {copy.back}
                </button>
              </div>

              <div className="space-y-3">
                <div className="text-xs uppercase tracking-widest text-neutral-500">{copy.stepVariant}</div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {selectedIndustry.variants.map((variantId) => {
                    const meta = VARIANTS[variantId];
                    const isActive = selectedVariant === variantId;
                    return (
                      <button
                        key={variantId}
                        type="button"
                        onClick={() => setSelectedVariant(variantId)}
                        className={`flex flex-col gap-2 rounded-2xl border p-5 text-left transition hover:bg-white/5 ${
                          isActive ? 'border-cyan-400/50 bg-white/5' : 'border-white/10 bg-neutral-950/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{meta.icon}</div>
                          <div className="font-semibold">{lang === 'en' ? meta.label.en : meta.label.de}</div>
                        </div>
                        <div className="text-sm text-neutral-300">
                          {lang === 'en' ? meta.description.en : meta.description.de}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedVariant && (
                <>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-neutral-950/40 p-4">
                      <div className="text-xs uppercase tracking-widest text-neutral-500">{copy.audience}</div>
                      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                        <span>{copy.audienceCustomers}</span>
                        <input
                          type="radio"
                          name="audience"
                          checked={answers.audience === 'customers'}
                          onChange={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              audience: 'customers',
                              wantsTimeTracking: false,
                              wantsTasks: false,
                              wantsProjects: false,
                              wantsNotifications: false,
                            }))
                          }
                          className="h-4 w-4"
                        />
                      </label>
                      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                        <span>{copy.audienceTeam}</span>
                        <input
                          type="radio"
                          name="audience"
                          checked={answers.audience === 'team'}
                          onChange={() => setAnswers((prev) => ({ ...prev, audience: 'team' }))}
                          className="h-4 w-4"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-neutral-950/40 p-4">
                      <div className="text-xs uppercase tracking-widest text-neutral-500">Pages</div>

                      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                        <span>{copy.wantsCatalog}</span>
                        <input
                          type="checkbox"
                          checked={answers.wantsCatalog}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, wantsCatalog: e.target.checked }))}
                          className="h-4 w-4"
                        />
                      </label>

                      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                        <span>{copy.wantsBooking}</span>
                        <input
                          type="checkbox"
                          checked={answers.wantsBooking}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, wantsBooking: e.target.checked }))}
                          className="h-4 w-4"
                        />
                      </label>

                      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                        <span>{copy.wantsNews}</span>
                        <input
                          type="checkbox"
                          checked={answers.wantsNews}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, wantsNews: e.target.checked }))}
                          className="h-4 w-4"
                        />
                      </label>

                      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                        <span>{copy.wantsMap}</span>
                        <input
                          type="checkbox"
                          checked={answers.wantsMap}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, wantsMap: e.target.checked }))}
                          className="h-4 w-4"
                        />
                      </label>

                      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                        <span>{copy.wantsQr}</span>
                        <input
                          type="checkbox"
                          checked={answers.wantsQr}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, wantsQr: e.target.checked }))}
                          className="h-4 w-4"
                        />
                      </label>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-white/10 bg-neutral-950/40 p-4">
                      <div className="text-xs uppercase tracking-widest text-neutral-500">Features</div>

                      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                        <span>{copy.wantsLogin}</span>
                        <input
                          type="checkbox"
                          checked={answers.wantsLogin}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, wantsLogin: e.target.checked }))}
                          className="h-4 w-4"
                        />
                      </label>

                      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                        <span>{copy.wantsRegister}</span>
                        <input
                          type="checkbox"
                          checked={answers.wantsRegister}
                          onChange={(e) =>
                            setAnswers((prev) => ({
                              ...prev,
                              wantsRegister: e.target.checked,
                              wantsLogin: e.target.checked ? true : prev.wantsLogin,
                            }))
                          }
                          className="h-4 w-4"
                        />
                      </label>

                      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                        <span>{copy.wantsPasswordReset}</span>
                        <input
                          type="checkbox"
                          checked={answers.wantsPasswordReset}
                          onChange={(e) =>
                            setAnswers((prev) => ({
                              ...prev,
                              wantsPasswordReset: e.target.checked,
                              wantsLogin: e.target.checked ? true : prev.wantsLogin,
                            }))
                          }
                          className="h-4 w-4"
                        />
                      </label>

                      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                        <span>{copy.wantsChat}</span>
                        <input
                          type="checkbox"
                          checked={answers.wantsChat}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, wantsChat: e.target.checked }))}
                          className="h-4 w-4"
                        />
                      </label>

                      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                        <span>{copy.wantsSupport}</span>
                        <input
                          type="checkbox"
                          checked={answers.wantsSupport}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, wantsSupport: e.target.checked }))}
                          className="h-4 w-4"
                        />
                      </label>

                      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                        <span>{copy.wantsUploads}</span>
                        <input
                          type="checkbox"
                          checked={answers.wantsUploads}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, wantsUploads: e.target.checked }))}
                          className="h-4 w-4"
                        />
                      </label>

                      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                        <span>{copy.wantsOnlineStatus}</span>
                        <input
                          type="checkbox"
                          checked={answers.wantsOnlineStatus}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, wantsOnlineStatus: e.target.checked }))}
                          className="h-4 w-4"
                        />
                      </label>
                    </div>
                  </div>

                  {(answers.audience === 'team' || selectedVariant === 'team') && (
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-neutral-950/40 p-4">
                      <div className="text-xs uppercase tracking-widest text-neutral-500">{copy.companyModules}</div>
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                          <span>{copy.wantsTimeTracking}</span>
                          <input
                            type="checkbox"
                            checked={answers.wantsTimeTracking}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, wantsTimeTracking: e.target.checked }))}
                            className="h-4 w-4"
                          />
                        </label>
                        <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                          <span>{copy.wantsTasks}</span>
                          <input
                            type="checkbox"
                            checked={answers.wantsTasks}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, wantsTasks: e.target.checked }))}
                            className="h-4 w-4"
                          />
                        </label>
                        <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                          <span>{copy.wantsProjects}</span>
                          <input
                            type="checkbox"
                            checked={answers.wantsProjects}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, wantsProjects: e.target.checked }))}
                            className="h-4 w-4"
                          />
                        </label>
                        <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                          <span>{copy.wantsNotifications}</span>
                          <input
                            type="checkbox"
                            checked={answers.wantsNotifications}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, wantsNotifications: e.target.checked }))}
                            className="h-4 w-4"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={createProject}
                      disabled={creating || !selectedVariant}
                      className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-5 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:opacity-60"
                    >
                      {creating ? copy.creating : copy.create}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="text-sm font-semibold">{lang === 'en' ? 'Opening editor…' : 'Editor wird geöffnet…'}</div>
              <div className="text-sm text-neutral-300">
                {lang === 'en'
                  ? 'Your project was created. If the editor did not open, go to Projects and open the latest project.'
                  : 'Dein Projekt wurde erstellt. Falls der Editor nicht aufgeht, gehe zu „Projekte“ und öffne das neueste Projekt.'}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
