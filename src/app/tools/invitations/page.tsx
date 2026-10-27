'use client';

import { useEffect, useState, type FormEvent } from 'react';
import useAuth from '@/hooks/useAuth';
import useUserProfile from '@/hooks/useUserProfile';
import { buildAuthHeaders } from '@/lib/client-auth';

type InvitationRow = {
  id: string;
  email: string;
  status: 'pending' | 'redeemed' | 'expired' | 'revoked';
  deliveryStatus: 'sending' | 'sent' | 'failed' | 'unknown';
  expiresAt: string | null;
  createdAt: string | null;
  sentAt: string | null;
  redeemedAt: string | null;
  createdByUid: string | null;
  createdByEmail: string | null;
};

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString('de-DE') : '–';
}

function invitationStatus(status: InvitationRow['status']): string {
  return {
    pending: 'Ausstehend',
    redeemed: 'Angenommen',
    expired: 'Abgelaufen',
    revoked: 'Widerrufen',
  }[status];
}

function deliveryStatus(status: InvitationRow['deliveryStatus']): string {
  return {
    sending: 'Wird gesendet',
    sent: 'Vom Mailserver angenommen',
    failed: 'Versand nicht bestätigt',
    unknown: 'Unbekannt',
  }[status];
}

export default function InvitationsPage() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const [email, setEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const loadInvitations = async () => {
    if (!user || !isAdmin) return;
    const response = await fetch('/api/admin/invitations', {
      headers: await buildAuthHeaders(user),
      cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error ?? 'Einladungen konnten nicht geladen werden.');
    setInvitations(data.invitations as InvitationRow[]);
  };

  useEffect(() => {
    if (!user || !isAdmin) return;
    let active = true;
    void (async () => {
      try {
        const response = await fetch('/api/admin/invitations', {
          headers: await buildAuthHeaders(user),
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? 'Einladungen konnten nicht geladen werden.');
        if (active) setInvitations(data.invitations as InvitationRow[]);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Einladungen konnten nicht geladen werden.');
      }
    })();
    return () => {
      active = false;
    };
  }, [user, isAdmin]);

  const createInvitation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: await buildAuthHeaders(user, { 'content-type': 'application/json' }),
        body: JSON.stringify({ email, personalMessage }),
      });
      const data = await response.json();
      await loadInvitations();
      if (!response.ok) throw new Error(data?.error ?? 'Einladung konnte nicht gesendet werden.');
      setMessage(`Der SMTP-Server hat die Einladung an ${data.email} angenommen. Die Zustellung im Postfach ist damit nicht bestätigt.`);
      setEmail('');
      setPersonalMessage('');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Einladung konnte nicht gesendet werden.');
    } finally {
      setBusy(false);
    }
  };

  const resendInvitation = async (invitation: InvitationRow) => {
    if (!user) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'PATCH',
        headers: await buildAuthHeaders(user, { 'content-type': 'application/json' }),
        body: JSON.stringify({ action: 'resend', invitationId: invitation.id }),
      });
      const data = await response.json();
      await loadInvitations();
      if (!response.ok) throw new Error(data?.error ?? 'Einladung konnte nicht erneut gesendet werden.');
      setMessage(`Der SMTP-Server hat die neue Einladung an ${data.email} angenommen. Die Zustellung ist damit nicht bestätigt. Der bisherige Link ist ungültig.`);
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : 'Einladung konnte nicht erneut gesendet werden.');
    } finally {
      setBusy(false);
    }
  };

  const revokeInvitation = async (invitationId: string) => {
    if (!user || !window.confirm('Diese noch nicht eingelöste Einladung widerrufen?')) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'PATCH',
        headers: await buildAuthHeaders(user, { 'content-type': 'application/json' }),
        body: JSON.stringify({ action: 'revoke', invitationId }),
      });
      const data = await response.json();
      await loadInvitations();
      if (!response.ok) throw new Error(data?.error ?? 'Einladung konnte nicht widerrufen werden.');
      setMessage('Einladung widerrufen. Der Link kann nicht mehr verwendet werden.');
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'Einladung konnte nicht widerrufen werden.');
    } finally {
      setBusy(false);
    }
  };

  if (loading || (user && profileLoading)) return <main className="min-h-screen bg-neutral-950 p-8 text-neutral-300">Zugang wird geprüft …</main>;
  if (!isAdmin) return <main className="min-h-screen bg-neutral-950 p-8 text-neutral-100">Administratorzugriff erforderlich.</main>;

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">Administration</p>
          <h1 className="mt-2 text-3xl font-semibold">Einladungen verwalten</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-400">Einladungen gelten sieben Tage, sind an eine E-Mail-Adresse gebunden und können nur einmal eingelöst werden. Ein erneuter Versand ersetzt den bisherigen Link.</p>
        </header>

        <section className="border-y border-white/10 py-6">
          <h2 className="text-lg font-semibold">Neue Einladung</h2>
          <form onSubmit={createInvitation} className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto] md:items-end">
            <div className="min-w-0">
              <label htmlFor="invite-email" className="block text-sm text-neutral-300">E-Mail-Adresse</label>
              <input id="invite-email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white" />
            </div>
            <div className="min-w-0">
              <label htmlFor="invite-message" className="block text-sm text-neutral-300">Persönliche Nachricht (optional)</label>
              <input id="invite-message" maxLength={500} value={personalMessage} onChange={(event) => setPersonalMessage(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white" />
            </div>
            <button type="submit" disabled={busy} className="rounded-lg bg-amber-200 px-5 py-3 text-sm font-bold text-neutral-950 hover:bg-amber-100 disabled:opacity-50">{busy ? 'Wird gesendet …' : 'Einladung senden'}</button>
          </form>
          {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
          {error ? <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </section>

        <section>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Einladungsübersicht</h2>
            <button type="button" disabled={busy} onClick={() => void loadInvitations().catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Laden fehlgeschlagen.'))} className="rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-50">Aktualisieren</button>
          </div>
          <div className="mt-4 overflow-x-auto border-y border-white/10">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-3 py-3 font-medium">E-Mail-Adresse</th>
                  <th className="px-3 py-3 font-medium">Erstellt</th>
                  <th className="px-3 py-3 font-medium">Ablauf</th>
                  <th className="px-3 py-3 font-medium">Einladungsstatus</th>
                  <th className="px-3 py-3 font-medium">E-Mail-Versand</th>
                  <th className="px-3 py-3 font-medium">Eingeladen von</th>
                  <th className="px-3 py-3 font-medium"><span className="sr-only">Aktionen</span></th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => (
                  <tr key={invitation.id} className="border-t border-white/5 align-top">
                    <td className="px-3 py-3">{invitation.email}</td>
                    <td className="px-3 py-3 text-neutral-400">{formatDate(invitation.createdAt)}</td>
                    <td className="px-3 py-3 text-neutral-400">{formatDate(invitation.expiresAt)}</td>
                    <td className="px-3 py-3">{invitationStatus(invitation.status)}{invitation.redeemedAt ? <span className="mt-1 block text-xs text-neutral-500">{formatDate(invitation.redeemedAt)}</span> : null}</td>
                    <td className="px-3 py-3">{deliveryStatus(invitation.deliveryStatus)}{invitation.sentAt ? <span className="mt-1 block text-xs text-neutral-500">{formatDate(invitation.sentAt)}</span> : null}</td>
                    <td className="px-3 py-3 text-neutral-400">{invitation.createdByEmail ?? invitation.createdByUid ?? '–'}</td>
                    <td className="px-3 py-3 text-right">
                      {invitation.status === 'pending' || invitation.status === 'expired' ? (
                        <div className="flex justify-end gap-3 whitespace-nowrap">
                          <button type="button" disabled={busy} onClick={() => void resendInvitation(invitation)} className="text-cyan-200 hover:text-cyan-100 disabled:opacity-50">Erneut senden</button>
                          {invitation.status === 'pending' ? <button type="button" disabled={busy} onClick={() => void revokeInvitation(invitation.id)} className="text-rose-300 hover:text-rose-200 disabled:opacity-50">Widerrufen</button> : null}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {invitations.length === 0 ? <tr><td colSpan={7} className="px-3 py-8 text-center text-neutral-500">Noch keine Einladungen.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
