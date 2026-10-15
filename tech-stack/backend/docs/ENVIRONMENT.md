# Environment variables

Parsed by a Zod schema in `src/core/config/index.ts` **at boot**. A missing or
malformed required variable calls `process.exit(1)` with the variable named.

That is deliberate: a missing secret should be a failed deploy, not a 500 at 2am
in a code path nobody exercised.

Optional-subsystem config is optional on purpose — a missing AI key disables one
surface rather than taking the API down.

## Copy and fill

```bash
cp .env.example .env
```

`.env.example` carries every variable with a fake value and a comment. No real
value ever enters it.

## Generate the secrets — do not invent them

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Run it twice. `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must be **different
from each other** — reusing one means a refresh token is accepted as an access
token. Both are validated at ≥ 32 bytes.

## Groups

| Group | Variables | Notes |
| --- | --- | --- |
| Service | `NODE_ENV` `PORT` `SERVICE_NAME` `SERVICE_DESCRIPTION` | |
| Database | `DATABASE_URL` `DB_SSL` `DB_POOL_MAX` `DB_STATEMENT_TIMEOUT_MS` `TEST_DATABASE_URL` | `DATABASE_URL` is migrations-only — see `DATABASE.md` |
| Auth | `JWT_ACCESS_SECRET` `JWT_REFRESH_SECRET` `ACCESS_TOKEN_TTL` `REFRESH_TOKEN_TTL` | Secrets ≥ 32 bytes, different from each other |
| HTTP | `CORS_ORIGINS` `RATE_LIMIT_WINDOW_MS` `RATE_LIMIT_MAX` | `CORS_ORIGINS` is an explicit list |
| Docs | `DOCS_USERNAME` `DOCS_PASSWORD` | Gates the status page and API docs |
| Storage | `STORAGE_DIR` `GCS_*` | Local dir in development, bucket in production |
| Email | `AWS_REGION` `AWS_ACCESS_KEY_ID` `AWS_SECRET_ACCESS_KEY` `SES_FROM_EMAIL` | |
| Logging | `LOG_LEVEL` | |
| AI | `AZURE_OPENAI_*` `GEMINI_*` | All optional — a missing key disables one surface |

## CORS

`CORS_ORIGINS` is an explicit, comma-separated list of origins. **Never**
`origin: true` or a reflected origin with credentials enabled — that means any
site can make authenticated requests as your logged-in user. It makes the console
error go away and removes the protection entirely.

## Per environment

- **Separate credentials** for development, preview and production.
- **A preview must never hold production database credentials.** Most hosts copy
  variables to preview deployments by default; set them explicitly before the
  first preview exists.
- Never commit `.env`. Verify: create one, then `git status` — it must not
  appear. Do that before you have anything to lose.

## If a secret was ever committed

Rotate it. Deleting the file removes it from the working tree and leaves it
permanently in git history, which bots scan. Rotation is the fix; history is a
secondary concern.
