/**
 * Supabase config, asserted.
 *
 * The vars are OPTIONAL in `lib/config/env.ts` so the default build — a separate
 * backend, no direct database — does not require them. Here they are required,
 * because if you are importing a Supabase client you have chosen this path.
 *
 * Failing here with a readable message beats a runtime "invalid URL" three
 * frames deep.
 */
import { env } from "@/lib/config/env";

export function supabaseConfig() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required to use the Supabase client. " +
        "Add them to .env.local, or delete src/lib/db/supabase if you are not using Supabase.",
    );
  }

  return { url, anonKey };
}
