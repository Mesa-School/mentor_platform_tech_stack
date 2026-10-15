/**
 * Every backend path in one place. Services import from here — never inline a
 * path string, so a backend route rename is a single-file change.
 *
 * Paths are relative to `NEXT_PUBLIC_API_BASE_URL` (which already includes /api/v1).
 */

export const ENDPOINTS = {
  health: "/healthz",

  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    me: "/auth/me",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },

  users: {
    root: "/users",
    detail: (id: string) => `/users/${id}`,
    status: (id: string) => `/users/${id}/status`,
  },
} as const;

/** Serialize list params to a query string, dropping empty values. `''` when none. */
export function toQueryString<T extends object>(
  params?: T | undefined,
): string {
  if (!params) return "";
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      value.forEach((entry) => search.append(key, String(entry)));
    } else {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}
