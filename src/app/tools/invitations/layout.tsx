import RequireAdminAccess from '@/components/RequireAdminAccess';

export default function InvitationsLayout({ children }: { children: React.ReactNode }) {
  return <RequireAdminAccess>{children}</RequireAdminAccess>;
}
