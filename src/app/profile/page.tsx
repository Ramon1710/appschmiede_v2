'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import useAuth from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail, updateProfile } from 'firebase/auth';

interface UserProfileDoc {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  updatedAt?: ReturnType<typeof serverTimestamp>;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');

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
      if (snap.exists()) {
        const data = snap.data() as UserProfileDoc;
        setFirstName(data.firstName ?? '');
        setLastName(data.lastName ?? '');
        setCompany(data.company ?? '');
        setPhone(data.phone ?? '');
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
      await setDoc(
        ref,
        {
          displayName: displayNameToPersist || null,
          firstName: firstName || null,
          lastName: lastName || null,
          company: company || null,
          phone: phone || null,
          email: nextEmail,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

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
    </>
  );
}
