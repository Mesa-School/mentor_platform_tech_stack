/**
 * ANY /api/proxy/<anything>  →  <backend>/<anything>
 *
 * A transparent same-origin passthrough to the backend.
 *
 * ── When to use it ────────────────────────────────────────────────────────
 *  ✅ The API is on a different site and you need first-party cookies.
 *  ✅ The API is inside a private network the browser cannot reach.
 *  ✅ You must attach a server-only secret (a partner API key) to the request.
 *  ✅ You need one origin for CSP / CORS reasons.
 *
 * ── When NOT to use it ────────────────────────────────────────────────────
 *  ❌ "It felt tidier." Every proxied request pays an extra network hop and
 *     gives you a second place for bugs. The default path is the browser
 *     calling `NEXT_PUBLIC_API_BASE_URL` directly via `lib/api/client.ts`.
 *
 * To route the whole app through it, point NEXT_PUBLIC_API_BASE_URL at
 * `/api/proxy` — the client's paths (`/users`, `/auth/me`) then resolve here
 * unchanged, because the envelope and status codes pass straight through.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { backendFetch, passthroughHeaders } from "@/app/api/_lib/backend";
import { fail } from "@/app/api/_lib/api-response";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** Request headers that must not be forwarded upstream. */
const STRIPPED_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "accept-encoding",
  "x-forwarded-host",
]);

async function handler(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const target = `/${path.join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIPPED_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  // Add a server-only credential here if the upstream needs one, e.g.:
  // headers.set('X-Internal-Key', getServerEnv().INTERNAL_API_KEY)

  const hasBody = !["GET", "HEAD"].includes(request.method);

  try {
    const upstream = await backendFetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: passthroughHeaders(upstream),
    });
  } catch (error) {
    logger.error("Proxy request failed", error, { target });
    return fail(502, "UPSTREAM_UNAVAILABLE", "The API is unreachable.");
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
