# Architecture

## The request pipeline

```
requestId → logging → helmet → compression → cors → body parsers
          → routers → notFound → errorHandler
```

**Middleware order is execution order.** The error handler is mounted **last**
on purpose: mounted earlier it never sees the errors it exists to format, and
you get the framework's default HTML error page in production — which leaks a
stack trace by default. If you are seeing HTML where you expected JSON, this is
why.

## Vertical slices

```
src/
  core/                cross-cutting, imported by many modules
    auth/              jwt · password · rbac · basic-auth
    audit/             the one function privileged writes call
    config/            Zod env schema, validated at boot
    db/                Kysely instance, pool, connection-string handling
    docs/              OpenAPI registry, Swagger, Redoc
    errors/            AppError hierarchy
    http/              app bootstrap, middleware
    logging/           pino
    storage/           file storage
  modules/<feature>/   ONE SLICE PER FEATURE
    <f>.routes.ts      router: guards + handler wiring only
    <f>.controller.ts  parse input, call service, send response
    <f>.service.ts     business logic — no req/res in here
    <f>.repository.ts  queries — THE ONLY PLACE SQL LIVES
    <f>.schema.ts      Zod schemas for input
    <f>.docs.ts        OpenAPI registration
    <f>.types.ts       types shared within the slice
  shared/              types shared across modules
```

A feature's files live together. Do not create top-level `controllers/`,
`services/` or `types/`.

`src/modules/_template/` is a complete working slice. Every feature is a copy of
it — a codebase where every module looks the same is one an agent can extend
without being re-taught.

## Prisma AND Kysely — why both

**Prisma owns the schema** and generates migration files. It is never imported at
runtime.

**Kysely runs every query** — typed SQL, so you get autocomplete on column names
and compile-time checking, and the SQL that executes is the SQL you wrote. No
hidden joins, no N+1 you cannot see.

If you find yourself importing `@prisma/client` outside a migration script, stop.

## The response envelope

Two shapes, no exceptions:

```ts
{ data: T, meta?: { nextCursor?, total?, page?, pageSize? } }
{ error: { code: string, message: string, details?: unknown } }
```

Status codes carry meaning: 400 malformed · 401 not authenticated · 403 not
allowed · 404 absent *or not yours* · 409 conflict · 422 validation.

`code` is a stable machine string clients branch on. `message` is for a human.

The 500 branch returns a generic message and logs the real error. A raw database
error leaks your table and column names to anyone who triggers one deliberately.

## Guards

```
requireAuth       is there a valid token? populates req.user
requireRole(...)  is this role allowed on this route at all?
```

`requireRole` reads `req.user`, which **only** `requireAuth` populates. It is not
a guard on its own — applied alone it rejects every mutation, which presents as a
permissions bug, while every `GET` on that router has no protection at all.

Every router applies `requireAuth`. Including routers not yet mounted — mounting
one later would otherwise publish it unguarded.

At Tier 3 a third layer is added, `requireResourceAccess`, for scoped
permissions. See that kit's `04-auth` guide.

## Ownership belongs in the query

```ts
rows.filter(r => r.userId === user.sub)   // ❌ the row was already read
```

That is not a permission check. The database returned the row, your query log has
it, and any error path may serialise it. Put the owner in the `WHERE` clause.

## Logging

One structured line per request: method, path, status, duration, request id. The
duration is in the message text as well as a field, and anything above the
threshold is tagged `SLOW` — so a latency regression is greppable without
reproducing it.

Request and response serialisers are **stubbed**, so bodies cannot be logged by
accident. That is by construction, not by remembering.
