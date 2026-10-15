/**
 * The one error type the data layer throws. Every service, hook, and form handler
 * can rely on `.status`, `.code`, `.message`, `.details` being present.
 *
 * Match on `.code` (a stable contract), never on `.message` (user-facing copy).
 */
import {
  API_ERROR_CODES,
  type ApiErrorEnvelope,
  type ValidationErrorDetails,
} from "@/types/api";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Build from a non-2xx `Response`, tolerating a non-JSON body. */
  static async fromResponse(response: Response): Promise<ApiError> {
    let code: string = API_ERROR_CODES.unknown;
    let message = response.statusText || "Request failed";
    let details: unknown;

    try {
      const body = (await response.json()) as Partial<ApiErrorEnvelope>;
      code = body.error?.code ?? code;
      message = body.error?.message ?? message;
      details = body.error?.details;
    } catch {
      // Body was empty or not JSON — the status-derived defaults stand.
    }

    return new ApiError(response.status, code, message, details);
  }

  /** The request never reached the server (offline, DNS, CORS preflight). */
  static network(cause?: unknown): ApiError {
    return new ApiError(
      0,
      API_ERROR_CODES.network,
      "Could not reach the server. Check your connection and try again.",
      cause,
    );
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNotFound() {
    return this.status === 404;
  }
  get isValidation() {
    return this.code === API_ERROR_CODES.validation;
  }
  /** 5xx and network failures are worth retrying; 4xx are not. */
  get isRetryable() {
    return this.status === 0 || this.status >= 500;
  }

  /** Field errors from the backend's Zod layer, if this is a validation error. */
  get fieldErrors(): Record<string, string[]> {
    if (!this.isValidation || !this.details) return {};
    return (this.details as ValidationErrorDetails).fieldErrors ?? {};
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Safe message for any thrown value — use this in toasts and error boundaries. */
export function toErrorMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
