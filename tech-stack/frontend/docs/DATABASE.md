# Talking to a database directly

> **Most projects using this boilerplate should not.** The default is: browser →
> `@/lib/api/client` → a separate backend that owns the database. If you have
> that backend, delete `src/lib/db/` and stop reading.

This is for **Tier 1** — one Next.js app, no separate service, Route Handlers as
the API.

## Choose one

| | Supabase | MongoDB |
| --- | --- | --- |
| Shape | relational, Postgres | documents |
| Migrations | files, applied by the CLI | none — write your own scripts |
| **Authorization** | **Row Level Security, in the database** | **none — your query is the only check** |
| Failure mode | a table with RLS off is world-readable | a `findById` without an owner filter leaks |
| Both fail | **silently** | **silently** |

Installing both is a mistake. Pick one, delete the other directory and its
dependencies.

Full setup: [`../src/lib/db/supabase/README.md`](../src/lib/db/supabase/README.md)
· [`../src/lib/db/mongodb/README.md`](../src/lib/db/mongodb/README.md)

## The difference that actually matters

Not query syntax — **where authorization lives**.

**Supabase.** The anon key ships to every browser by design. That is safe only
because every table has RLS with policies restricting rows to the requesting
user. Your job is a policy per table, proven from a second account. Get it right
and the database catches what you forget.

**MongoDB.** There is no equivalent. Nothing checks ownership except the query
you wrote. Your job is an owner filter in every query, and the structure — all
queries in a repository, `ownerId` a required parameter — is what makes that
auditable.

## The rule for both

**Never query from a Client Component.** These modules are server-only: Server
Components, Route Handlers, Server Actions. The data path does not change:

```
component → hook → service → (Route Handler | Server Component) → db
```

A component importing `@/lib/db/*` is a bug for the same reason a component
calling `fetch` is a bug — it removes the seam where auth, errors and caching are
handled once.

## Migrations

**Supabase:** every schema change is a file in `supabase/migrations/`, created
with the CLI and committed. Never the dashboard SQL editor — a schema that exists
only in production cannot be recreated, reviewed, or rolled back.

**MongoDB:** there are none, and that is not automatically good news. Mongo
accepts a document of any shape, so a renamed field means old and new documents
coexist silently. Write idempotent scripts under `scripts/migrations/` and run
them deliberately. "Schemaless" moves the migration from the database into your
head.

## Before you ship

**Supabase** — run the two queries in its README after **every** migration, then
prove a policy from a second account in a private window.

**MongoDB** — per collection, as user A, attempt to read, update and delete user
B's document. Every one must fail. **Every collection**, not a sample: there is
no policy layer to catch the one you skipped.
