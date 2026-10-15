"use client";

/**
 * Live health indicator for the landing page.
 *
 * It pings our OWN Route Handler (`/api/health`), not the backend directly.
 * That handler runs server-side and calls the API, which means: no CORS
 * preflight, the internal API URL never reaches the browser, and the check
 * still proves end-to-end reachability. This is the smallest useful example of
 * why an internal API route exists — see `src/app/api/README.md`.
 */
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/api/query-keys";
import { cn } from "@/lib/utils";
import type { ApiEnvelope } from "@/types/api";

interface HealthPayload {
  status: "ok" | "degraded" | "down";
  services: { frontend: "ok"; backend: "ok" | "down" };
  latencyMs?: number;
}

export function BackendStatus({ className }: { className?: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.health.backend(),
    queryFn: async (): Promise<HealthPayload> => {
      const response = await fetch("/api/health", { cache: "no-store" });
      // Route Handlers use the same { data } envelope as the backend.
      const body = (await response.json()) as ApiEnvelope<HealthPayload>;
      return body.data;
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: false,
  });

  const state: "checking" | "ok" | "down" = isPending
    ? "checking"
    : isError || data?.services.backend !== "ok"
      ? "down"
      : "ok";

  const dot = {
    checking: "bg-muted-foreground animate-pulse",
    ok: "bg-emerald-500",
    down: "bg-destructive",
  }[state];

  const label = {
    checking: "Checking API…",
    ok: "API reachable",
    down: "API unreachable",
  }[state];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs font-medium text-muted-foreground",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className={cn("inline-block size-1.5 rounded-full", dot)} aria-hidden />
      {label}
      {state === "ok" && data?.latencyMs !== undefined && (
        <span className="tabular-nums opacity-60">{data.latencyMs}ms</span>
      )}
    </span>
  );
}
