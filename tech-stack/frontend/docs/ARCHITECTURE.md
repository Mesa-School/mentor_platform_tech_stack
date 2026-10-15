# Architecture

## The data path — the one rule everything else follows

```
component  →  hook  →  service  →  HTTP  →  backend
                                   or
component  →  hook  →  service  →  Route Handler  →  db
```

**No component calls `fetch` or a database directly.** That single seam is what
makes auth, error handling, the 401 refresh and caching solvable in one place
instead of forty.

The check:

```bash
grep -rn "fetch(" src/features src/components src/app | grep -v services/
# → must return nothing
```

## Two API clients — never mix them

| | `src/lib/api/client.ts` | `src/app/api/_lib/backend.ts` |
| --- | --- | --- |
| Runs in | the browser | the server, Route Handlers only |
| Auth | in-memory access token + silent refresh | cookies from the incoming request |
| Base URL | `NEXT_PUBLIC_API_BASE_URL` | `API_INTERNAL_BASE_URL` |
| May hold secrets | never | yes |

Importing `@/app/api/_lib/*` from a component drags server config into the client
bundle. Importing `@/lib/api/client` inside a Route Handler is also wrong — there
is no in-memory token on the server.

## Folder rules

```
src/
  app/                    routes only — thin, no business logic
    (auth)/               login, signup — no app chrome
    (app)/                the signed-in application
    api/                  Route Handlers — the BFF layer, see its README
  features/<feature>/
    components/           UI for this feature only
    hooks/                TanStack Query hooks
    services/             THE ONLY place client.ts is called
  components/ui/          shadcn primitives — shared
  components/layout/      app shell, sidebar, topbar
  components/shared/      cross-feature components
  lib/                    api client, auth, config, db, utilities
  providers/              React context providers
  types/                  shared types
```

**Vertical slices, not layer folders.** A feature's files live together. Do not
create top-level `controllers/`, `services/` or `types/` — a feature smeared
across four directories makes deletion a hunt and produces name collisions.

## Server and client

Server Components are the default. `"use client"` goes at the **narrowest**
component that needs interactivity — never at the top of a page to silence an
error, which converts the whole subtree to client rendering and quietly gives up
server rendering.

Anything importing `src/lib/db/*` or `src/app/api/_lib/*` is server-only.

## Route groups are not permission boundaries

`(app)` and `(auth)` are **layout** boundaries — the parentheses keep the folder
name out of the URL. They protect nothing. Anyone can call the endpoints behind
them directly with curl.

Hiding a control is not authorization. The endpoint, the policy, or the query
must refuse independently.

## The four states

Every screen handles **loading, empty, error, loaded**. A screen that only
renders "loaded" is a screenshot, not a feature. `components/shared/` has a
component for each so this is cheap.

## Sessions

The access token lives in a module variable in `lib/auth/token-store.ts` — never
`localStorage`, never `sessionStorage`, never a readable cookie. There is no way
to put a token in JavaScript-reachable storage and also protect it from
JavaScript.

Persistence across reloads comes from an httpOnly refresh cookie the browser
will not let JavaScript read. `lib/api/client.ts` handles 401 in exactly one
place, with a **single-flight** refresh: ten concurrent 401s cause one refresh,
not ten racing ones that log the user out.

## Why the envelope

Every response is `{ data, meta? }` or `{ error: { code, message } }`. The client
unwraps it so callers receive `T` rather than `{ data: T }`.

It is the same shape a Tier 2 backend returns, deliberately. That is what makes
outgrowing a single-app setup a change of base URL instead of touching every
call site.
