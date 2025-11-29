'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import useAuth from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, type Timestamp } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail, updateProfile } from 'firebase/auth';
import type { FirebaseError } from 'firebase/app';
import { useRouter } from 'next/navigation';
import type { AppPlanId, BillingMethodInfo, BillingMethodType, PlanStatus } from '@/types/user';

interface UserProfileDoc {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  plan?: AppPlanId;
  planStatus?: PlanStatus;
  subscriptionRenewsAt?: Timestamp | null;
  billingMethod?: BillingMethodInfo | null;
  updatedAt?: ReturnType<typeof serverTimestamp>;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [profileDocExists, setProfileDocExists] = useState(false);
  const [plan, setPlan] = useState<AppPlanId>('free');
  const [planStatus, setPlanStatus] = useState<PlanStatus>('trialing');
  const [subscriptionRenewsAt, setSubscriptionRenewsAt] = useState<Date | null>(null);
  const [billingMethod, setBillingMethod] = useState<BillingMethodInfo | null>(null);
  const [billingEditMode, setBillingEditMode] = useState(false);
  const [billingType, setBillingType] = useState<BillingMethodType>('credit-card');
  const [billingHolder, setBillingHolder] = useState('');
  const [billingNumber, setBillingNumber] = useState('');
  const [billingExpiry, setBillingExpiry] = useState('');
  const [billingIban, setBillingIban] = useState('');
  const [billingBusy, setBillingBusy] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<'cancel' | 'delete' | null>(null);
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const canPasswordReauth = useMemo(
    () => Boolean(user?.providerData?.some((provider) => provider.providerId === 'password')),
    [user?.providerData]
  );

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? '');
    setEmail(user.email ?? '');
    const loadProfile = async () => {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      const exists = snap.exists();
      setProfileDocExists(exists);
      if (exists) {
        const data = snap.data() as UserProfileDoc;
        setFirstName(data.firstName ?? '');
        setLastName(data.lastName ?? '');
        setCompany(data.company ?? '');
        setPhone(data.phone ?? '');
        setPlan((data.plan ?? 'free') as AppPlanId);
        setPlanStatus((data.planStatus ?? 'trialing') as PlanStatus);
        setBillingMethod(data.billingMethod ?? null);
        setSubscriptionRenewsAt(data.subscriptionRenewsAt?.toDate ? data.subscriptionRenewsAt.toDate() : null);
        if (data.billingMethod?.type) {
          setBillingType(data.billingMethod.type);
          setBillingHolder(data.billingMethod.label?.split(' •••• ')[0] ?? '');
        }
        if (data.displayName) {
          setDisplayName(data.displayName);
        } else if (!user.displayName && data.firstName) {
          setDisplayName(`${data.firstName}${data.lastName ? ` ${data.lastName}` : ''}`.trim());
        }
        if (data.email) {
          setEmail(data.email);
        }
      }
    };
    void loadProfile();
  }, [user]);

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;

    try {
      setBusy(true);
      setStatus(null);
      let profileErrorMessage: string | null = null;
      let emailErrorMessage: string | null = null;
      let displayNameToPersist = displayName;

      if (user.displayName !== displayName) {
        try {
          await updateProfile(user, { displayName: displayName || undefined });
        } catch (error) {
          console.warn('updateProfile failed', error);
          const firebaseCode = (error as { code?: string }).code;
          if (firebaseCode === 'auth/requires-recent-login') {
            profileErrorMessage = 'Anzeigename konnte nicht geändert werden. Bitte melde dich kurz ab und wieder an.';
          } else {
            profileErrorMessage = 'Anzeigename konnte nicht aktualisiert werden.';
          }
          displayNameToPersist = user.displayName ?? '';
          setDisplayName(displayNameToPersist);
        }
      }

      let nextEmail = email || null;
      if (email && user.email !== email) {
        let skipEmailUpdate = false;
        if (canPasswordReauth && user.email) {
          if (!currentPassword) {
            emailErrorMessage = 'Bitte gib dein aktuelles Passwort ein, um deine E-Mail-Adresse zu ändern.';
            skipEmailUpdate = true;
          } else {
            try {
              const credential = EmailAuthProvider.credential(user.email, currentPassword);
              await reauthenticateWithCredential(user, credential);
            } catch (error) {
              console.warn('reauthenticateWithCredential failed', error);
              const firebaseCode = (error as { code?: string }).code;
              if (firebaseCode === 'auth/wrong-password') {
                emailErrorMessage = 'Das eingegebene Passwort war nicht korrekt.';
              } else {
                emailErrorMessage = 'Authentifizierung fehlgeschlagen. Bitte melde dich kurz ab und wieder an.';
              }
              skipEmailUpdate = true;
            }
          }
        } else {
          emailErrorMessage = 'Für dieses Login-Verfahren musst du dich neu anmelden, um die E-Mail zu ändern.';
          skipEmailUpdate = true;
        }

        if (!skipEmailUpdate) {
          try {
            await updateEmail(user, email);
          } catch (error) {
            console.warn('updateEmail failed', error);
            const firebaseCode = (error as { code?: string }).code;
            if (firebaseCode === 'auth/requires-recent-login') {
              emailErrorMessage = 'E-Mail konnte nicht geändert werden. Bitte melde dich kurz ab und wieder an.';
            } else if (firebaseCode === 'auth/email-already-in-use') {
              emailErrorMessage = 'Diese E-Mail-Adresse wird bereits verwendet.';
            } else if (firebaseCode === 'auth/invalid-email') {
              emailErrorMessage = 'Bitte gib eine gültige E-Mail-Adresse ein.';
            } else {
              emailErrorMessage = 'E-Mail-Adresse konnte nicht aktualisiert werden.';
            }
            skipEmailUpdate = true;
          }
        }

        if (skipEmailUpdate) {
          nextEmail = user.email ?? null;
          setEmail(user.email ?? '');
        }
        setCurrentPassword('');
      } else {
        setCurrentPassword('');
      }

      const ref = doc(db, 'users', user.uid);
      const payload = {
        displayName: displayNameToPersist || null,
        firstName: firstName || null,
        lastName: lastName || null,
        company: company || null,
        phone: phone || null,
        email: nextEmail,
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(ref, payload, { merge: true });
        if (!profileDocExists) {
          setProfileDocExists(true);
        }
      } catch (fireError) {
        console.error('Profil-Daten konnten nicht gespeichert werden', fireError);
        const firebaseCode = (fireError as FirebaseError)?.code;
        if (firebaseCode === 'permission-denied') {
          setStatus('Dir fehlt die Berechtigung, dieses Profil zu speichern. Bitte melde dich erneut an.');
        } else if (firebaseCode === 'resource-exhausted' || firebaseCode === 'unavailable') {
          setStatus('Der Speicherdienst ist gerade nicht erreichbar. Bitte versuche es gleich noch einmal.');
        } else {
          setStatus(`Profil konnte nicht gespeichert werden (${firebaseCode ?? 'unbekannter Fehler'}).`);
        }
        return;
      }

      const hints = [profileErrorMessage, emailErrorMessage].filter(Boolean);
      setStatus(hints.length ? `Gespeichert, aber Hinweis: ${hints.join(' ')}` : 'Änderungen gespeichert.');
    } catch (error) {
      console.error('Profil konnte nicht aktualisiert werden', error);
      const firebaseCode = (error as { code?: string }).code;
      if (firebaseCode === 'auth/requires-recent-login') {
        setStatus('Für die Änderung der E-Mail-Adresse ist eine erneute Anmeldung erforderlich. Bitte logge dich kurz aus und wieder ein.');
      } else {
        setStatus('Fehler beim Speichern. Bitte später erneut versuchen.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen text-neutral-100 p-6">
        <div className="mx-auto mt-6 w-full max-w-3xl space-y-6">
          <section className="rounded-3xl border border-white/10 bg-neutral-900/80 backdrop-blur-md p-6 shadow-xl">
            <h1 className="text-3xl font-semibold">Persönliche Daten</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Bearbeite deinen Namen, dein Unternehmen und deine Kontaktdaten. Die Änderungen werden sofort für zukünftige Projekte übernommen.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-neutral-900/80 backdrop-blur-md p-6 shadow-xl space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Aktuelles Abo</p>
                <h2 className="text-2xl font-semibold">
                  {plan === 'free' ? 'Free' : plan === 'starter' ? 'Starter' : plan === 'pro' ? 'Pro' : 'Business'}-Plan
                </h2>
                <p className="text-sm text-neutral-400">Status: {planStatus === 'active' ? 'Aktiv' : planStatus === 'canceled' ? 'Gekündigt' : 'Testphase'}</p>
                {subscriptionRenewsAt && (
                  <p className="text-xs text-neutral-400">
                    Nächste Verlängerung: {subscriptionRenewsAt.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <button
                  type="button"
                  className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 font-semibold text-rose-200 transition hover:bg-rose-500/20"
                  onClick={() => setConfirmDialog('cancel')}
                  disabled={subscriptionBusy || plan === 'free'}
                >
                  {subscriptionBusy && confirmDialog === 'cancel' ? 'Kündigt…' : 'Abo kündigen'}
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-white/20 px-4 py-2 text-white/80 transition hover:bg-white/10"
                  onClick={() => setConfirmDialog('delete')}
                  disabled={deleteBusy}
                >
                  {deleteBusy && confirmDialog === 'delete' ? 'Lösche…' : 'Account löschen'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-neutral-400">Zahlungsart</p>
                  <p className="text-sm text-neutral-100">{billingMethod?.label ?? 'Noch keine Zahlungsart hinterlegt'}</p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-200 transition hover:border-cyan-400/50 hover:text-white"
                  onClick={() => setBillingEditMode((prev) => !prev)}
                >
                  {billingEditMode ? 'Schließen' : 'Zahlungsart ändern'}
                </button>
              </div>

              {billingEditMode && (
                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!user) return;
                    if (!billingHolder.trim()) {
                      setStatus('Bitte gib den Karten- oder Kontoinhaber an.');
                      return;
                    }
                    setBillingBusy(true);
                    const ref = doc(db, 'users', user.uid);
                    try {
                      const nextMethod = billingType === 'credit-card'
                        ? (() => {
                            const digits = billingNumber.replace(/\D/g, '');
                            if (digits.length < 12) {
                              throw new Error('Bitte prüfe die Kartennummer.');
                            }
                            if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(billingExpiry)) {
                              throw new Error('Bitte gib das Ablaufdatum im Format MM/YY ein.');
                            }
                            const last4 = digits.slice(-4);
                            return {
                              type: 'credit-card' as const,
                              label: `${billingHolder || 'Kreditkarte'} •••• ${last4}`,
                              last4,
                              expiresAt: billingExpiry,
                            };
                          })()
                        : (() => {
                            const normalizedIban = billingIban.replace(/\s+/g, '');
                            if (normalizedIban.length < 12) {
                              throw new Error('Bitte gib eine vollständige IBAN ein.');
                            }
                            const last4 = normalizedIban.slice(-4);
                            return {
                              type: 'sepa' as const,
                              label: `${billingHolder || 'SEPA'} •••• ${last4}`,
                              last4,
                            };
                          })();
                      await setDoc(
                        ref,
                        {
                          billingMethod: nextMethod,
                          updatedAt: serverTimestamp(),
                        },
                        { merge: true }
                      );
                      setBillingMethod(nextMethod);
                      setBillingEditMode(false);
                      setStatus('Zahlungsart aktualisiert.');
                      setBillingNumber('');
                      setBillingExpiry('');
                      setBillingIban('');
                    } catch (error) {
                      setStatus((error as Error).message ?? 'Zahlungsart konnte nicht gespeichert werden.');
                    } finally {
                      setBillingBusy(false);
                    }
                  }}
                  className="mt-4 space-y-3 border-t border-white/5 pt-4"
                >
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    {[
                      { id: 'credit-card', label: 'Kreditkarte' },
                      { id: 'sepa', label: 'SEPA' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setBillingType(option.id as BillingMethodType)}
                        className={`rounded-full border px-3 py-1 ${
                          billingType === option.id
                            ? 'border-cyan-400 bg-cyan-500/20 text-white'
                            : 'border-white/20 text-neutral-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-neutral-400">Inhaber *</label>
                    <input
                      type="text"
                      value={billingHolder}
                      onChange={(event) => setBillingHolder(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                      placeholder="z. B. Alex Meyer"
                      required
                    />
                  </div>
                  {billingType === 'credit-card' ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-xs uppercase tracking-wide text-neutral-400">Kartennummer *</label>
                        <input
                          type="text"
                          value={billingNumber}
                          onChange={(event) => setBillingNumber(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                          placeholder="1234 5678 9012 3456"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-neutral-400">Ablauf (MM/YY) *</label>
                        <input
                          type="text"
                          value={billingExpiry}
                          onChange={(event) => setBillingExpiry(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                          placeholder="09/27"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs uppercase tracking-wide text-neutral-400">IBAN *</label>
                      <input
                        type="text"
                        value={billingIban}
                        onChange={(event) => setBillingIban(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                        placeholder="DE44 5001 0517 5407 3249 31"
                        required
                      />
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={billingBusy}
                      className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
                    >
                      {billingBusy ? 'Speichern…' : 'Zahlungsart speichern'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-neutral-900/80 backdrop-blur-md p-6 shadow-xl">
            {loading ? (
              <div className="py-10 text-center text-neutral-400">Lade Profil…</div>
            ) : !user ? (
              <div className="py-10 text-center text-neutral-400">
                Du bist nicht angemeldet. Bitte melde dich an, um dein Profil zu bearbeiten.
              </div>
            ) : (
              <form onSubmit={onSave} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Vorname</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                      placeholder="z. B. Alex"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Nachname</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                      placeholder="z. B. Meyer"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Angezeigter Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                    placeholder="z. B. Alex Meyer"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Unternehmen</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                    placeholder="z. B. AppSchmiede GmbH"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Telefon</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                    placeholder="z. B. +49 170 1234567"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">E-Mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                    placeholder="z. B. alex.meyer@example.com"
                  />
                </div>
                {canPasswordReauth && (
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Aktuelles Passwort (nur bei E-Mail-Änderung)</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                      placeholder="Passwort eingeben"
                    />
                    <p className="mt-1 text-xs text-neutral-500">Dieses Feld brauchst du nur, wenn du deine E-Mail-Adresse anpassen möchtest.</p>
                  </div>
                )}

                {status && (
                  <div className="rounded-lg border border-white/10 bg-neutral-800/80 px-3 py-2 text-sm text-neutral-200">
                    {status}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-cyan-400 hover:to-blue-400 disabled:opacity-60"
                  >
                    {busy ? 'Speichern…' : 'Änderungen speichern'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </main>

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950/95 p-6 text-white shadow-2xl">
            <h3 className="text-2xl font-semibold">
              {confirmDialog === 'cancel' ? 'Abo wirklich kündigen?' : 'Account wirklich löschen?'}
            </h3>
            <p className="mt-3 text-sm text-neutral-300">
              {confirmDialog === 'cancel'
                ? 'Nach der Kündigung bleibt dein Workspace erhalten, aber neue Abos müssen manuell reaktiviert werden.'
                : 'Das Löschen entfernt dein Konto dauerhaft. Dieser Schritt kann nicht rückgängig gemacht werden.'}
            </p>
            <div className="mt-6 flex justify-end gap-2 text-sm">
              <button
                type="button"
                className="rounded-lg border border-white/20 px-4 py-2 text-white/80 transition hover:border-white/40 hover:text-white"
                onClick={() => setConfirmDialog(null)}
                disabled={subscriptionBusy || deleteBusy}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className={`rounded-lg px-4 py-2 font-semibold shadow ${
                  confirmDialog === 'cancel'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                    : 'bg-gradient-to-r from-rose-500 to-red-600'
                }`}
                onClick={confirmDialog === 'cancel' ? async () => {
                  if (!user) return;
                  setSubscriptionBusy(true);
                  try {
                    await setDoc(
                      doc(db, 'users', user.uid),
                      {
                        plan: 'free',
                        planStatus: 'canceled',
                        subscriptionRenewsAt: null,
                        updatedAt: serverTimestamp(),
                      },
                      { merge: true }
                    );
                    setPlan('free');
                    setPlanStatus('canceled');
                    setSubscriptionRenewsAt(null);
                    setStatus('Abo wurde gekündigt. Du kannst jederzeit wieder upgraden.');
                  } catch (error) {
                    setStatus('Abo konnte nicht gekündigt werden. Bitte versuche es erneut.');
                  } finally {
                    setSubscriptionBusy(false);
                    setConfirmDialog(null);
                  }
                } : async () => {
                  if (!user) return;
                  setDeleteBusy(true);
                  try {
                    await user.delete();
                    await deleteDoc(doc(db, 'users', user.uid));
                    router.push('/');
                  } catch (error) {
                    const firebaseCode = (error as FirebaseError)?.code;
                    if (firebaseCode === 'auth/requires-recent-login') {
                      setStatus('Bitte melde dich erneut an, bevor du dein Konto löschen kannst.');
                    } else {
                      setStatus('Konto konnte nicht gelöscht werden. Bitte versuche es erneut.');
                    }
                  } finally {
                    setDeleteBusy(false);
                    setConfirmDialog(null);
                  }
                }}
                disabled={subscriptionBusy || deleteBusy}
              >
                {confirmDialog === 'cancel' ? 'Jetzt kündigen' : 'Konto löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
