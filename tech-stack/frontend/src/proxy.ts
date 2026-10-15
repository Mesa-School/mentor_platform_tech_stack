/**
 * Next.js 16 renamed `middleware.ts` → `proxy.ts` (named export `proxy`,
 * Node runtime; edge is unsupported, and the config flags dropped their
 * `middleware` prefix). Verified against node_modules/next/dist/docs.
 *
 * ── Currently OFF ─────────────────────────────────────────────────────────
 * `NEXT_PUBLIC_AUTH_ENABLED` defaults to `false`, so every request passes
 * through untouched and all routes are publicly reachable — which is what you
 * want while there is no backend issuing sessions. Set it to `true` and the
 * gate below starts enforcing, together with `<AuthGate>`. No code changes.
 *
 * ── What it does when ON ──────────────────────────────────────────────────
 * ⚠️ An OPTIMISTIC gate, not a security boundary.
 *
 * It cannot see the access token — that lives in browser memory. All it can
 * check is whether the httpOnly refresh cookie is *present*. That's enough to
 * skip the flash of a protected page for a logged-out visitor, and cheap enough
 * to run on every navigation. A forged empty cookie gets someone as far as an
 * empty dashboard shell, at which point the API rejects every request and
 * `<AuthGate />` bounces them to login.
 *
 * Real authorization is the backend's RBAC. Always.
 */
import { NextResponse, type NextRequest } from "next/server";

import { PUBLIC_ROUTES, REDIRECT_PARAM, ROUTES } from "@/lib/constants";

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "refresh_token";
const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";

export function proxy(request: NextRequest) {
  if (!AUTH_ENABLED) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isAuthRoute = pathname === ROUTES.login;

  // Signed in, but sitting on the login page → send them into the workspace.
  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL(ROUTES.adminDashboard, request.url));
  }

  // Signed out on a protected route → login, remembering where they wanted to go.
  if (!hasSession && !isPublic) {
    const loginUrl = new URL(ROUTES.login, request.url);
    loginUrl.searchParams.set(REDIRECT_PARAM, pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Skip Next internals, our own Route Handlers, and anything with a file
   * extension. Without this the gate would redirect CSS and JS requests too.
   */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
