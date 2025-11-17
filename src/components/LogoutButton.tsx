'use client';

import React, { useState } from 'react';
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';

type LogoutButtonProps = {
  className?: string;
};

export default function LogoutButton({ className }: LogoutButtonProps) {
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
    <button
      onClick={onLogout}
      disabled={busy}
      className={`w-full rounded bg-neutral-800 px-3 py-1 text-white transition hover:bg-neutral-700 disabled:opacity-60 ${className ?? ''}`.trim()}
    >
      {busy ? 'Abmelden…' : 'Logout'}
    </button>
  );
}