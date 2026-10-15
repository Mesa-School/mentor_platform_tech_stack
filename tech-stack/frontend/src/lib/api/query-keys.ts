/**
 * The single query-key factory. Hooks import keys from here — NEVER inline a
 * string key like `useQuery({ queryKey: ['users'] })`.
 *
 * Why: invalidation is only precise if every producer and every invalidator agree
 * on the exact key shape. One factory makes `qc.invalidateQueries({ queryKey:
 * queryKeys.users.all })` provably match every users query.
 *
 * Convention per feature:
 *   all      → the root key; invalidate this to refresh everything in the feature
 *   lists    → the list namespace; invalidate to refresh every list variant
 *   list(p)  → one parameterised list
 *   details  → the detail namespace
 *   detail(id)
 *
 * When you add a feature, add a block here in step 4 of the recipe (see README).
 */
import type { ListParams } from "@/types/api";

export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
  },

  health: {
    all: ["health"] as const,
    backend: () => [...queryKeys.health.all, "backend"] as const,
  },

  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (params?: ListParams) => [...queryKeys.users.lists(), params ?? {}] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // ── Add one block per feature. Mirror the API resources. ──
} as const;

export type QueryKeys = typeof queryKeys;
