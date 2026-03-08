'use client';

import type { User } from 'firebase/auth';

export async function buildAuthHeaders(user: User | null, headers: HeadersInit = {}): Promise<HeadersInit> {
  if (!user) {
    throw new Error('Bitte melde dich an, um diese Aktion auszuführen.');
  }

  const token = await user.getIdToken();
  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}