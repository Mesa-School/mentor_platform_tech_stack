# Supabase setup

Postgres, auth, and storage — with **Row Level Security as the authorization
layer**. That last part is the whole point and the whole risk.

## 1. Install

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D supabase
```

## 2. Create the project, get the keys

supabase.com → new project → **Project Settings → API**. Three values:

| Value | Goes in | Public? |
| --- | --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | yes |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **yes, by design** |
| `service_role` `secret` key | `SUPABASE_SERVICE_ROLE_KEY` | **never** |

> **Read that table twice.** The anon key is *meant* to ship to browsers — it is
> safe only because RLS restricts what it can read. The service-role key
> **bypasses RLS entirely**. It never gets a `NEXT_PUBLIC_` prefix, never appears
> in a Client Component, and ideally you never set it at all.

## 3. Link the CLI

```bash
npx supabase init
npx supabase link --project-ref <your-project-ref>
```

## 4. Your first migration

```bash
npx supabase migration new init
```

Open `supabase/migrations/00000000000000_example_rls.sql.example` and copy the
pattern: the table, its indexes, `enable row level security`, and a policy per
operation — **all in the same file**. A table is not finished without its
policies.

```bash
npx supabase db reset          # apply locally, from empty
npx supabase db push           # apply to the linked project
```

## 5. Regenerate types — AFTER migrating, never before

```bash
npx supabase gen types typescript --linked > src/lib/db/supabase/database.types.ts
```

Generating against a database you have not just migrated produces types for a
schema you do not have. Correct code then fails to compile and you "fix" working
code.

## 6. Wire session refresh

In `src/proxy.ts`, call `updateSession` from `./middleware`. Return the
`response` object it gives you — see the warning at the top of that file. Not
returning it logs users out at random, on slow connections, never on your
machine.

---

## The files

| File | Client | RLS | Use in |
| --- | --- | --- | --- |
| `client.ts` | anon key | **enforced** | Client Components |
| `server.ts` | anon + user cookies | **enforced** | Server Components, Route Handlers — **the default** |
| `admin.ts` | service role | **bypassed** | almost never; read its header |
| `middleware.ts` | — | — | called from `src/proxy.ts` |
| `database.types.ts` | — | — | generated; do not hand-edit |

## The two queries to run after every migration

```sql
-- 1. RLS on everywhere. Any `false` is a table the internet can read.
select tablename, rowsecurity from pg_tables
where schemaname = 'public' order by rowsecurity, tablename;

-- 2. Every table has a policy. RLS on with NO policy returns zero rows —
--    which looks exactly like a bug in your query.
select t.tablename, count(p.policyname) as policies
from pg_tables t
left join pg_policies p on p.tablename = t.tablename and p.schemaname = 'public'
where t.schemaname = 'public' group by t.tablename order by policies;
```

Then prove it from a second account in a private window. Reading the SQL is not
evidence.

## Verify before you ship

```bash
npm run build && grep -rl "service_role" .next/static
```

Must return nothing. A hit means your entire database is readable by every
visitor, regardless of what your policies say.
