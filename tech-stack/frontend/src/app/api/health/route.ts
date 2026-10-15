/**
 * GET /api/health
 *
 * Liveness for this Next app plus reachability of the upstream backend.
 * Used by the landing page's `<BackendStatus />`, and a sensible target for a
 * load-balancer or uptime check.
 *
 * Why a Route Handler instead of pinging the backend from the browser:
 *  - no CORS preflight against the API,
 *  - the internal API hostname stays server-side,
 *  - one URL to health-check regardless of where the API lives.
 */
import { backendFetch } from "@/app/api/_lib/backend";
import { ok } from "@/app/api/_lib/api-response";
import { ENDPOINTS } from "@/lib/api/endpoints";

// Health must never be cached or prerendered.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const startedAt = performance.now();
  let backend: "ok" | "down" = "down";

  try {
    const response = await backendFetch(ENDPOINTS.health, { timeoutMs: 3_000 });
    backend = response.ok ? "ok" : "down";
  } catch {
    backend = "down";
  }

  const latencyMs = Math.round(performance.now() - startedAt);

  // Always 200: the frontend IS up. The payload reports the backend separately,
  // so a degraded API doesn't make this app look dead to an orchestrator.
  return ok({
    status: backend === "ok" ? "ok" : "degraded",
    services: { frontend: "ok" as const, backend },
    latencyMs,
    timestamp: new Date().toISOString(),
  });
}
