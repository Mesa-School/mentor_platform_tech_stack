# boilerplate/ — the real, compiling code

**This is the code.** One copy, edited here, used by every kit that needs it.

```
boilerplate/
├── frontend/    Next.js 16 · TanStack Query · shadcn/ui · typed API client
│   ├── src/app/(app)/admin/   THE ADMIN PLATFORM — dashboard · users · activity
│   │                          analytics · reports · settings
│   ├── src/app/api/     Route Handlers: health · session · proxy
│   ├── src/lib/db/      Tier 1 only: Supabase or MongoDB (pick one)
│   ├── supabase/        migrations, with an RLS example
│   └── docs/            architecture · database · environment · conventions
└── backend/     Express 5 · Prisma 7 (migrations) · Kysely · jose · argon2 · pino
    └── docs/            architecture · database · environment · conventions · deploy
```

It is not a demo. It boots, serves, connects to Postgres, issues tokens, validates its own
environment, and refuses to start when that environment is wrong.

---

## Which kits use it

| Kit | Uses | Then |
| --- | --- | --- |
| **Tier 2 · Express + Postgres** | `frontend/` + `backend/` | Delete `frontend/src/lib/db/` and `frontend/supabase/` — the backend owns the database |
| **Tier 3 · Platform** | `frontend/` + `backend/` | Same. Its guides add scoped RBAC, audit, jobs, push and AI on top |
| **Tier 1 · Supabase** | `frontend/` only | Keep `src/lib/db/supabase/`, delete `mongodb/`. Delete the whole `backend/` |
| **Tier 1 · MongoDB** | `frontend/` only | Keep `src/lib/db/mongodb/`, delete `supabase/` and `frontend/supabase/`. Delete the whole `backend/` |

**The frontend runs in two modes, and you pick one by what you delete:**

- **With a backend** (Tier 2/3) — the browser calls `NEXT_PUBLIC_API_BASE_URL` through
  `lib/api/client.ts`, holding a JWT in memory and refreshing against an httpOnly cookie
  the API issues. `src/lib/db/` is dead weight; remove it.
- **Without one** (Tier 1) — Route Handlers in `src/app/api/` are the API, and they reach
  the database through `src/lib/db/`. There is no `localhost:4000` to call.

Mixing them gives you an app that tries both and does neither. Decide at setup, delete the
other half, and the codebase stays honest about what it is.

What carries across **every** tier is the **contract**: the same `{ data, meta }` /
`{ error }` envelope, the same typed client shape, the same query-key factory. That is why
growing out of Tier 1 is a change of base URL rather than a rewrite.

---

## Using it

```bash
# backend
cp -r boilerplate/backend/. my-app/backend/
cd my-app/backend
cp .env.example .env        # fill it in — see the kit's INITIALIZE.md
npm install
npm run db:migrate
npm run dev                 # → listening on :4000
curl localhost:4000/readyz  # → {"status":"ready"}

# frontend
cp -r boilerplate/frontend/. my-app/frontend/
cd my-app/frontend
cp .env.example .env.local
npm install
npm run dev                 # → ready on http://localhost:3000
```

From the CLI phase onward, `mesa-ai-cto init` does this for you.

**Lockfiles are committed.** Both sides carry a `package-lock.json`, so `npm ci` gives you
the exact tree that was verified — which is the point of shipping a boilerplate rather than
a list of dependencies.

They will drift from upstream over time. Refresh them deliberately (`npm update`, then
re-run the build and tests) rather than leaving them to resolve fresh on every install,
which is how a boilerplate quietly stops compiling.

---

## The files that matter most

Read these four before writing anything on top.

| File | Why |
| --- | --- |
| `backend/src/core/auth/rbac.ts` | The guard chain. `requireRole` reads `req.user`, which only `requireAuth` populates — so it is never a guard on its own |
| `backend/src/core/http/app.ts` | Middleware order **is** execution order. The error handler is last on purpose; mounted earlier it never sees the errors it exists to format |
| `backend/src/modules/_template/` | The vertical slice every feature copies: routes · controller · service · repository · schema · types · docs · test |
| `frontend/src/lib/api/client.ts` | The only place in the app that calls `fetch`. Read its header comment — it states the rule the whole frontend depends on |

## The two rules the boilerplate exists to enforce

1. **No component calls `fetch` directly.** Components call hooks, hooks call services,
   services call `api.*`. That single seam is what makes auth, error handling, the 401
   refresh and caching solvable in one place instead of forty.
2. **Every router applies `requireAuth`.** Including routers you have not mounted yet —
   mounting one later would otherwise publish it unguarded.

## What is deliberately not here

No auth module and no user table beyond what the schema needs. The admin platform ships as
a **working shell** — real routes, real layout, real components — with panels that say
plainly they are placeholders rather than filling themselves with invented numbers. It runs
with no backend at all (`NEXT_PUBLIC_AUTH_ENABLED=false` signs you in as a preview user),
so the whole UI is browsable on day one. The module guides build those — and they build them
*interviewing you first*, because your roles, your ownership chain and your sign-in method
are yours, not the template's.

`app.example.yaml` and `dispatch.example.yaml` carry placeholder project ids
(`my-project`, `my-instance`). They are examples on purpose. Fill them in; never commit the
filled-in versions.

`frontend/AGENTS.md` is the block Next.js generates and re-adds itself. It is **not** the
kit's `AGENTS.md` — that lives at the root of each kit and is the file your agent should be
reading.

---

## Maintaining it

Edit here, once. Both kits point at this folder, so there is no second copy to keep in
sync — that duplication existed briefly and was removed for exactly this reason.

`node scripts/lint-kits.mjs` checks that this folder has a `package.json` and a
`.env.example` on each side, contains no `node_modules`, lockfile, `.env` or build output,
and holds nothing credential-shaped.

## Verified

Both sides install, compile and pass their checks:

| | Result |
| --- | --- |
| `backend` — `npm install` | 635 packages |
| `backend` — `npm run typecheck` | clean |
| `backend` — `npm run build` | clean |
| `backend` — `npm run test:unit` | 8/8 passing |
| `frontend` — `npm install` | 683 packages |
| `frontend` — `npm run build` | clean — **11 routes** incl. the admin platform, middleware active |

CI re-runs all of it on every push (`.github/workflows/ci.yml`), plus a scan for
credential-shaped strings and tracked `.env` files.

**One thing to know:** `src/lib/db/` is excluded from typecheck in `tsconfig.json`. It has
to be — it ships with adapters for *both* Supabase and MongoDB, and their dependencies are
not installed by default because you install one, never both. Activating it is three steps,
written at the top of `tsconfig.json`: install the deps, delete the adapter you are not
using, remove the exclude line.
