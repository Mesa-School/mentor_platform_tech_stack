# Database

Postgres. **Prisma writes your migrations. Kysely runs your queries. There is no
runtime ORM.**

## Migrations — always files, never a dashboard

```bash
npm run db:migrate        # create + apply in development
npm run db:deploy         # apply in production
npm run db:studio         # browse
```

Every schema change is a **file** under `prisma/migrations/`, committed to git.
Never `prisma db push`, never the hosting provider's SQL editor.

A schema that exists only in production cannot be recreated on a new environment,
cannot be reviewed, and cannot be rolled back. When `migrate` asks an awkward
question, the question is the point — answer it rather than reaching for `push`.

## Two sets of connection variables, deliberately

| | Used by | Why |
| --- | --- | --- |
| `DATABASE_URL` | Prisma, migrations only | A full connection string |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | the runtime pool | In production the app often connects over a unix socket the migration tool cannot use |

Setting one and not the other gives you an app that migrates perfectly and cannot
serve a request. `src/core/db/connection-string.ts` handles the difference, and
has a unit test covering it.

## Queries

All SQL lives in a module's `*.repository.ts`. Controllers and services call
repository functions; nothing else touches the database.

That is what makes "does every query filter by owner?" answerable by reading a
dozen files instead of a hundred.

## Rules

- **Every table**: `id` (uuid), `created_at`, `updated_at`. Soft-deleted tables
  add `deleted_at`, and **every query on them filters it** — in the repository,
  not left to callers. A forgotten filter means deleted rows reappear in exactly
  one screen, usually a report, usually found by a customer.
- **Every foreign key gets an index.** Postgres does not create one for you, and
  the missing index is invisible until a join gets slow in production.
- **Every list query has a `LIMIT`**, with a server-enforced maximum.
- **Ownership goes in the `WHERE` clause**, never applied after fetching.
- **Money is integer minor units** — paise, cents. `0.1 + 0.2` is not `0.3`, and
  your reconciliation will be off by amounts nobody can explain.
- **Timestamps are `timestamptz`, stored UTC.** Plain `timestamp` silently means
  "whatever timezone the server had"; deploy to another region and yesterday's
  data moves.

## Connection pooling

One pool per process, created at module load. Creating a pool inside a request
handler opens connections per request and exhausts Postgres under any real load —
fine in development, `too many connections` under traffic.

Set `DB_POOL_MAX` deliberately: instances × pool size must stay under your
database's limit.

## Generated types

Regenerate **after** migrating, never before:

```bash
npm run db:generate
```

If the schema file lags the live database, generated types lose the missing
tables — and every file using them stops compiling with errors that look like
your bug rather than a stale artefact. Migrate first, generate second, and never
generate to "see if it fixes it".

## Find unindexed foreign keys

```sql
select c.conrelid::regclass as table_name, a.attname as column_name
from pg_constraint c
join unnest(c.conkey) with ordinality as k(attnum, ord) on true
join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
where c.contype = 'f'
  and not exists (
    select 1 from pg_index i
    where i.indrelid = c.conrelid and a.attnum = any(i.indkey)
  );
```

No rows is the goal. Every row returned is a join waiting to get slow.

## Backups

Take one, then **restore it into a scratch database**. A backup you have never
restored is a hypothesis, and the first restore you attempt should not be during
an incident.
