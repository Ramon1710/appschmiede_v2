'use client';

import { useState, FormEvent } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pw);
      await updateProfile(cred.user, { displayName: name || null });
      await setDoc(doc(db,'users',cred.user.uid),{
        email,
        displayName: name || null,
        role: 'user',
        createdAt: serverTimestamp(),
      }, { merge: true });
      router.replace('/dashboard');
    } catch (err:any) {
      setError(err.message ?? 'Registrierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Registrieren</h2>
        <form onSubmit={handleRegister} className="row">
          <input className="input" placeholder="Name (optional)" value={name} onChange={e=>setName(e.target.value)} />
          <input className="input" type="email" placeholder="E-Mail" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Passwort" value={pw} onChange={e=>setPw(e.target.value)} required />
          {error && <div className="badge" style={{ background:'#20141a', borderColor:'#46232f', color:'#ffb3b3' }}>{error}</div>}
          <button className="btn" disabled={loading}>{loading ? '…' : 'Konto erstellen'}</button>
        </form>
        <div style={{ marginTop: 14, color: 'var(--muted)' }}>
          Bereits ein Konto? <Link href="/login">Anmelden</Link>
        </div>
      </div>
    </div>
  );
}
