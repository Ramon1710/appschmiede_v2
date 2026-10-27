'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile, type User } from 'firebase/auth';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { auth } from '@/lib/firebase';

type InvitationInfo = {
  email: string;
  expiresAt: string | null;
};

function errorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('code' in error)) return null;
  return typeof error.code === 'string' ? error.code : null;
}

export default function InviteClient({ token }: { token: string }) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [existingAccount, setExistingAccount] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const redeeming = useRef(false);

  useEffect(() => {
    let active = true;
    if (!token) return undefined;

    fetch('/api/invitations/validate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? 'Einladung ungültig.');
        if (active) setInvitation(data as InvitationInfo);
      })
      .catch((error: unknown) => {
        if (active) setValidationError(error instanceof Error ? error.message : 'Einladung ungültig.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => onAuthStateChanged(auth, setAuthUser), []);

  useEffect(() => {
    if (!authUser || !invitation || redeeming.current) return undefined;
    let active = true;

    const redeemIfVerified = async () => {
      try {
        await authUser.reload();
        const currentUser = auth.currentUser;
        if (!active || !currentUser) return;
        if (currentUser.email?.trim().toLowerCase() !== invitation.email.trim().toLowerCase()) {
          setValidationError('Bitte melde dich mit der eingeladenen E-Mail-Adresse an.');
          return;
        }
        redeeming.current = true;
        setBusy(true);
        setNotice('Einladung wird eingelöst …');
        const idToken = await currentUser.getIdToken(true);
        const response = await fetch('/api/invitations/redeem', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ token, displayName }),
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? 'Einladung konnte nicht eingelöst werden.');
        router.replace('/dashboard');
      } catch (error) {
        redeeming.current = false;
        if (active) setValidationError(error instanceof Error ? error.message : 'Einladung konnte nicht eingelöst werden.');
      } finally {
        if (active) setBusy(false);
      }
    };

    void redeemIfVerified();
    return () => {
      active = false;
    };
  }, [authUser, displayName, invitation, refreshKey, router, token]);

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invitation) return;
    setValidationError(null);
    setNotice(null);
    if (password.length < 6) {
      setValidationError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Die Passwörter stimmen nicht überein.');
      return;
    }

    setBusy(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, invitation.email, password);
      if (displayName.trim()) await updateProfile(credential.user, { displayName: displayName.trim() });
      setAuthUser(credential.user);
      setNotice('Konto erstellt. Dein Einladungszugang wird eingerichtet.');
      setRefreshKey((value) => value + 1);
    } catch (error) {
      if (errorCode(error) === 'auth/email-already-in-use') {
        setExistingAccount(true);
        setNotice('Für diese E-Mail-Adresse besteht bereits ein Konto. Melde dich an, um die Einladung einzulösen.');
      } else {
        setValidationError('Konto konnte nicht angelegt werden. Prüfe deine Eingaben und versuche es erneut.');
      }
    } finally {
      setBusy(false);
    }
  };

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invitation) return;
    setValidationError(null);
    setNotice(null);
    setBusy(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, invitation.email, password);
      setAuthUser(credential.user);
      setRefreshKey((value) => value + 1);
    } catch {
      setValidationError('Anmeldung fehlgeschlagen. Prüfe dein Passwort und versuche es erneut.');
    } finally {
      setBusy(false);
    }
  };

  const expiresAt = invitation?.expiresAt ? new Date(invitation.expiresAt).toLocaleString('de-DE') : null;
  const isLoading = loading && Boolean(token);
  const currentValidationError = validationError ?? (!token ? 'Der Einladungslink enthält keinen Token.' : null);

  return (
    <main className="grid min-h-screen place-items-center bg-[#03050a] px-4 py-12 text-white">
      <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0b12] p-6 shadow-2xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-200">Headbang Handwerk e. V.</p>
        <h1 className="mt-3 text-3xl font-semibold">AppSchmiede-Zugang</h1>
        {isLoading ? <p className="mt-5 text-sm text-neutral-300">Einladung wird geprüft …</p> : null}
        {!isLoading && currentValidationError && !invitation ? (
          <div className="mt-5 space-y-4">
            <p className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{currentValidationError}</p>
            <Link href="/login" className="inline-flex rounded-full border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10">Zum Login</Link>
          </div>
        ) : null}
        {invitation ? (
          <>
            <p className="mt-4 text-sm leading-6 text-neutral-300">Diese Einladung ist an die folgende E-Mail-Adresse gebunden. Die Adresse kann hier nicht geändert werden.</p>
            <label className="mt-5 block text-sm text-neutral-300" htmlFor="invited-email">Eingeladene E-Mail-Adresse</label>
            <input id="invited-email" type="email" readOnly value={invitation.email} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white" />
            {expiresAt ? <p className="mt-2 text-xs text-neutral-500">Gültig bis {expiresAt}</p> : null}
            {notice ? <p className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">{notice}</p> : null}
            {currentValidationError && invitation ? <p className="mt-4 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{currentValidationError}</p> : null}
            {authUser && authUser.email?.trim().toLowerCase() !== invitation.email.trim().toLowerCase() ? (
              <button type="button" onClick={() => void signOut(auth)} className="mt-5 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10">Anderes Konto abmelden</button>
            ) : authUser ? (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-neutral-300">{busy ? 'Einladungszugang wird eingerichtet …' : 'Einladung eingelöst.'}</p>
                {!busy && validationError ? (
                  <button type="button" onClick={() => { redeeming.current = false; setRefreshKey((value) => value + 1); }} className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10">Einlösung erneut versuchen</button>
                ) : null}
              </div>
            ) : (
              <form onSubmit={existingAccount ? submitLogin : submitRegistration} className="mt-5 space-y-4">
                {!existingAccount ? (
                  <>
                    <div>
                      <label htmlFor="display-name" className="block text-sm text-neutral-300">Name</label>
                      <input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={120} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white" />
                    </div>
                    <div>
                      <label htmlFor="new-password" className="block text-sm text-neutral-300">Passwort</label>
                      <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white" />
                    </div>
                    <div>
                      <label htmlFor="confirm-password" className="block text-sm text-neutral-300">Passwort bestätigen</label>
                      <input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={6} required className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white" />
                    </div>
                  </>
                ) : (
                  <div>
                    <label htmlFor="login-password" className="block text-sm text-neutral-300">Passwort</label>
                    <input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white" />
                  </div>
                )}
                <button type="submit" disabled={busy} className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-950 hover:bg-neutral-200 disabled:opacity-50">
                  {busy ? 'Bitte warten …' : existingAccount ? 'Anmelden und Einladung einlösen' : 'Konto erstellen und E-Mail bestätigen'}
                </button>
                {existingAccount ? <button type="button" onClick={() => { setExistingAccount(false); setPassword(''); }} className="w-full text-sm text-neutral-400 hover:text-white">Zur Kontoerstellung wechseln</button> : null}
              </form>
            )}
          </>
        ) : null}
        <div className="mt-6 border-t border-white/10 pt-5 text-sm text-neutral-400">
          Bereits freigeschaltet? <Link href="/login" className="text-cyan-200 hover:underline">Zum Login</Link>
        </div>
      </section>
    </main>
  );
}
