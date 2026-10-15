# `src/app/api` — Next.js Route Handlers (the internal API / BFF layer)

> **Read this before adding a route here.** Most data does *not* belong in this
> folder. The default path is the browser calling the backend directly through
> `@/lib/api/client`. A Route Handler is a deliberate exception, not a habit.

## Two different "API clients" — do not mix them

| | `src/lib/api/client.ts` | `src/app/api/_lib/backend.ts` |
|---|---|---|
| Runs in | the **browser** | the **server** (Route Handlers only) |
| Auth | in-memory access token + silent refresh | cookies from the incoming request |
| Base URL | `NEXT_PUBLIC_API_BASE_URL` (public) | `API_INTERNAL_BASE_URL` (private) |
| Secrets | never | allowed |
| Imported by | services → hooks → components | `route.ts` files only |

Importing `@/app/api/_lib/*` from a component is a bug: it drags server config
into the client bundle. Importing `@/lib/api/client` inside a Route Handler is
also a bug: there is no in-memory token on the server.

## When a Route Handler is justified

1. **Keep a secret off the client.** A partner API key, a signing secret, a
   server-only token. If the browser must never see it, the call goes here.
2. **First-party cookies.** When the API is on another site, its `Set-Cookie`
   is third-party and gets dropped by Safari's ITP and Chrome's phase-out.
   Re-issuing the cookie from *this* origin is the fix — see `auth/session`.
3. **Aggregate several backend calls** into one payload so a page makes one
   request instead of five waterfalled ones.
4. **Reach a private network** the browser can't route to.
5. **Webhooks and server-to-server callbacks** — Stripe, GitHub, a queue.

If none of those apply, skip the hop: call the backend from a service in a
feature slice. Every proxied request costs latency and adds a second place for
bugs to hide.

## What's implemented here

```
api/
  _lib/
    api-response.ts   ok() / fail() — enforces the { data } | { error } envelope
    backend.ts        server-side fetch to the upstream API + header hygiene
  health/route.ts     GET  /api/health          liveness + backend reachability
  auth/session/route.ts
                      POST   /api/auth/session  login → first-party refresh cookie
                      DELETE /api/auth/session  logout → revoke + clear cookie
  proxy/[...path]/route.ts
                      ANY  /api/proxy/*         transparent passthrough (opt-in)
```

### `GET /api/health`
Always returns **200** with `{ data: { status, services, latencyMs } }`. The
frontend being up and the backend being up are reported separately, so a
degraded API doesn't make an orchestrator kill this app. Powers
`<BackendStatus />` on the landing page.

### `POST | DELETE /api/auth/session`
Proxies login to the backend, then re-issues the refresh token as an
`httpOnly; Secure; SameSite=Lax` cookie on **this** origin. The access token is
returned in the JSON body and kept in memory — never in a cookie, never in
`localStorage`. `DELETE` revokes upstream and clears the cookie.

### `ANY /api/proxy/*`
Opt-in transparent passthrough. To route the entire app through it, set
`NEXT_PUBLIC_API_BASE_URL=/api/proxy` — client paths resolve unchanged because
the envelope and status codes pass straight through. Leave it unused otherwise.

## Rules for new handlers

- **Same envelope as the backend.** Use `ok()` / `fail()` from `_lib/api-response`.
  A different shape breaks `lib/api/client.ts`'s unwrapping for every caller.
- **Validate the body with Zod.** Server-side, always — a client-side form check
  proves nothing about what actually arrived.
- **`export const dynamic = 'force-dynamic'`** on anything user-specific. Next
  will otherwise happily prerender and cache a per-user response.
- **`await cookies()` / `await headers()`** — these are async in Next 16, and
  `params` is a `Promise` too.
- **Never leak upstream errors verbatim.** Map to a stable `code` and a safe
  `message`; log the detail with `logger.error`.
- **Files prefixed `_`** (like `_lib/`) are private — Next does not route them.
- **Auth check first.** A Route Handler is a public HTTP endpoint. Read the
  session before doing anything privileged; being "internal" protects nothing.

## Adding a handler — checklist

1. `src/app/api/<resource>/route.ts`, exporting `GET` / `POST` / … by name.
2. Zod-validate input; return `badRequest(...)` with `z.flattenError` details.
3. Call upstream through `backendFetch`, forwarding cookies when it's user-scoped.
4. Return `ok(data)` / `fail(status, code, message)`.
5. Set `dynamic = 'force-dynamic'` unless the response is genuinely static.
6. Consume it from a feature service so the UI still goes
   **component → hook → service → HTTP**, never `fetch` in a component.
