# template/backend — populated

**This is real, compiling boilerplate.** Copy the contents of this folder into your
project's `backend/` and you have the foundation every module guide assumes.

It is not a demo. It boots, serves, connects to Postgres, issues tokens, validates its
own environment, and refuses to start when that environment is wrong.

```bash
cp -r template/backend/. my-app/backend/
cd my-app/backend
cp .env.example .env      # then fill it in — see INITIALIZE.md
npm install
npm run db:migrate
npm run dev               # → listening on :4000
curl localhost:4000/readyz
```

There is deliberately **no lockfile**. Versions are pinned in `kit.json` and stated in
each guide's `Verified against:` header; a lockfile committed here would go stale and
silently pin you to whatever was current the day it was generated.

---

## What is here, and which guide owns it

| Path | Guide | What it is |
| --- | --- | --- |
| `src/shared/api-response.ts` | `05-api` | The `{ data, meta }` / `{ error }` envelope types |
| `src/shared/pagination.ts` · `slices.ts` | `05-api` | Cursor pagination and the slice helpers |
| `src/shared/roles.ts` | `04-auth` | The role union — import this from the frontend too |
| `src/core/errors/index.ts` | `05-api` | `AppError` hierarchy; each error carries its own `status` and `code` |
| `src/core/http/app.ts` | `12-observability` | App bootstrap: helmet, cors, compression, pino-http, health endpoints — **middleware order matters, see the guide** |
| `src/core/http/middleware/error-handler.ts` | `05-api` | Zod → 422, `AppError` → its status, everything else → 500 with the detail logged, never returned |
| `src/core/http/middleware/rate-limit.ts` | `04-auth` | Login and expensive-endpoint limits |
| `src/core/http/middleware/request-id.ts` | `12-observability` | A uuid per request, echoed as `x-request-id` |
| `src/core/http/response.ts` · `landing.ts` | `05-api` · `12-observability` | Response helpers; the auth-gated status page |
| `src/core/config/index.ts` | `14-deployment` | Zod env schema validated at boot — a missing secret is a failed start, not a 2am 500 |
| `src/core/db/index.ts` | `03-database` | Pooled Postgres + the Kysely instance. **One pool per process** |
| `src/core/db/connection-string.ts` | `03-database` | Handles the TCP-vs-unix-socket difference between local and production |
| `src/core/db/pagination.ts` · `types.ts` · `enums.ts` | `03-database` | Cursor helpers and generated table types |
| `src/core/auth/jwt.ts` | `04-auth` | Sign and verify access + refresh tokens (jose) |
| `src/core/auth/password.ts` | `04-auth` | argon2id hash and verify |
| `src/core/auth/rbac.ts` | `04-auth` | `requireAuth`, `requireRole` — **read this one first** |
| `src/core/auth/basic-auth.ts` | `12-observability` | Gates the status page |
| `src/core/audit/index.ts` | `12-observability` | The audit function. Used at Tier 3; harmless at Tier 2 |
| `src/core/storage/` | `06-files` | Storage client and signing |
| `src/core/logging/index.ts` | `12-observability` | The pino instance |
| `src/core/docs/` | `05-api` | OpenAPI registry, Swagger and Redoc |
| `src/modules/_template/` | `05-api` | **The vertical slice to copy for every feature**: routes · controller · service · repository · schema · types · docs · test |
| `src/modules/router.ts` | `05-api` | Where every module router is mounted |
| `prisma/schema.prisma` + `migrations/` | `03-database` | Migrations only — Prisma is never imported at runtime |
| `tests/` · `vitest.config.ts` | — | Test harness, plus a unit test for the connection-string logic |
| `Dockerfile` · `cloudbuild.yaml` · `app.example.yaml` · `dispatch.example.yaml` · `scripts/deploy.sh` | `14-deployment` | Deploy configuration. The `*.example.yaml` files need your project's values |
| `DEPLOY.md` | `14-deployment` | The runbook — read it before your first deploy |
| `.env.example` | all | Every variable, with a fake value and a comment |

---

## The three files to read before writing anything

1. **`src/core/auth/rbac.ts`** — the guard chain. `requireRole` reads `req.user`, which
   only `requireAuth` populates, so it is never a guard on its own.
2. **`src/core/http/app.ts`** — middleware order is execution order. The error handler is
   last, deliberately; mounted earlier it never sees the errors it exists to format.
3. **`src/modules/_template/`** — every feature you build is a copy of this. A codebase
   where every module looks the same is one an agent can extend without being re-taught.

## What is deliberately not here

No auth module, no user table beyond what the schema needs, no features. The guides build
those, and they build them *interviewing you first* — because your roles, your ownership
chain and your sign-in method are yours, not the template's.

`app.example.yaml` and `dispatch.example.yaml` carry placeholder project ids
(`my-project`, `my-instance`). They are examples on purpose. Fill them in; do not commit
the filled-in versions.
