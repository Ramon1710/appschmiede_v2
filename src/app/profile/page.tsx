'use client';

import { FormEvent, useEffect, useState } from 'react';
import Header from '@/components/Header';
import useAuth from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

interface UserProfileDoc {
  displayName?: string | null;
  company?: string | null;
  phone?: string | null;
  updatedAt?: ReturnType<typeof serverTimestamp>;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? '');
    const loadProfile = async () => {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as UserProfileDoc;
        setCompany(data.company ?? '');
        setPhone(data.phone ?? '');
        if (!user.displayName && data.displayName) {
          setDisplayName(data.displayName);
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
      if (user.displayName !== displayName) {
        await updateProfile(user, { displayName: displayName || undefined });
      }
      const ref = doc(db, 'users', user.uid);
        await setDoc(ref, {
        displayName: displayName || null,
        company: company || null,
        phone: phone || null,
        updatedAt: serverTimestamp(),
        }, { merge: true });
      setStatus('Änderungen gespeichert.');
    } catch (error) {
      console.error('Profil konnte nicht aktualisiert werden', error);
      setStatus('Fehler beim Speichern. Bitte später erneut versuchen.');
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
