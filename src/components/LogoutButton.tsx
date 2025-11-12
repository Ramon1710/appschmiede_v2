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
      // optional: show error
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={onLogout} disabled={busy} className="px-3 py-1 rounded bg-neutral-800 text-white">
      {busy ? 'Abmelden…' : 'Logout'}
    </button>
  );
}