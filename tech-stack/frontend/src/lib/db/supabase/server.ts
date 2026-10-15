/**
 * Supabase client for the SERVER — Server Components, Route Handlers, Server
 * Actions.
 *
 * Uses the anon key plus the signed-in user's cookies, so every query runs AS
 * THAT USER and Row Level Security applies exactly as it does in the browser.
 *
 * THIS IS THE DEFAULT for server-side code. Reach for `admin.ts` only when an
 * operation genuinely cannot be performed as the user — and then write the
 * permission check yourself, because RLS will not help you there.
 *
 * Respects RLS. Never import this into a Client Component.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseConfig } from "./env";
import type { Database } from "./database.types";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function createClient() {
  // `cookies()` is async in Next 16.
  const cookieStore = await cookies();

  const { url, anonKey } = supabaseConfig();

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, which cannot set cookies.
            // Harmless as long as proxy.ts is refreshing the session — that is
            // exactly what it is for.
          }
        },
      },
    },
  );
}

/**
 * The current user, VERIFIED with the auth server.
 *
 * Use this for any authorization decision. `getSession()` only decodes the
 * cookie without verifying it, which means trusting a value the client can
 * influence — fine for rendering "signed in as…", wrong for deciding what
 * someone may do.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
