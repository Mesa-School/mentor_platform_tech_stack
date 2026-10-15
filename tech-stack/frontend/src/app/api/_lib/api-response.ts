/**
 * Response helpers for Route Handlers.
 *
 * Our Route Handlers speak the SAME envelope as the backend — `{ data, meta }` /
 * `{ error }` — so `lib/api/client.ts` can consume either one without special
 * cases. If you invent a different shape here, the client's unwrapping breaks.
 */
import { NextResponse } from "next/server";

import { API_ERROR_CODES } from "@/types/api";
import type { ResponseMeta } from "@/types/api";

export function ok<T>(data: T, meta?: ResponseMeta, status = 200) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) }, { status });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function fail(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status },
  );
}

export const badRequest = (message: string, details?: unknown) =>
  fail(400, API_ERROR_CODES.validation, message, details);

export const unauthorized = (message = "Authentication required") =>
  fail(401, API_ERROR_CODES.unauthorized, message);

export const forbidden = (message = "You do not have access to this resource") =>
  fail(403, API_ERROR_CODES.forbidden, message);

export const notFound = (message = "Not found") =>
  fail(404, API_ERROR_CODES.notFound, message);

export const serverError = (message = "Unexpected server error") =>
  fail(500, API_ERROR_CODES.unknown, message);
