# Environment variables

Every variable, what it does, and — the part that matters — which are safe to
publish.

## The rule that costs everyone one afternoon

**`NEXT_PUBLIC_*` values are inlined at BUILD time.** They are compiled into the
JavaScript bundle, not read at startup. Changing one in your host's dashboard
does nothing until you **redeploy**.

If production is calling `localhost`, this is why.

## Adding a variable — three places or it does not work

1. The Zod schema in `src/lib/config/env.ts`
2. `.env.example`, with a fake value and a comment
3. Your own `.env.local`

And it must be referenced as a **literal** in the schema. `process.env[someVar]`
does not work in client bundles — Next can only inline what it can see.

## Public — shipped to every visitor

| Variable | Required | What it is |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | yes | Origin of this app. Absolute URLs, `metadataBase`, OG images |
| `NEXT_PUBLIC_API_BASE_URL` | yes | Backend REST API, **including** the version prefix. **No trailing slash** — one double-slashes every path, and some hosts redirect and drop the auth header, which presents as "logged out only in production" |
| `NEXT_PUBLIC_API_DOCS_URL` | no | Explicit Swagger/Redoc URL; falls back to the API base minus `/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | yes | Shown in the UI and page titles |

## Server-only — read via `getServerEnv()`

`getServerEnv()` throws if called in the browser, so a leak fails loudly at
runtime instead of silently shipping a secret.

| Variable | Required | What it is |
| --- | --- | --- |
| `NODE_ENV` | yes | `development` · `test` · `production` |
| `API_INTERNAL_BASE_URL` | no | Internal API URL for Route Handlers, so server-side calls can skip the public ingress |
| `SESSION_COOKIE_NAME` | yes | Name of the httpOnly refresh cookie. **Must match the backend exactly**, or refresh silently fails and users are logged out one request after signing in |

## If you use a database directly (Tier 1 only)

### Supabase

| Variable | Public? | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **yes, by design** | Safe **only** because RLS is on. With RLS off it reads your whole database from a console |
| `SUPABASE_SERVICE_ROLE_KEY` | **never** | Bypasses every policy. Production-only if set at all, never `NEXT_PUBLIC_` |

### MongoDB

| Variable | Public? | Notes |
| --- | --- | --- |
| `MONGODB_URI` | **never** | Contains your database password |
| `MONGODB_DB` | no | Database name |
| `MONGODB_POOL_MAX` | no | Defaults to 10 |

## Classify, do not pattern-match

"No `KEY` in `NEXT_PUBLIC_`" is the wrong rule and it trains people to ignore the
warning the first time it fires wrongly. A Supabase anon key, a Firebase web
config and a Sentry DSN are **public identifiers** and belong there. A
service-role key, a database URI and an API secret do not.

For every variable, answer: *is this an identifier, or a secret?* Then place it
accordingly.

## Per environment

Give **preview a separate database**. Most hosts copy environment variables to
preview deployments by default, so otherwise every branch reads and writes live
customer data — and a schema change on a branch is a production change.

Give preview its own session secret too, or a session minted on a preview is
valid in production.

## Verify

```bash
# no secret in the client bundle
npm run build && grep -rlE "service_role|mongodb\+srv|sk-" .next/static
# → must return nothing

# the base URL is resolved in exactly one place
grep -rn "NEXT_PUBLIC_API_BASE_URL" src/ | grep -v "lib/config/env.ts"
# → must return nothing
```
