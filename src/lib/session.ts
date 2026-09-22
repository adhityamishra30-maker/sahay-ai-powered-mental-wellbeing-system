import type { AstroCookies } from 'astro';
import { deleteSession, findSession, insertSession, type SessionRecord } from './db';
import { IS_PRODUCTION, jsonResponse, randomToken, readEnv, sha256 } from './security';

const COOKIE_NAME = 'sahay_session';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

export type AccountType = 'counsellor' | 'authority' | 'registered_victim';
export const STAFF_ACCOUNT_TYPES: AccountType[] = ['counsellor', 'authority'];

/** Secure cookies need HTTPS. Set COOKIE_SECURE=false only for a plain-HTTP private network. */
function useSecureCookie(): boolean {
  return IS_PRODUCTION && readEnv('COOKIE_SECURE') !== 'false';
}

export function createSession(cookies: AstroCookies, session: Omit<SessionRecord, 'expiresAt'>): void {
  const previousToken = cookies.get(COOKIE_NAME)?.value;
  if (previousToken) deleteSession(sha256(previousToken));

  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  insertSession(sha256(token), { ...session, expiresAt });
  cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: useSecureCookie(),
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  });
}

export function getSession(cookies: AstroCookies): SessionRecord | undefined {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token) return undefined;
  return findSession(sha256(token));
}

export function destroySession(cookies: AstroCookies): void {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (token) deleteSession(sha256(token));
  cookies.delete(COOKIE_NAME, { path: '/' });
}

/**
 * Returns the session when its account type is allowed, otherwise a 401/403
 * response the route should return as-is.
 */
export function requireSession(
  cookies: AstroCookies,
  allowed: AccountType[]
): { session: SessionRecord; response?: undefined } | { session?: undefined; response: Response } {
  const session = getSession(cookies);
  if (!session) {
    return { response: jsonResponse({ error: 'Sign in required.' }, 401) };
  }
  if (!allowed.includes(session.accountType as AccountType)) {
    return { response: jsonResponse({ error: 'You do not have access to this resource.' }, 403) };
  }
  return { session };
}
