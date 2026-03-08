export const PRIVACY_CONSENT_VERSION = '2026-03-08';
export const PRIVACY_CONSENT_STORAGE_KEY = 'appschmiede_privacy_consent';
export const PRIVACY_CONSENT_COOKIE = 'appschmiede_privacy_consent';
export const PRIVACY_SETTINGS_EVENT = 'appschmiede:open-privacy-settings';
export const PRIVACY_CONSENT_CHANGED_EVENT = 'appschmiede:privacy-consent-changed';

export type PrivacyConsent = {
  essential: true;
  analytics: boolean;
  version: string;
  updatedAt: string;
};

function isPrivacyConsent(value: unknown): value is PrivacyConsent {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<PrivacyConsent>;
  return (
    candidate.essential === true &&
    typeof candidate.analytics === 'boolean' &&
    typeof candidate.version === 'string' &&
    typeof candidate.updatedAt === 'string'
  );
}

export function buildPrivacyConsent(analytics: boolean): PrivacyConsent {
  return {
    essential: true,
    analytics,
    version: PRIVACY_CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };
}

export function readPrivacyConsent(): PrivacyConsent | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isPrivacyConsent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writePrivacyConsent(consent: PrivacyConsent) {
  if (typeof window === 'undefined') {
    return;
  }

  const serialized = JSON.stringify(consent);
  window.localStorage.setItem(PRIVACY_CONSENT_STORAGE_KEY, serialized);
  document.cookie = `${PRIVACY_CONSENT_COOKIE}=${encodeURIComponent(serialized)}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax`;
}

export function openPrivacySettings() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(PRIVACY_SETTINGS_EVENT));
}

export function dispatchPrivacyConsentChanged(consent: PrivacyConsent) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(PRIVACY_CONSENT_CHANGED_EVENT, { detail: consent }));
}