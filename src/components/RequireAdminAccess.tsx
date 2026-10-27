import type { ReactNode } from 'react';
import { requireServerAdminAccess } from '@/lib/server-auth';

export default async function RequireAdminAccess({ children }: { children: ReactNode }) {
  await requireServerAdminAccess();
  return children;
}
