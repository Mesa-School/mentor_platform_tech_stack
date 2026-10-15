/**
 * The ONLY place in the app that calls `fetch` against the backend.
 *
 * Responsibilities:
 *  1. Prefix the base URL from validated env.
 *  2. Attach the in-memory JWT access token as a bearer header.
 *  3. Send credentials so the httpOnly refresh cookie rides along.
 *  4. Unwrap the `{ data, meta }` envelope so callers get the payload.
 *  5. Throw a typed `ApiError` for `{ error }` responses and network failures.
 *  6. On a 401, run a single-flight silent refresh and retry the request once.
 *
 * Components and services never call `fetch` directly. Services call `api.*`,
 * hooks call services, components call hooks.
 */
import { env } from "@/lib/config/env";
import {
  clearAuth,
  getAccessToken,
  setAccessToken,
} from "@/lib/auth/token-store";
import type { ApiEnvelope, Paginated, ResponseMeta } from "@/types/api";
import { ApiError } from "./http-error";
import { ENDPOINTS } from "./endpoints";

export interface RequestOptions extends Omit<RequestInit, "body" | "method"> {
  /** Skip the bearer header (public endpoints). */
  skipAuth?: boolean;
  /** Skip the 401 → refresh → retry dance (used by the refresh call itself). */
  skipRefresh?: boolean;
  /** Abort after N ms. Defaults to 30s. */
  timeoutMs?: number;
  /** Next.js fetch cache options — only meaningful in Server Components. */
  next?: RequestInit["next"];
}

const DEFAULT_TIMEOUT_MS = 30_000;

/* -------------------------------------------------------------------------- */
/*  Single-flight refresh                                                      */
/* -------------------------------------------------------------------------- */

/**
 * When ten queries 401 at once we must not fire ten refreshes. The in-flight
 * promise is shared; everyone awaits the same result.
 */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_BASE_URL}${ENDPOINTS.auth.refresh}`,
        {
          method: "POST",
          credentials: "include", // carries the httpOnly refresh cookie
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        clearAuth();
        return false;
      }

      const body = (await response.json()) as ApiEnvelope<{
        accessToken: string;
        expiresIn?: number;
      }>;

      setAccessToken(body.data.accessToken, body.data.expiresIn);
      return true;
    } catch {
      clearAuth();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/* -------------------------------------------------------------------------- */
/*  Core request                                                               */
/* -------------------------------------------------------------------------- */

async function request<T>(
  path: string,
  init: RequestInit & RequestOptions = {},
  allowRetry = true,
): Promise<{ data: T; meta?: ResponseMeta }> {
  const {
    skipAuth,
    skipRefresh,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers,
    signal,
    ...rest
  } = init;

  const token = skipAuth ? null : getAccessToken();
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
      ...rest,
      credentials: "include",
      signal: signal ?? timeoutController.signal,
      headers: {
        Accept: "application/json",
        ...(rest.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw new ApiError(0, "TIMEOUT", "The request timed out.", cause);
    }
    throw ApiError.network(cause);
  } finally {
    clearTimeout(timeout);
  }

  // Expired access token → refresh once, then replay the original request.
  if (response.status === 401 && allowRetry && !skipAuth && !skipRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(path, init, false);
  }

  if (!response.ok) throw await ApiError.fromResponse(response);

  if (response.status === 204) return { data: undefined as T };

  const text = await response.text();
  if (!text) return { data: undefined as T };

  const body = JSON.parse(text) as ApiEnvelope<T> | T;

  // Tolerate a bare payload from endpoints that don't use the envelope.
  if (body && typeof body === "object" && "data" in body) {
    const envelope = body as ApiEnvelope<T>;
    return { data: envelope.data, meta: envelope.meta };
  }

  return { data: body as T };
}

/* -------------------------------------------------------------------------- */
/*  Public surface                                                             */
/* -------------------------------------------------------------------------- */

export const api = {
  get: async <T>(path: string, options?: RequestOptions) =>
    (await request<T>(path, { ...options, method: "GET" })).data,

  post: async <T>(path: string, body?: unknown, options?: RequestOptions) =>
    (
      await request<T>(path, {
        ...options,
        method: "POST",
        body: serialize(body),
      })
    ).data,

  put: async <T>(path: string, body?: unknown, options?: RequestOptions) =>
    (
      await request<T>(path, { ...options, method: "PUT", body: serialize(body) })
    ).data,

  patch: async <T>(path: string, body?: unknown, options?: RequestOptions) =>
    (
      await request<T>(path, {
        ...options,
        method: "PATCH",
        body: serialize(body),
      })
    ).data,

  delete: async <T = void>(path: string, options?: RequestOptions) =>
    (await request<T>(path, { ...options, method: "DELETE" })).data,

  /**
   * GET a list endpoint and keep the pagination `meta` the envelope carried.
   * Use this for any table or infinite list.
   */
  list: async <T>(
    path: string,
    options?: RequestOptions,
  ): Promise<Paginated<T>> => {
    const { data, meta } = await request<T[]>(path, {
      ...options,
      method: "GET",
    });
    return { items: data ?? [], meta: meta ?? {} };
  },
};

function serialize(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (body instanceof FormData) return body;
  return JSON.stringify(body);
}

/** Exposed so the auth layer can trigger a refresh outside a request cycle. */
export { refreshAccessToken };
