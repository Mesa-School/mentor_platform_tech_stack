/**
 * ⚠️  SERVICE-ROLE CLIENT — THIS BYPASSES EVERY ROW LEVEL SECURITY POLICY.
 *
 * It is a master key to your entire database. Read this before using it.
 *
 * ── The rule ──────────────────────────────────────────────────────────────
 * SERVER ONLY. It must never be imported by a Client Component, by anything
 * under `src/app/(app)`, or transitively by either. If this key reaches the
 * browser bundle, RLS is protecting nothing and every row of every table is
 * readable by anyone who opens the console.
 *
 * The build-time check for this is in your kit's security checklist:
 *     npm run build && grep -rl "service_role" .next/static
 * It must return nothing.
 *
 * ── When it is justified ──────────────────────────────────────────────────
 * Only when the operation genuinely cannot be performed as the user:
 *   • a signup side-effect that writes a row the new user cannot yet see
 *   • an admin batch job with no user session
 *   • a webhook from a third party, acting on nobody's behalf
 *
 * ── When it is NOT justified ──────────────────────────────────────────────
 * "My query returned nothing so I switched to the admin client." That empty
 * result was almost certainly a missing or wrong policy. Using this key makes
 * the symptom disappear and the hole permanent. Fix the policy.
 *
 * ── Your obligations at every call site ───────────────────────────────────
 * 1. A comment saying why the user-scoped client cannot do this.
 * 2. Your own permission check, written by hand — RLS is not running.
 *
 * If you have no use for this file, delete it. That is the safest outcome, and
 * most Tier 1 apps never need it.
 */
import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

let cached: ReturnType<typeof createSupabaseClient<Database>> | null = null;

/**
 * Deliberately verbose. If you are typing this name, you should be able to say
 * out loud why the user-scoped client in `server.ts` will not do.
 */
export function createAdminClientThatBypassesRLS() {
  if (typeof window !== "undefined") {
    throw new Error(
      "The service-role client was reached from the browser. This is a security bug, not a configuration problem.",
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. If you did not intend to use the admin client, delete this file.",
    );
  }

  cached ??= createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return cached;
}
