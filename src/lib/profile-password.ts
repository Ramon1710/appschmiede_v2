import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  validatePassword,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

class PasswordChangeError extends Error {}

export function supportsPasswordChange(user: User): boolean {
  return user.providerData.some((provider) => provider.providerId === 'password');
}

export function profileAuthErrorMessage(error: unknown): string {
  if (error instanceof PasswordChangeError) return error.message;
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Das aktuelle Passwort ist nicht korrekt.';
    case 'auth/too-many-requests':
      return 'Zu viele Versuche. Bitte warte etwas und versuche es erneut.';
    case 'auth/network-request-failed':
      return 'Keine Verbindung zu Firebase. Bitte prüfe deine Internetverbindung.';
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return 'Das neue Passwort erfüllt die Firebase-Passwortrichtlinie nicht.';
    case 'auth/requires-recent-login':
    case 'auth/user-token-expired':
    case 'auth/invalid-user-token':
      return 'Bitte melde dich erneut an und wiederhole die Aktion.';
    case 'auth/user-disabled':
      return 'Dieses Konto ist deaktiviert. Bitte wende dich an die Administration.';
    default:
      return 'Die Aktion konnte nicht abgeschlossen werden. Bitte versuche es erneut.';
  }
}

export async function reauthenticateProfileUser(user: User, currentPassword: string): Promise<void> {
  if (!supportsPasswordChange(user) || !user.email) {
    throw new PasswordChangeError('Bitte bestätige deine Anmeldung erneut über deinen Anmeldeanbieter.');
  }
  if (!currentPassword) throw new PasswordChangeError('Bitte gib dein aktuelles Passwort ein.');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
}

export async function changeProfilePassword(
  user: User,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> {
  if (!supportsPasswordChange(user) || !user.email) {
    throw new PasswordChangeError('Ändere dein Passwort bitte direkt bei deinem Anmeldeanbieter.');
  }
  if (!newPassword) throw new PasswordChangeError('Bitte gib ein neues Passwort ein.');
  if (newPassword !== confirmPassword) {
    throw new PasswordChangeError('Die neuen Passwörter stimmen nicht überein.');
  }

  const validation = await validatePassword(auth, newPassword);
  if (!validation.isValid) {
    const requirements: string[] = [];
    const options = validation.passwordPolicy.customStrengthOptions;
    if (validation.meetsMinPasswordLength === false) requirements.push(`mindestens ${options.minPasswordLength} Zeichen`);
    if (validation.meetsMaxPasswordLength === false) requirements.push(`höchstens ${options.maxPasswordLength} Zeichen`);
    if (validation.containsLowercaseLetter === false) requirements.push('einen Kleinbuchstaben');
    if (validation.containsUppercaseLetter === false) requirements.push('einen Großbuchstaben');
    if (validation.containsNumericCharacter === false) requirements.push('eine Zahl');
    if (validation.containsNonAlphanumericCharacter === false) requirements.push('ein Sonderzeichen');
    throw new PasswordChangeError(
      requirements.length
        ? `Das neue Passwort benötigt: ${requirements.join(', ')}.`
        : 'Das neue Passwort erfüllt die Firebase-Passwortrichtlinie nicht.'
    );
  }

  await reauthenticateProfileUser(user, currentPassword);
  await updatePassword(user, newPassword);
}
