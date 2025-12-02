export const LAST_PROJECT_STORAGE_KEY = 'appschmiede:last-project';

export const getStoredProjectId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(LAST_PROJECT_STORAGE_KEY);
};

export const setStoredProjectId = (projectId: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LAST_PROJECT_STORAGE_KEY, projectId);
};

export const clearStoredProjectId = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LAST_PROJECT_STORAGE_KEY);
};
