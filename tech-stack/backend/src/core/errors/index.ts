/**
 * One error hierarchy, one handler.
 *
 * Throw these from anywhere — service, repository, middleware. The central error handler
 * (core/http/middleware/error-handler.ts) is the ONLY place that renders an error envelope,
 * which is what keeps status codes consistent and internals from leaking.
 *
 * `code` is the contract the frontend switches on. Keep codes stable across versions.
 */
export abstract class AppError extends Error {
  abstract readonly status: number
  abstract readonly code: string
  readonly details?: unknown

  constructor(message: string, details?: unknown) {
    super(message)
    this.name = new.target.name
    if (details !== undefined) this.details = details
    Error.captureStackTrace?.(this, new.target)
  }
}

export class ValidationError extends AppError {
  readonly status = 422
  readonly code = 'VALIDATION_ERROR'
}

export class UnauthorizedError extends AppError {
  readonly status = 401
  readonly code = 'UNAUTHENTICATED'
  constructor(message = 'Authentication required', details?: unknown) {
    super(message, details)
  }
}

export class ForbiddenError extends AppError {
  readonly status = 403
  readonly code = 'FORBIDDEN'
  constructor(message = 'You do not have access to this resource', details?: unknown) {
    super(message, details)
  }
}

export class NotFoundError extends AppError {
  readonly status = 404
  readonly code = 'NOT_FOUND'
  constructor(message = 'Resource not found', details?: unknown) {
    super(message, details)
  }
}

/**
 * 409 with a DOMAIN-SPECIFIC code, e.g. `DUPLICATE_EMAIL`, `INVALID_STATUS_TRANSITION`.
 * The generic 'CONFLICT' default is a fallback — prefer a specific code the client can act on.
 */
export class ConflictError extends AppError {
  readonly status = 409
  readonly code: string
  constructor(code: string, message: string, details?: unknown) {
    super(message, details)
    this.code = code
  }
}

/** The resource changed under the caller (optimistic-concurrency check failed). */
export class StaleResourceError extends AppError {
  readonly status = 409
  readonly code = 'STALE_RESOURCE'
  constructor(message = 'The resource was modified by someone else', details?: unknown) {
    super(message, details)
  }
}

export class RateLimitError extends AppError {
  readonly status = 429
  readonly code = 'RATE_LIMITED'
  constructor(message = 'Too many requests', details?: unknown) {
    super(message, details)
  }
}

/** A dependency (payment gateway, mailer, object store) failed — not the caller's fault. */
export class UpstreamError extends AppError {
  readonly status = 502
  readonly code = 'UPSTREAM_ERROR'
}

// --- Postgres error translation -------------------------------------------------------------
// Business uniqueness is enforced by DB constraints (a "check then insert" races). Catch the
// violation at the repository/service boundary and turn it into a clean, stable 409.

const PG_UNIQUE_VIOLATION = '23505'
const PG_FOREIGN_KEY_VIOLATION = '23503'
const PG_CHECK_VIOLATION = '23514'

export function isPgError(err: unknown, code: string): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === code
}

export const isUniqueViolation = (err: unknown) => isPgError(err, PG_UNIQUE_VIOLATION)
export const isForeignKeyViolation = (err: unknown) => isPgError(err, PG_FOREIGN_KEY_VIOLATION)
export const isCheckViolation = (err: unknown) => isPgError(err, PG_CHECK_VIOLATION)

/**
 * Usage:
 *   await onUniqueViolation(() => repo.create(input), 'DUPLICATE_EMAIL', 'That email is taken')
 */
export async function onUniqueViolation<T>(fn: () => Promise<T>, code: string, message: string): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (isUniqueViolation(err)) throw new ConflictError(code, message)
    throw err
  }
}
