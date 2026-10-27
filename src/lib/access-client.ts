'use client';

import type { User } from 'firebase/auth';
import { buildAuthHeaders } from '@/lib/client-auth';

export async function assertAuthorizedAction(user: User | null): Promise<void> {
  const response = await fetch('/api/access/status', {
    headers: await buildAuthHeaders(user),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Ein freigeschalteter AppSchmiede-Zugang ist erforderlich.');
  }
}