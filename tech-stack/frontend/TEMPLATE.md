# template/frontend — populated

**This is real, compiling boilerplate.** Copy the contents of this folder into your
project's `frontend/` and you have the foundation every module guide assumes.

```bash
cp -r template/frontend/. my-app/frontend/
cd my-app/frontend
cp .env.example .env.local    # then fill it in — see INITIALIZE.md
npm install
npm run dev                   # → ready on http://localhost:3000
```

There is deliberately **no lockfile**. Versions are pinned in `kit.json` and stated in
each guide's `Verified against:` header.

---

## What is here, and which guide owns it

| Path | Guide | What it is |
| --- | --- | --- |
| `src/lib/api/client.ts` | `05-api` | **The only place in the app that calls `fetch`.** Prefixes the base URL, attaches the in-memory bearer token, sends credentials so the httpOnly refresh cookie rides along, unwraps the `{ data, meta }` envelope, throws a typed `ApiError`, and on a 401 runs a **single-flight** refresh and retries once |
| `src/lib/api/endpoints.ts` | `05-api` | Every backend path in one place, so a route rename is a one-file change |
| `src/lib/api/http-error.ts` | `05-api` | The typed `ApiError` callers catch |
| `src/lib/api/query-keys.ts` | `05-api` | The central TanStack Query key factory — never inline a key literal |
| `src/lib/auth/token-store.ts` | `04-auth` | The access token, in a module variable. Never `localStorage` |
| `src/lib/auth/auth-context.tsx` | `04-auth` | Current user, login, logout |
| `src/lib/auth/roles.ts` | `04-auth` | Role helpers **for UI decisions only** — the file says so at the top, and it is right: hiding a button is not authorization |
| `src/lib/config/env.ts` | `14-deployment` | Zod-validated env, public and server split, with `getServerEnv()` throwing if called in the browser so a leak fails loudly |
| `src/lib/config/navigation.ts` · `site.ts` | `02-ui` | Navigation from one typed config; site metadata |
| `src/lib/logger.ts` · `format.ts` · `toast.ts` · `utils.ts` | — | Small shared utilities |
| `src/providers/` | `01-frontend` | QueryClientProvider with sane defaults, theme provider |
| `src/features/auth/` | `04-auth` | A **complete worked slice**: `components/` · `hooks/` · `services/` · `schemas.ts` · `types.ts`. Copy its shape for every feature |
| `src/features/users/` | `05-api` | A second slice showing services and schemas without UI |
| `src/hooks/` | `01-frontend` | `use-auth`, `use-debounce`, `use-disclosure`, `use-media-query`, `use-table-params` and friends |
| `src/components/ui/` | `02-ui` | ~60 shadcn primitives, already installed |
| `src/types/api.ts` · `models.ts` · `enums.ts` | `05-api` | The envelope types, `CurrentUser`, and the role enum with its ranking |
| `src/app/globals.css` | `02-ui` | The design tokens |
| `.env.example` | all | Every variable, with a fake value and a comment |

| `src/app/api/` | `05-api` | **Route Handlers** — the BFF layer. `_lib/backend.ts` (server-side fetch), `_lib/api-response.ts` (the envelope), `health/`, `auth/session/` (first-party cookie), and `proxy/[...path]/` (opt-in transparent passthrough). Read its README before adding one |
| `src/lib/db/` | `03-database` | **Tier 1 only.** Supabase (client · server · admin · middleware) and MongoDB (connect · ids · repository pattern). Pick one, delete the other. Delete both if you have a separate backend |
| `supabase/migrations/` | `03-database` | An example migration showing a table **and its RLS policies in the same file** |
| `docs/` | — | Architecture, database, environment and conventions for this codebase |
| `src/components/layout/` | `02-ui` | App shell, sidebar, topbar, brand, nav-user, theme toggle |
| `src/app/(app)/admin/` | `01-frontend` · `02-ui` | **The admin platform** — dashboard, users, activity, analytics, reports, settings. A working shell with honestly-labelled placeholder panels, not invented data |
| `src/app/(auth)/admin/login/` | `04-auth` | Sign-in |
| `src/features/dashboard/` | `01-frontend` | Stat cards, activity feed, throughput chart |
| `src/features/users/` · `settings/` | `05-api` | Users table, settings tabs |
| `src/components/shared/` | `02-ui` | `Section`, `StatCard`, `PlaceholderPanel`, `AuthGate` |
| `src/lib/auth/preview-user.ts` | `04-auth` | The preview identity used when `NEXT_PUBLIC_AUTH_ENABLED=false` |
| `src/proxy.ts` | `04-auth` | Next 16 middleware — session refresh and route gating |

---

## The two files to read before writing anything

1. **`src/lib/api/client.ts`** — read the header comment. It states the rule the whole
   frontend depends on: components call hooks, hooks call services, services call `api.*`.
   Nothing else calls `fetch`.
2. **`src/features/auth/`** — the slice shape you copy for every feature.

## The rule this template exists to enforce

**No component calls `fetch` directly.** That single seam is what makes auth, error
handling, the 401 refresh and caching solvable in one place instead of forty. If you find
yourself importing `client.ts` into a component, put a service between them.

## What is deliberately not here

No login page wired to a real backend, no protected routes, no feature screens. The guides
build those against *your* API, after interviewing you about your roles and your sign-in
method.

`AGENTS.md` here is the block Next.js generates and re-adds itself — it is not the kit's
`AGENTS.md`. The kit's one lives at the root of this kit and is the file your agent should
be reading.
