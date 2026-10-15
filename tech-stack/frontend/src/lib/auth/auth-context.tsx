"use client";

/**
 * Session state for the whole client tree.
 *
 * Lifecycle:
 *  - On mount, attempt a silent refresh. If the httpOnly refresh cookie is still
 *    valid the backend hands back a new access token and we restore the session
 *    without a login round-trip. This is why a hard refresh keeps you signed in
 *    even though the access token only ever lived in memory.
 *  - `login` stores the access token in memory and the user in state; the backend
 *    sets the refresh cookie in the same response.
 *  - `logout` tells the backend to revoke the refresh token, clears memory, and
 *    wipes the query cache so the next user never sees the previous one's data.
 *
 * Consume via `useAuth()` from `@/hooks/use-auth` — not by importing this context.
 */
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { api, refreshAccessToken } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/http-error";
import { clearAuth, setAccessToken } from "@/lib/auth/token-store";
import { PREVIEW_USER } from "@/lib/auth/preview-user";
import { env } from "@/lib/config/env";
import type { AuthSession, CurrentUser } from "@/types/models";

export interface AuthContextValue {
  user: CurrentUser | null;
  /** True until the initial silent-refresh attempt settles. Gate redirects on this. */
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: { email: string; password: string }) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  /** Re-read `/auth/me`, e.g. after the user edits their own profile. */
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // With the gate off, start signed in as the preview user so every screen is
  // browsable before a backend exists — and skip the restore entirely.
  const [user, setUser] = useState<CurrentUser | null>(
    env.NEXT_PUBLIC_AUTH_ENABLED ? null : PREVIEW_USER,
  );
  const [isLoading, setIsLoading] = useState(env.NEXT_PUBLIC_AUTH_ENABLED);

  // Restore the session once, on mount.
  useEffect(() => {
    if (!env.NEXT_PUBLIC_AUTH_ENABLED) return;
    let cancelled = false;

    (async () => {
      try {
        const restored = await refreshAccessToken();
        if (!restored) return;
        const me = await api.get<CurrentUser>(ENDPOINTS.auth.me);
        if (!cancelled) setUser(me);
      } catch (error) {
        // A 401 here just means "no valid session" — not an app error.
        if (!cancelled && !(isApiError(error) && error.isUnauthorized)) {
          console.error("Failed to restore session", error);
        }
        clearAuth();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback<AuthContextValue["login"]>(
    async (input) => {
      const session = await api.post<AuthSession>(
        ENDPOINTS.auth.login,
        input,
        { skipAuth: true },
      );
      setAccessToken(session.accessToken, session.expiresIn);
      setUser(session.user);
      return session.user;
    },
    [],
  );

  const logout = useCallback<AuthContextValue["logout"]>(async () => {
    if (!env.NEXT_PUBLIC_AUTH_ENABLED) {
      setUser(null); // lets you see the signed-out UI without a backend
      queryClient.clear();
      return;
    }
    try {
      await api.post(ENDPOINTS.auth.logout);
    } catch {
      // Revoking server-side is best-effort; clearing locally must still happen.
    } finally {
      clearAuth();
      setUser(null);
      queryClient.clear(); // never leak the previous user's cached data
    }
  }, [queryClient]);

  const refreshUser = useCallback<AuthContextValue["refreshUser"]>(async () => {
    const me = await api.get<CurrentUser>(ENDPOINTS.auth.me);
    setUser(me);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
