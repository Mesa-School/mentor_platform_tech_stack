/**
 * Thin logging facade.
 *
 * Use this instead of bare `console.*` so that (a) debug noise is stripped in
 * production and (b) wiring Sentry/Datadog later is a single edit here rather
 * than a codebase-wide find-and-replace.
 */
import { isDevelopment } from "@/lib/config/env";

type Meta = Record<string, unknown>;

function write(
  level: "debug" | "info" | "warn" | "error",
  message: string,
  meta?: Meta,
) {
  // Debug/info are development-only; warnings and errors always surface.
  if ((level === "debug" || level === "info") && !isDevelopment) return;

  const payload = meta ? [message, meta] : [message];
  console[level === "debug" ? "log" : level](...payload);
}

export const logger = {
  debug: (message: string, meta?: Meta) => write("debug", message, meta),
  info: (message: string, meta?: Meta) => write("info", message, meta),
  warn: (message: string, meta?: Meta) => write("warn", message, meta),
  error: (message: string, error?: unknown, meta?: Meta) => {
    write("error", message, { ...meta, error });
    // TODO: forward to your error tracker here, e.g. Sentry.captureException(error)
  },
};
