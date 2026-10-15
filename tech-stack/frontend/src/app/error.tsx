"use client";

/**
 * Route-level error boundary. Next renders this instead of a white screen when a
 * Server or Client Component throws during render.
 *
 * It must be a Client Component, and `reset()` re-renders the segment — offer it,
 * because a transient fetch failure is usually fixed by trying again.
 *
 * Add an `error.tsx` inside a route folder to scope recovery to that segment;
 * this one is the app-wide fallback.
 */
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Unhandled route error", error, { digest: error.digest });
  }, [error]);

  return (
    <div className="grid min-h-svh place-items-center px-6">
      <div className="max-w-md text-center">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Mesa AI CTO
        </p>
        <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight">
          Something broke on our side
        </h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          The error has been logged. Try again — if it keeps happening, send the
          reference below to the MSL Team.
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            ref: {error.digest}
          </p>
        )}
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
