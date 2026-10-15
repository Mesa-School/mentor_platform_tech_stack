# MongoDB setup

Documents, schema freedom — and **no database-level authorization at all**.

> Nothing checks who owns a document except the query you wrote. There is no
> policy layer here. A `findById` without an owner filter returns another user's
> data and nothing objects: no error, no warning, no symptom.
>
> That is the trade for schema flexibility, and it is why this setup leans so
> hard on the repository pattern.

## 1. Install

```bash
npm install mongodb
# optionally, if you want schemas and hooks:
npm install mongoose
```

## 2. Create the cluster

mongodb.com/atlas → free M0 cluster, region nearest your users.

**Database Access** → add a user with a generated password, granted `readWrite`
on **one database**. Not `atlasAdmin`, not `readWriteAnyDatabase` — so a leaked
connection string is bounded.

**Network Access** → Atlas blocks everything by default, and this needs a
deliberate decision:

- **`0.0.0.0/0`** — the common choice, because serverless hosts have no fixed
  egress IPs. Survivable *only* because your connection string is a strong
  credential and your user is scoped to one database.
- **A private endpoint** or your host's Atlas integration, if your plan supports
  it.

Choose now and write down why. Deciding this at midnight during a failing deploy
is how `0.0.0.0/0` gets pasted in next to an admin user.

## 3. Environment

```bash
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=myapp
MONGODB_POOL_MAX=10
```

`MONGODB_URI` contains your password. Server-only, never `NEXT_PUBLIC_`. If you
URL-encoded the password, keep it encoded — a literal `@` or `/` breaks the
string in a way that looks like a network fault.

## 4. Create your indexes

Call `ensureIndexes()` once at setup, or run it from a script. **Every field you
filter on needs an index**, and the ownership index matters most: without it,
every permission-filtered query is a full collection scan — invisible at 50
documents, fatal at 50,000.

## 5. Migrations

There are none, and that is not automatically good news. Mongo will happily
accept a document of any shape, so a renamed field means old and new documents
coexist silently.

When you change a shape, write a script under `scripts/migrations/`, make it
idempotent, and run it deliberately. "Schemaless" moves the migration from the
database to your head.

---

## The files

| File | What it is |
| --- | --- |
| `connect.ts` | The cached connection. **One per process** — read its header |
| `ids.ts` | `toObjectId` / `toIdString` / `sameId`. Use these for every comparison |
| `repository.example.ts` | The pattern to copy per collection |

## The three rules that replace RLS

1. **Every query on user data filters by owner, in the query.** Not after
   fetching — fetch-then-compare means the row was already read and logged.
2. **All queries live in a repository file**, and every read takes `ownerId` as a
   required parameter. That is what makes the rule auditable:

   ```bash
   grep -rn "\.find(\|\.findOne(\|\.updateOne(" src/ | grep -v repository
   # → must return nothing
   ```

3. **Never spread a request body into a query or an update.** A JSON body can
   contain `{"$ne": null}`, and against a login lookup that is an authentication
   bypass. Whitelist fields explicitly; validate with Zod at the boundary.

## The comparison that will catch you

```ts
doc.ownerId === session.user.id   // ALWAYS false — ObjectId is not a string
```

It looks correct. It either denies everyone including the owner, or — written
the other way round — permits everyone. Use `sameId()` from `ids.ts`.

## Verify before you ship

Per collection, as user A, attempt to read, update and delete user B's document.
Every one must fail. Not a sample — **every collection**, because there is no
policy layer to catch the one you skipped.
