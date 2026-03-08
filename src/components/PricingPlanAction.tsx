'use client';

import Link from 'next/link';
import { useState } from 'react';
import useAuth from '@/hooks/useAuth';
import useUserProfile from '@/hooks/useUserProfile';
import { buildAuthHeaders } from '@/lib/client-auth';
import type { AppPlanId } from '@/types/user';

type PricingPlanActionProps = {
  planId: AppPlanId;
  lang: 'de' | 'en';
};

export default function PricingPlanAction({ planId, lang }: PricingPlanActionProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.uid);
  const [busy, setBusy] = useState(false);

  const tr = (de: string, en: string) => (lang === 'en' ? en : de);
  const currentPlan = profile?.plan ?? 'free';

  if (planId === 'free') {
    return user ? (
      <div className="mt-6 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-center text-sm text-neutral-300">
        {currentPlan === 'free' ? tr('Aktueller Einstiegstarif', 'Current starter plan') : tr('Free bleibt jederzeit verfügbar', 'Free always remains available')}
      </div>
    ) : (
      <Link
        href="/register"
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
      >
        {tr('Kostenlos starten', 'Start for free')}
      </Link>
    );
  }

  const checkout = async () => {
    if (!user?.uid || busy) return;
    setBusy(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: await buildAuthHeaders(user, { 'content-type': 'application/json' }),
        body: JSON.stringify({ kind: 'plan', planId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? tr('Checkout konnte nicht gestartet werden.', 'Checkout could not be started.'));
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : tr('Checkout konnte nicht gestartet werden.', 'Checkout could not be started.'));
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <Link
        href="/register"
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#050c1c] transition hover:bg-neutral-200"
      >
        {tr('Registrieren und buchen', 'Register and subscribe')}
      </Link>
    );
  }

  if (currentPlan === planId) {
    return (
      <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-100">
        {tr('Aktueller Plan', 'Current plan')}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void checkout()}
      disabled={busy}
      className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#050c1c] transition hover:bg-neutral-200 disabled:cursor-wait disabled:opacity-60"
    >
      {busy ? tr('Weiter zu Stripe…', 'Continue to Stripe…') : tr('Plan buchen', 'Subscribe now')}
    </button>
  );
}