"use client";

/**
 * Client-side session gate for the `(app)` route group.
 *
 * ── Currently OFF ─────────────────────────────────────────────────────────
 * `NEXT_PUBLIC_AUTH_ENABLED` defaults to `false`, so this renders children
 * straight through and every route stays publicly reachable. That's what you
 * want while there is no backend to authenticate against. Flip the env var to
 * `true` and both this and `proxy.ts` start enforcing — no code changes.
 *
 * ── When ON ───────────────────────────────────────────────────────────────
 * `proxy.ts` already redirects anyone without a refresh cookie — that runs
 * before render and prevents the flash of a protected page. This is the second
 * layer: it waits for the silent refresh to settle, and if there is genuinely
 * no session it bounces to login carrying `?next=` so the user lands where they
 * intended.
 *
 * Neither layer is a security boundary. The API rejects unauthorized requests.
 */
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { LoadingState } from "@/components/shared/state-views";
import { useAuth } from "@/hooks/use-auth";
import { env } from "@/lib/config/env";
import { REDIRECT_PARAM, ROUTES } from "@/lib/constants";

export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!env.NEXT_PUBLIC_AUTH_ENABLED) return;
    if (isLoading || isAuthenticated) return;
    const next = encodeURIComponent(pathname);
    router.replace(`${ROUTES.login}?${REDIRECT_PARAM}=${next}`);
  }, [isAuthenticated, isLoading, pathname, router]);

  if (!env.NEXT_PUBLIC_AUTH_ENABLED) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="grid min-h-svh place-items-center">
        <LoadingState label="Restoring your session…" />
      </div>
    );
  }

  // Redirect is in flight — render nothing rather than a half-empty dashboard.
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
