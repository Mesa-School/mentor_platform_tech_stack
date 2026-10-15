# 09 · Getting started

Both apps are the AI CTO boilerplate, unchanged. Read each app's own
`README.md` and `AGENTS.md` before writing code: they define the conventions.

## Requirements

- Node.js 20+ (22 recommended)
- Docker, for local Postgres
- Git

## Backend (`tech-stack/backend`)

```bash
cd tech-stack/backend
cp .env.example .env            # then fill in the values below
docker compose up -d            # Postgres 16 (and a test database)
npm install
npm run db:migrate              # applies migrations and generates Kysely types
npm run dev                     # http://localhost:4000
```

Required env vars: `DATABASE_URL`, `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
Generate the secrets with `npm run prepare:env`; use a different value for each.

Useful URLs:
- `http://localhost:4000/docs`: Swagger, generated from the Zod schemas.
- `/redoc`, `/openapi.json`, `/healthz`, `/readyz`.

Checks: `npm run typecheck`, `npm run lint`, `npm test` (unit and integration;
integration tests need the test database from docker compose).

## Frontend (`tech-stack/frontend`)

```bash
cd tech-stack/frontend
cp .env.example .env.local      # NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
npm install
npm run dev                     # http://localhost:3000
```

`NEXT_PUBLIC_AUTH_ENABLED=false` (the default) lets you browse every screen as a
preview user before the auth slice exists. Turn it on once Phase 0 is done.

Checks: `npm run check` (typecheck + lint), `npm run build`.

## Adding the first backend module

Using `mentors` as the example:

1. Copy `src/modules/_template/` to `src/modules/mentors/`, and rename the files
   to `mentors.routes.ts`, `.controller.ts`, `.service.ts`, `.repository.ts`,
   `.schema.ts`, `.docs.ts`, `.types.ts`, `.test.ts`.
2. Add the `Mentor` and `MentorStage` models from
   [03-data-model.md](03-data-model.md) to `prisma/schema.prisma`, then run
   `npm run db:migrate -- --name mentors`.
3. Write the repository (Kysely queries only), the service (rules and audit
   writes) and the controller (Zod parse, then the response helpers).
4. Mount it in `src/modules/router.ts` with `mount("mentors", "/mentors", router)`,
   and import its `.docs.ts` in `registerAllDocs()`. Use a plain side-effect
   import; the commented `await import` examples there don't work in the
   synchronous function.
5. Write integration tests with `tests/helpers.ts` (`seedUser`, `authFor`, supertest `app`).

## Adding the matching frontend feature

1. Create `src/features/mentors/` with `services/`, `hooks/` (TanStack Query),
   `schemas.ts` (Zod), `types.ts`, `components/` and a barrel `index.ts`.
2. Add `mentors` keys to `src/lib/api/query-keys.ts` and endpoints to
   `src/lib/api/endpoints.ts`.
3. Add routes under `src/app/(app)/admin/mentors/` and a nav entry in
   `src/lib/config/navigation.ts`.
4. Every screen handles four states: loading, empty, error and loaded. Never put
   made-up data on a screen.
