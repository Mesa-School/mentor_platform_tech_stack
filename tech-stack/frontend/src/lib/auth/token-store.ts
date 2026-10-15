/**
 * Access-token store — module-scoped memory, deliberately NOT localStorage.
 *
 * Why: an access token in localStorage is readable by any XSS payload and survives
 * the tab. In memory it dies with the page, and the session is restored on reload
 * via the httpOnly refresh cookie (which JS can never read). That cookie is set and
 * cleared by the backend; the frontend only ever holds the short-lived access token.
 *
 * This module is import-safe on the server (each request gets a fresh module scope
 * in the Next server runtime), but server-side code should not rely on it —
 * Server Components read the session from cookies instead.
 */

let accessToken: string | null = null;
let expiresAt: number | null = null;

type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null, expiresIn?: number): void {
  accessToken = token;
  expiresAt =
    token && expiresIn ? Date.now() + expiresIn * 1000 : token ? null : null;
  listeners.forEach((listener) => listener(token));
}

export function clearAuth(): void {
  setAccessToken(null);
}

/** True when we hold a token that has not passed its known expiry. */
export function hasValidAccessToken(): boolean {
  if (!accessToken) return false;
  if (expiresAt === null) return true;
  return Date.now() < expiresAt;
}

/** Milliseconds until expiry, minus a safety skew — for scheduling silent refresh. */
export function millisUntilExpiry(skewMs = 30_000): number | null {
  if (expiresAt === null) return null;
  return Math.max(0, expiresAt - Date.now() - skewMs);
}

/** Subscribe to token changes (e.g. to reset the query cache on logout). */
export function onTokenChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
