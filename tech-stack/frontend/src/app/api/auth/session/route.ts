/**
 * POST   /api/auth/session   → log in, set the refresh cookie on THIS origin
 * DELETE /api/auth/session   → log out, clear it
 *
 * ── Why this route exists ──────────────────────────────────────────────────
 * The browser can call the backend's /auth/login directly, and the direct path
 * works fine when the API is same-site. It stops working when the API is on a
 * different site (api.example.com vs app.example.com): the refresh cookie
 * becomes third-party, and Safari's ITP plus Chrome's third-party cookie
 * phase-out will drop it. Routing login through our own origin makes the
 * refresh cookie FIRST-party, which is the whole point of the hop.
 *
 * The access token is deliberately NOT stored in a cookie. It goes back in the
 * JSON body and lives in memory (see `lib/auth/token-store.ts`).
 *
 * Toggle in `lib/auth/auth-context.tsx` which path you use — direct or via here.
 */
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { backendFetch } from "@/app/api/_lib/backend";
import { badRequest, fail, noContent, ok } from "@/app/api/_lib/api-response";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { getServerEnv, isProduction } from "@/lib/config/env";
import { loginSchema } from "@/features/auth/schemas";
import { logger } from "@/lib/logger";
import type { ApiEnvelope } from "@/types/api";
import type { AuthSession } from "@/types/models";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Validate on the server too — never trust that the client form ran.
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(
      "Invalid credentials payload",
      z.flattenError(parsed.error),
    );
  }

  let upstream: Response;
  try {
    upstream = await backendFetch(ENDPOINTS.auth.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
  } catch (error) {
    logger.error("Login proxy could not reach the backend", error);
    return fail(502, "UPSTREAM_UNAVAILABLE", "The API is unreachable.");
  }

  const body = (await upstream.json().catch(() => null)) as
    | ApiEnvelope<AuthSession>
    | { error: { code: string; message: string } }
    | null;

  if (!upstream.ok || !body || !("data" in body)) {
    const error =
      body && "error" in body
        ? body.error
        : { code: "UNAUTHORIZED", message: "Invalid email or password." };
    return fail(upstream.status || 401, error.code, error.message);
  }

  const session = body.data;

  // Re-issue the refresh token as a first-party cookie on this origin.
  const refreshToken = extractRefreshToken(upstream);
  if (refreshToken) {
    const cookieStore = await cookies();
    cookieStore.set(getServerEnv().SESSION_COOKIE_NAME, refreshToken, {
      httpOnly: true, // unreadable from JavaScript — the point of the exercise
      secure: isProduction,
      sameSite: "lax", // survives top-level navigation back into the app
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  // Access token travels in the body → memory. Never into a cookie.
  return ok({
    accessToken: session.accessToken,
    expiresIn: session.expiresIn,
    user: session.user,
  });
}

export async function DELETE() {
  const cookieStore = await cookies();
  const cookieName = getServerEnv().SESSION_COOKIE_NAME;

  try {
    await backendFetch(ENDPOINTS.auth.logout, {
      method: "POST",
      cookie: cookieStore.toString(),
    });
  } catch (error) {
    // Best effort: even if revocation fails, clear the cookie locally.
    logger.warn("Logout revoke failed upstream", { error: String(error) });
  }

  cookieStore.delete(cookieName);
  return noContent();
}

/** Pull the refresh token out of the upstream `Set-Cookie` header. */
function extractRefreshToken(response: Response): string | null {
  const name = getServerEnv().SESSION_COOKIE_NAME;
  // getSetCookie() returns every Set-Cookie header, unlike get().
  const cookieHeaders = response.headers.getSetCookie?.() ?? [];

  for (const header of cookieHeaders) {
    const [pair] = header.split(";");
    const separator = pair.indexOf("=");
    if (separator === -1) continue;
    if (pair.slice(0, separator).trim() === name) {
      return pair.slice(separator + 1).trim();
    }
  }
  return null;
}
