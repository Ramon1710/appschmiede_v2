import type { ReactNode } from 'react';
import { requireServerAccess } from '@/lib/server-auth';

export default async function RequireAppAccess({ children }: { children: ReactNode }) {
  await requireServerAccess();
  return children;
}
