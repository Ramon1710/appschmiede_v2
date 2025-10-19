'use client';

import { useState, FormEvent } from 'react';
import { auth, db, googleProvider } from '@/lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get('next') || '/dashboard';

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pw);
      router.replace(redirectTo);
    } catch (err:any) {
      setError(err.message ?? 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = async () => {
    setError(null); setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await setDoc(doc(db,'users',res.user.uid),{
        email: res.user.email ?? null,
        displayName: res.user.displayName ?? null,
        role: 'user',
        createdAt: serverTimestamp(),
      }, { merge: true });
      router.replace('/dashboard');
    } catch (err:any) {
      setError(err.message ?? 'Google Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Anmelden</h2>
        <form onSubmit={handleLogin} className="row">
          <input className="input" type="email" placeholder="E-Mail" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Passwort" value={pw} onChange={e=>setPw(e.target.value)} required />
          {error && <div className="badge" style={{ background:'#20141a', borderColor:'#46232f', color:'#ffb3b3' }}>{error}</div>}
          <button className="btn" disabled={loading}>{loading ? '…' : 'Login'}</button>
        </form>
        <div className="hr" />
        <button className="btn ghost" onClick={loginGoogle}>Mit Google anmelden</button>
        <div style={{ marginTop: 14, color: 'var(--muted)' }}>
          Kein Konto? <Link href="/register">Registrieren</Link> · <Link href="/reset">Passwort vergessen</Link>
        </div>
      </div>
    </div>
  );
}
