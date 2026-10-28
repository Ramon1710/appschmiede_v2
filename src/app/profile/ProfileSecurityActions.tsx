'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { signOut, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { buildAuthHeaders } from '@/lib/client-auth';
import {
  changeProfilePassword,
  profileAuthErrorMessage,
  reauthenticateProfileUser,
  supportsPasswordChange,
} from '@/lib/profile-password';

type Props = { user: User; disabled: boolean };
type DialogMode = 'password' | 'delete' | null;

export default function ProfileSecurityActions({ user, disabled }: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const actionInFlight = useRef(false);
  const [mode, setMode] = useState<DialogMode>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const canChangePassword = supportsPasswordChange(user);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (mode && dialog && !dialog.open) dialog.showModal();
  }, [mode]);

  const closeDialog = () => {
    dialogRef.current?.close();
    setMode(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const openDialog = (next: DialogMode) => {
    setNotice(null);
    setMode(next);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      if (mode === 'password') {
        await changeProfilePassword(user, currentPassword, newPassword, confirmPassword);
        closeDialog();
        try {
          await user.getIdToken(true);
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: await buildAuthHeaders(user),
            cache: 'no-store',
          });
          if (!response.ok) throw new Error('Session refresh failed');
          setNotice('Dein Passwort wurde erfolgreich geändert.');
        } catch {
          setNotice('Dein Passwort wurde geändert. Bitte melde dich mit dem neuen Passwort erneut an, um deine Sitzung zu erneuern.');
        }
      } else if (mode === 'delete') {
        if (canChangePassword) await reauthenticateProfileUser(user, currentPassword);
        await user.getIdToken(true);
        const response = await fetch('/api/account', {
          method: 'DELETE',
          headers: await buildAuthHeaders(user, { 'content-type': 'application/json' }),
          body: JSON.stringify({ confirmed: true }),
          cache: 'no-store',
        });
        const result: { accountDeleted?: boolean; error?: string } = await response.json();
        if (result.accountDeleted === true) {
          if (!response.ok) window.alert(result.error ?? 'Konto gelöscht, aber die Profilbereinigung ist fehlgeschlagen. Bitte kontaktiere die Administration.');
          try {
            await signOut(auth);
          } catch {
            window.alert('Dein Konto wurde gelöscht, aber die lokale Abmeldung ist fehlgeschlagen. Bitte schließe die App und lösche die Website-Daten in deinem Browser.');
          }
          router.replace('/');
        } else {
          setError(result.error ?? 'Dein Konto konnte nicht gelöscht werden.');
        }
      }
    } catch (cause) {
      setError(profileAuthErrorMessage(cause));
    } finally {
      actionInFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 pb-2">
      {notice && <p role="status" className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">{notice}</p>}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => openDialog('password')}
          disabled={disabled || busy}
          className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-neutral-100 transition hover:bg-white/10 disabled:opacity-50"
        >
          Passwort ändern
        </button>
        <button
          type="button"
          onClick={() => openDialog('delete')}
          disabled={disabled || busy}
          className="rounded-lg px-3 py-2 text-sm text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50"
        >
          Account löschen
        </button>
      </div>

      {mode && (
        <dialog
          ref={dialogRef}
          aria-labelledby="profile-security-title"
          aria-describedby="profile-security-description"
          className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-neutral-950 p-6 text-neutral-100 shadow-2xl backdrop:bg-black/70"
          onCancel={(event) => {
            event.preventDefault();
            if (!busy) closeDialog();
          }}
        >
          <h2 id="profile-security-title" className="text-2xl font-semibold">
            {mode === 'password' ? 'Passwort ändern' : 'Account wirklich löschen?'}
          </h2>
          <p id="profile-security-description" className="mt-3 text-sm leading-6 text-neutral-300">
            {mode === 'delete'
              ? 'Dein Konto und dein persönliches Profil werden dauerhaft gelöscht. Dieser Schritt kann nicht rückgängig gemacht werden. Projekte werden nicht automatisch gelöscht.'
              : canChangePassword
                ? 'Bestätige dein aktuelles Passwort und wähle ein neues Passwort gemäß der Firebase-Passwortrichtlinie.'
                : 'Du meldest dich über einen anderen Anbieter an. Ändere dein Passwort direkt in dessen Kontoeinstellungen. Für eine passwortlose Anmeldung gibt es hier kein Passwort zu ändern.'}
          </p>
          {mode === 'delete' && !canChangePassword && (
            <p className="mt-3 text-sm text-amber-200">Für die Löschung muss deine Anmeldung höchstens fünf Minuten zurückliegen. Melde dich gegebenenfalls über deinen Anbieter ab und wieder an.</p>
          )}
          <form onSubmit={submit} className="mt-5 space-y-4">
            {canChangePassword && (
              <label className="block text-sm text-neutral-300">
                Aktuelles Passwort
                <input
                  type="password"
                  name="current-password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  disabled={busy}
                  required
                  className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 focus:border-cyan-400 focus:outline-none"
                />
              </label>
            )}
            {mode === 'password' && canChangePassword && (
              <>
                <label className="block text-sm text-neutral-300">
                  Neues Passwort
                  <input
                    type="password"
                    name="new-password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    disabled={busy}
                    required
                    className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 focus:border-cyan-400 focus:outline-none"
                  />
                </label>
                <label className="block text-sm text-neutral-300">
                  Neues Passwort wiederholen
                  <input
                    type="password"
                    name="confirm-password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={busy}
                    required
                    className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 focus:border-cyan-400 focus:outline-none"
                  />
                </label>
              </>
            )}
            {error && <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button type="button" onClick={closeDialog} disabled={busy} className="rounded-lg border border-white/20 px-4 py-2 text-sm transition hover:bg-white/10 disabled:opacity-50">
                {mode === 'password' && !canChangePassword ? 'Schließen' : 'Abbrechen'}
              </button>
              {(mode === 'delete' || canChangePassword) && (
                <button
                  type="submit"
                  disabled={busy || disabled}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${mode === 'delete' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90'}`}
                >
                  {busy ? 'Bitte warten…' : mode === 'delete' ? 'Account endgültig löschen' : 'Passwort speichern'}
                </button>
              )}
            </div>
          </form>
        </dialog>
      )}
    </div>
  );
}
