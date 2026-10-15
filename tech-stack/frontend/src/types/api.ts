/**
 * Transport-level types — the shape of the wire, not the domain.
 *
 * The backend speaks one envelope:
 *   success →  { "data": T, "meta"?: {...} }
 *   failure →  { "error": { "code": string, "message": string, "details"?: unknown } }
 *
 * `lib/api/client.ts` unwraps `data` and throws `ApiError` for `error`, so the rest
 * of the app only ever sees the payload type `T`.
 */

export interface ApiEnvelope<T> {
  data: T;
  meta?: ResponseMeta;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ResponseMeta {
  /** Cursor pagination. */
  nextCursor?: string | null;
  hasMore?: boolean;
  /** Offset pagination. */
  page?: number;
  pageSize?: number;
  total?: number;
}

/** A list response after the client has unwrapped the envelope. */
export interface Paginated<T> {
  items: T[];
  meta: ResponseMeta;
}

/** Query params every list endpoint accepts. Extend per feature, don't fork. */
export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  cursor?: string;
}

/** Field-level validation errors returned by the backend's Zod layer. */
export interface ValidationErrorDetails {
  fieldErrors: Record<string, string[]>;
  formErrors?: string[];
}

/**
 * Stable error codes the backend emits. Match on these — never on `message`,
 * which is user-facing copy and free to change.
 */
export const API_ERROR_CODES = {
  validation: "VALIDATION_ERROR",
  unauthorized: "UNAUTHORIZED",
  forbidden: "FORBIDDEN",
  notFound: "NOT_FOUND",
  conflict: "CONFLICT",
  rateLimited: "RATE_LIMITED",
  network: "NETWORK_ERROR",
  unknown: "UNKNOWN",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
