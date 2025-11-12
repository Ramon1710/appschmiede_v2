'use client';

import React, { useState } from 'react';
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const onLogout = async () => {
    setBusy(true);
    try {
      await logout();
      router.push('/login');
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={onLogout} disabled={busy} className="btn">
      {busy ? 'Abmelden…' : 'Logout'}
    </button>
  );
}