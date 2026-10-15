/**
 * Supabase client for the BROWSER.
 *
 * Uses the anon key, which is public by design and ships in the JavaScript
 * bundle. That is safe ONLY because Row Level Security is enabled on every
 * table, with policies restricting rows to the requesting user.
 *
 * If RLS is off on any table, this key reads that entire table from a browser
 * console. No exploit required. See supabase/migrations/ and run the two
 * verification queries in your kit's 03-database guide after every migration.
 *
 * Respects RLS. Safe to use in Client Components.
 */
"use client";

import { createBrowserClient } from "@supabase/ssr";

import { supabaseConfig } from "./env";
import type { Database } from "./database.types";

export function createClient() {
  const { url, anonKey } = supabaseConfig();

  return createBrowserClient<Database>(
    url,
    anonKey,
  );
}
