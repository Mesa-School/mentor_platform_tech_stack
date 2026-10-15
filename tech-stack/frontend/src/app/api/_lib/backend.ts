/**
 * Server-side calls to the upstream backend, for use inside Route Handlers only.
 *
 * This is NOT `lib/api/client.ts`. The difference matters:
 *
 *   lib/api/client.ts   runs in the BROWSER. Holds the in-memory access token,
 *                       does silent refresh, talks to NEXT_PUBLIC_API_BASE_URL.
 *   this file           runs on the SERVER. Reads cookies from the incoming
 *                       request, may use a private internal hostname, and can
 *                       hold secrets the browser must never see.
 *
 * Route Handlers use this; Client Components use the other. Never cross them.
 */
import { env, getServerEnv } from "@/lib/config/env";

/** Internal hostname when set (private VPC), else the public API URL. */
export function backendBaseUrl(): string {
  return (
    getServerEnv().API_INTERNAL_BASE_URL ?? env.NEXT_PUBLIC_API_BASE_URL
  );
}

export interface BackendFetchOptions extends RequestInit {
  /** Forward these cookies verbatim (e.g. the httpOnly refresh cookie). */
  cookie?: string | null;
  /** Bearer token to attach, if the handler obtained one. */
  accessToken?: string | null;
  timeoutMs?: number;
}

/**
 * Fetch the backend from the server. Returns the raw `Response` so the caller
 * decides whether to parse, stream, or pass it straight through.
 */
export async function backendFetch(
  path: string,
  options: BackendFetchOptions = {},
): Promise<Response> {
  const {
    cookie,
    accessToken,
    timeoutMs = 15_000,
    headers,
    ...rest
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`${backendBaseUrl()}${path}`, {
      ...rest,
      signal: rest.signal ?? controller.signal,
      // Route Handlers must opt out of caching for anything user-specific.
      cache: rest.cache ?? "no-store",
      headers: {
        Accept: "application/json",
        ...(cookie ? { cookie } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

/** Hop-by-hop and encoding headers that must not be copied to a proxied response. */
const STRIPPED_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
]);

/** Copy an upstream response's headers, minus the ones Next must recompute. */
export function passthroughHeaders(response: Response): Headers {
  const headers = new Headers();
  response.headers.forEach((value, key) => {
    if (!STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  return headers;
}
