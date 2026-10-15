# AGENTS.md — backend

Read this before writing code. Then read `PRODUCT.md` at the project root for what is
being built and for whom.

---

## Get it running — 5 minutes

```bash
# 1. Node 20 or newer
node --version

# 2. Environment
cp .env.example .env
```

Generate the two JWT secrets — do **not** invent them by typing:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Put them in `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. **They must differ from each
other** — reusing one means a refresh token is accepted as an access token. Both are
validated at ≥ 32 bytes and the app refuses to boot without them.

```bash
# 3. Dependencies — `ci` not `install`, so you get the verified tree
npm ci

# 4. Database
npm run db:migrate

# 5. Run it
npm run dev
```

### Confirm it actually works

```bash
curl localhost:4000/healthz    # {"status":"ok"}      the process is alive
curl localhost:4000/readyz     # {"status":"ready"}   the database answered
```

**If `/healthz` succeeds and `/readyz` returns 503**, the app is running and cannot reach
the database. That distinction is the entire reason there are two endpoints — do not
"fix" it by making `/healthz` check the database.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Watch mode on :4000 |
| `npm run typecheck` | `tsc --noEmit` on source **and** tests |
| `npm run build` | Compile to `dist/` |
| `npm test` | All tests |
| `npm run test:unit` | Unit only — **no database needed** |
| `npm run test:integration` | Uses `TEST_DATABASE_URL`, never your dev database |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run db:migrate` | Create + apply a migration (development) |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:studio` | Browse the database |

**Before you say you are finished:** `npm run typecheck && npm run test:unit`.

---

## The stack — exactly this, no substitutions

Express 5 · TypeScript (ESM) · PostgreSQL · **Prisma for migrations only** · **Kysely for
every query** · Zod · jose · argon2 · pino · Vitest.

**Prisma is never imported at runtime.** It owns the schema and generates migration files.
Every query goes through Kysely — typed SQL, so the SQL that runs is the SQL you wrote,
with no hidden joins and no invisible N+1. If you are importing `@prisma/client` outside a
migration script, stop and ask.

## Layout

```
src/
  core/        cross-cutting: auth · audit · config · db · docs · errors · http · logging · storage
  modules/     ONE VERTICAL SLICE PER FEATURE
    _template/ copy this for every new feature
  shared/      types used across modules
```

Adding a feature = copy `src/modules/_template/`, rename, mount it in
`src/modules/router.ts`. Seven files:

| File | Contains | Must not contain |
| --- | --- | --- |
| `<f>.routes.ts` | guards + wiring | logic |
| `<f>.controller.ts` | parse input, call service, respond | SQL, business rules |
| `<f>.service.ts` | business logic | `req` / `res` |
| `<f>.repository.ts` | Kysely queries — **the only place SQL lives** | business rules |
| `<f>.schema.ts` | Zod schemas | |
| `<f>.docs.ts` | OpenAPI registration | |
| `<f>.types.ts` | slice-local types | |

Do not create top-level `controllers/`, `services/` or `types/` folders.

---

## Rules

### The response envelope — two shapes, no exceptions

```ts
{ data: T, meta?: { nextCursor?, total?, page?, pageSize? } }
{ error: { code: string, message: string, details?: unknown } }
```

Not even for an endpoint you consider special. The first exception is always
well-reasoned; within a month there is no contract, only special cases.

- 400 malformed · 401 not authenticated · 403 not allowed · 404 absent **or not yours** ·
  409 conflict · 422 validation.
- Prefer 404 over 403 where a 403 would confirm the resource exists.
- Every list paginates from the first version, with a server-enforced maximum page size.
- Mutations return the resource they changed.

### Guards

```
requireAuth       is there a valid token? populates req.user
requireRole(...)  is this role allowed on this route at all?
```

- **Every router applies `requireAuth`** — including routers you have not mounted yet.
  Mounting one later would otherwise publish it unguarded.
- **`requireRole` never appears without `requireAuth` before it.** It reads `req.user`,
  which only `requireAuth` populates. Applied alone it rejects every mutation — which
  presents as a permissions bug — while every `GET` on that router has no protection at
  all.
- Guards fail **closed**.

### Ownership belongs in the query

```ts
rows.filter(r => r.userId === user.sub)   // ❌ the row was already read
```

Not a permission check. The database returned it, your query log has it, and any error
path may serialise it. Put the owner in the `WHERE` clause.

### Errors

- Throw a typed error from `core/errors`. Do not format an error response in a handler —
  there is one error handler and it is mounted **last**, deliberately.
- **Never return a database error to a client.** A raw duplicate-key error publishes your
  table and index names to anyone who triggers one on purpose.
- Express 5 forwards rejected promises to the error middleware automatically. Do not add a
  `try/catch` wrapper — hand-rolled ones usually swallow the status.

### Validation

Zod at the controller boundary, before anything else. Body, query **and** params. Query
strings get skipped because they are not obviously input, and a `pageSize` of `"abc"`
becomes `NaN`, a limit of `NaN` becomes no limit, and one request returns the whole table.

### Logging

- One structured line per request. The framework does it.
- **Never** log a password, token, secret, authorization header, signed URL or request
  body. The serialisers are stubbed so this holds by construction — do not un-stub them
  "temporarily to debug".
- Log user ids, never email addresses.

### Secrets

From env, validated at boot. `.env` is gitignored — verify before you have anything to
lose. If one was ever committed, **rotate it**; deleting the file leaves it in history.

---

## How to work with me

1. **Plan before code.** Files you will create, files you will **modify**, and any database
   changes. Then wait for approval.
2. **One module at a time**, verified before the next.
3. **Say what you did not do.** Silent scope reduction is the failure mode I care most
   about.
4. **Never invent data.** If something needs data that does not exist, say so.
5. **Run it before claiming it works.** `npm run typecheck && npm run test:unit`.
6. **Do not commit.** I commit.

## Do not

- Import `@prisma/client` outside a migration script.
- Put SQL anywhere but a repository.
- Use `prisma db push`, or change the schema in a hosting dashboard.
- Add a dependency without saying what it does and why the standard library or an existing
  one will not do.
- Disable a type error with `any` or `@ts-ignore`. Fix the type or ask.

## Known gotchas

- **`DATABASE_URL` is for migrations only.** The runtime pool is built from `DB_HOST`,
  `DB_NAME`, `DB_USER`, `DB_PASSWORD` — in production those often differ, because the app
  connects over a socket the migration tool cannot use. Setting one and not the other gives
  an app that migrates perfectly and cannot serve a request.
- **One pool per process**, created at module load. A pool inside a request handler
  exhausts Postgres under load — fine locally, `too many connections` in production.
- **Middleware order is execution order.** The error handler mounted anywhere but last
  never sees the errors it exists to format.
- **`npm run db:generate` regenerates types from the schema file.** If that file lags the
  live database, tables vanish from the generated types and working code stops compiling.
  Migrate first, generate second.

## More detail

[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/DATABASE.md`](docs/DATABASE.md) ·
[`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) ·
[`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) · [`docs/DEPLOY.md`](docs/DEPLOY.md)
