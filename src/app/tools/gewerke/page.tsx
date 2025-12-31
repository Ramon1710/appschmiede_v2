// src/app/tools/gewerke/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import Header from '@/components/Header';
import UnauthenticatedScreen from '@/components/UnauthenticatedScreen';
import { auth, db } from '@/lib/firebase';
import type { PageTree } from '@/lib/editorTypes';
import { useI18n } from '@/lib/i18n';

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
  wantsChat: boolean;
  wantsLogin: boolean;
  wantsUpload: boolean;
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

  const features = [
    answers.wantsLogin ? (lang === 'en' ? 'include login & register' : 'inklusive Login & Registrierung') : null,
    answers.wantsChat ? (lang === 'en' ? 'include a chat page' : 'inklusive Chat-Seite') : null,
    answers.wantsUpload ? (lang === 'en' ? 'include uploads/support ticket' : 'inklusive Upload/Support') : null,
  ].filter(Boolean);

  const hint =
    features.length > 0
      ? lang === 'en'
        ? `Required: ${features.join(', ')}.`
        : `Wichtig: ${features.join(', ')}.`
      : lang === 'en'
        ? 'Keep it simple and usable.'
        : 'Halte es simpel und direkt nutzbar.';

  return `${base} ${hint}`.trim();
}

export default function TradesWizardPage() {
  const router = useRouter();
  const { lang } = useI18n();

  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [selectedIndustryId, setSelectedIndustryId] = useState<IndustryId | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<AppVariantId | null>(null);

  const [answers, setAnswers] = useState<WizardAnswers>({
    projectName: lang === 'en' ? 'My App' : 'Meine App',
    wantsChat: true,
    wantsLogin: true,
    wantsUpload: false,
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
            wantsLogin: 'Login / Register pages',
            wantsChat: 'Chat page',
            wantsUpload: 'Upload / Support flow',
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
            wantsLogin: 'Login / Registrierung',
            wantsChat: 'Chat-Seite',
            wantsUpload: 'Upload / Support',
          },
    [lang]
  );

  const selectedIndustry = useMemo(
    () => (selectedIndustryId ? INDUSTRIES.find((i) => i.id === selectedIndustryId) ?? null : null),
    [selectedIndustryId]
  );

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

  const resetToIndustry = () => {
    setSelectedVariant(null);
    setStep(0);
  };

  const resetToVariant = () => {
    setStep(1);
  };

  const proceed = () => {
    if (step === 0 && selectedIndustryId) setStep(1);
    if (step === 1 && selectedVariant) setStep(2);
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
              <div className="text-sm font-semibold">{copy.stepIndustry}</div>
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
                  onClick={proceed}
                  disabled={!selectedIndustryId}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-50"
                >
                  {copy.next}
                </button>
              </div>
            </div>
          )}

          {step === 1 && selectedIndustry && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{copy.stepVariant}</div>
                <button type="button" className="text-sm text-neutral-300 hover:text-white" onClick={resetToIndustry}>
                  {copy.back}
                </button>
              </div>

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
                      <div className="text-sm text-neutral-300">{lang === 'en' ? meta.description.en : meta.description.de}</div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={proceed}
                  disabled={!selectedVariant}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-50"
                >
                  {copy.next}
                </button>
              </div>
            </div>
          )}

          {step === 2 && selectedIndustry && selectedVariant && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{copy.stepQa}</div>
                <button type="button" className="text-sm text-neutral-300 hover:text-white" onClick={resetToVariant}>
                  {copy.back}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <label className="space-y-2 rounded-2xl border border-white/10 bg-neutral-950/40 p-4">
                  <div className="text-xs uppercase tracking-widest text-neutral-500">{copy.projectName}</div>
                  <input
                    value={answers.projectName}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, projectName: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                    placeholder={lang === 'en' ? 'e.g. Hair Studio' : 'z.B. Haarstudio'}
                  />
                </label>

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
                    <span>{copy.wantsChat}</span>
                    <input
                      type="checkbox"
                      checked={answers.wantsChat}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, wantsChat: e.target.checked }))}
                      className="h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                    <span>{copy.wantsUpload}</span>
                    <input
                      type="checkbox"
                      checked={answers.wantsUpload}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, wantsUpload: e.target.checked }))}
                      className="h-4 w-4"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={createProject}
                  disabled={creating}
                  className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-5 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:opacity-60"
                >
                  {creating ? copy.creating : copy.create}
                </button>
              </div>
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
