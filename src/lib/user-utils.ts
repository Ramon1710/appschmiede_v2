import type { AppUserRole } from '@/types/user';

export const isAdminRole = (role?: AppUserRole | null) => role === 'admin';

export const canManageMainTemplates = (role?: AppUserRole | null) => isAdminRole(role);
