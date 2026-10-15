# Conventions

Rules for anyone — human or agent — adding code to this backend. Your kit's
`AGENTS.md` is the authority; this is the codebase-specific detail.

## Adding a feature

Copy `src/modules/_template/` and rename. You get seven files:

| File | Contains | Must not contain |
| --- | --- | --- |
| `<f>.routes.ts` | guards + handler wiring | logic |
| `<f>.controller.ts` | parse input, call service, send response | SQL, business rules |
| `<f>.service.ts` | business logic | `req` / `res` |
| `<f>.repository.ts` | Kysely queries — **the only place SQL lives** | business rules |
| `<f>.schema.ts` | Zod schemas | |
| `<f>.docs.ts` | OpenAPI registration | |
| `<f>.types.ts` | types local to the slice | |

Then mount it in `src/modules/router.ts`.

## API

- Every response uses the envelope. Two shapes, no exceptions — not even for an
  endpoint you consider special. The first exception is always well-reasoned, and
  within a month there is no contract, only special cases.
- Every list paginates from the first version, with a server-enforced maximum
  page size. A client asking for more gets the maximum, not an error.
- Mutations return the resource they changed, so the client can update its cache.
- Prefer 404 over 403 for a resource the requester should not know exists — a 403
  confirms it exists.

## Validation

Zod, at the controller boundary, before anything else. Body, query **and**
params. Bodies get validated because they are obviously input; query strings get
read directly, and a `pageSize` of `"abc"` becomes `NaN`, a limit of `NaN`
becomes no limit, and one request returns the whole table.

## Auth

- **Every router applies `requireAuth`** — including routers not yet mounted.
- `requireRole` never appears without `requireAuth` before it.
- Guards fail **closed**: no token, unknown role → refuse.
- Ownership is filtered **in the query**.
- Hiding a button is not authorization.

## Errors

- Throw a typed error from `core/errors`. Do not format error responses in a
  handler — there is one error handler and it is mounted last.
- Never return a database error to a client. Log it; return a code and a safe
  message.
- Express 5 forwards rejected promises to the error middleware automatically. Do
  not add your own `try/catch` wrapper — hand-rolled ones usually swallow the
  status.

## Logging

- One line per request; the framework does it.
- **Never** log a password, token, secret, authorization header, signed URL, or
  request body. The serialisers are stubbed so this holds by construction.
- Log user ids, never email addresses.

## Testing

```bash
npm test              # all
npm run test:unit     # no database needed
npm run test:integration
```

Unit tests sit beside the code as `*.unit.test.ts`. Integration tests use
`TEST_DATABASE_URL` — never your development database.

## Do not

- Import `@prisma/client` outside a migration script.
- Put SQL anywhere but a repository.
- Add a dependency without saying what it does and why the standard library or an
  existing dependency will not do.
- Disable a type error with `any` or `@ts-ignore`. Fix the type or ask.
- Commit. You commit; the agent does not.
