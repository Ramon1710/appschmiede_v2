'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function ResetPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    try {
      await resetPassword(email);
      setMsg('E-Mail zum Zurücksetzen gesendet.');
    } catch (e:any) {
      setErr(e.message ?? 'Fehler beim Senden');
    }
  };

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Passwort zurücksetzen</h2>
        <form onSubmit={onSubmit} className="row">
          <input className="input" type="email" placeholder="E-Mail" value={email} onChange={e=>setEmail(e.target.value)} required />
          {msg && <div className="badge" style={{ background:'#132018', borderColor:'#1e4633', color:'#a6e9c5' }}>{msg}</div>}
          {err && <div className="badge" style={{ background:'#20141a', borderColor:'#46232f', color:'#ffb3b3' }}>{err}</div>}
          <button className="btn">Senden</button>
        </form>
        <div style={{ marginTop: 14 }}><Link href="/login">Zurück zum Login</Link></div>
      </div>
    </div>
  );
}
