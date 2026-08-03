import type { AuthPayload, SessionUser } from './types';

const TOKEN_KEY = 'PARABA_ACCESS_TOKEN';
const USER_KEY = 'PARABA_USER_DATA';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function saveSession(payload: AuthPayload): void {
  localStorage.setItem(TOKEN_KEY, payload.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
}

export function updateCurrentUser(user: SessionUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isProfessor(user?: SessionUser | null): boolean {
  return user?.tipo === 1 || user?.tipo === 'admin' || user?.tipo === 'professor';
}
