# `src/lib/db` — talking to a database directly

> **Most projects using this boilerplate should not touch this folder.**
> The default architecture is: browser → `@/lib/api/client` → a separate backend
> that owns the database. If you have that backend, delete this folder.

This exists for **Tier 1** — one Next.js app, no separate service, where Route
Handlers *are* the API and the database is reached from this app.

## Pick one and delete the other

| | `supabase/` | `mongodb/` |
| --- | --- | --- |
| Shape | relational, Postgres | documents |
| Migrations | files in `supabase/migrations/`, applied by the CLI | none — write your own script |
| **Authorization** | **Row Level Security, enforced by the database** | **none — every query must filter by owner** |
| Sensible when | you want a policy layer catching what you forget | your data genuinely resists a fixed schema |

Installing both is a mistake. Choose, then delete the other directory and its
dependencies from `package.json`.

---

## The difference that actually matters

This is not a preference about query syntax. It is where authorization lives.

**Supabase.** The anon key ships to every visitor's browser *by design*. That is
safe **only** because every table has RLS enabled with policies restricting rows
to the requesting user. With RLS off, that key reads your whole database from a
browser console — no exploit required. Your job is a policy per table, proven
from a second account.

**MongoDB.** There is no equivalent. Nothing checks ownership except the query
you wrote. A `findById` without an owner filter returns another user's document
and nothing objects — no error, no warning, no symptom.

Both are workable. Supabase gives you a backstop; Mongo gives you schema freedom
and asks for more discipline in return.

---

## The rule that applies to both

**Never query the database from a Client Component.** These modules are
server-only — Server Components, Route Handlers and Server Actions. Importing
them into a `"use client"` file either fails the build or ships credentials to
the browser.

The data path stays the same as everywhere else in this app:

```
component → hook → service → (Route Handler | Server Component) → db
```

A component that imports `@/lib/db/*` directly is a bug, for the same reason a
component that calls `fetch` directly is a bug: it removes the seam where auth,
errors and caching are handled once.

---

## Setup

Each subdirectory has its own README with the install command, the environment
variables, and the first thing to verify. Start there:

- [`supabase/README.md`](supabase/README.md)
- [`mongodb/README.md`](mongodb/README.md)

Then follow your kit's `03-database.md` guide, which builds the schema by
interviewing you about your nouns and who owns each one — because that ownership
chain *is* your security model in both cases.
