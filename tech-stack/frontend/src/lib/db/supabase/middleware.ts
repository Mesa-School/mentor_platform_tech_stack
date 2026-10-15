/**
 * Session refresh for Supabase Auth, called from `src/proxy.ts`.
 *
 * An access token expires while the user is reading a page. This refreshes it
 * on every request and writes the updated cookies through.
 *
 * ⚠️  THE BUG THIS FILE EXISTS TO PREVENT
 * `@supabase/ssr` sets refreshed cookies on the response object you hand it.
 * If you create a DIFFERENT response and return that instead, those cookies are
 * lost — and users are logged out at random, more often on slow connections,
 * and never on your machine. Always return the `response` object below, or copy
 * its cookies onto whatever you return instead.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() VERIFIES with the auth server. Do not swap this for getSession(),
  // which only decodes the cookie — that is a value the client can influence.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
