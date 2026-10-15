/**
 * The two response envelopes — the entire API contract, in one file.
 * Mirror these types on the frontend (copy them, or share via a package) so client and
 * server can never drift. Success bodies are always `{ data, meta? }`; failures are always
 * `{ error: { code, message, details? } }` and are emitted only by the central error handler.
 */

export type PageMeta = {
  /** Keyset pagination: opaque cursor for the next page, or null when exhausted. */
  nextCursor?: string | null
  /** Offset pagination: total matching rows (bounded admin grids only). */
  total?: number
  page?: number
  pageSize?: number
}

export type ApiSuccess<T> = { data: T; meta?: PageMeta }

export type ApiError = {
  error: {
    /** Stable, machine-readable. The frontend switches on this — never change one casually. */
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
