# Deploying to App Engine via Cloud Build

App Engine Standard, Node.js 22. Cloud Build renders `app.yaml` from Secret Manager at deploy
time and runs `gcloud app deploy`; App Engine's buildpack then installs dependencies, runs
`gcp-build` (`tsc`), prunes devDependencies, and starts `node dist/index.js`.

**Never run `gcloud app deploy app.yaml` yourself.** That bypasses Secret Manager, so
`DATABASE_URL` and the JWT secrets arrive empty, Zod rejects them at boot, and every request
502s. `app.yaml` is gitignored for the same reason — the rendered one holds real secrets.

---

## 1. One-time project setup

```bash
PROJECT_ID=my-project
REGION=asia-south1

gcloud config set project "$PROJECT_ID"

gcloud services enable \
  appengine.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com \
  iamcredentials.googleapis.com

# The App Engine application is created ONCE per project and its region is permanent.
# Skip this if the project already has an App Engine app — `gcloud app describe` tells you.
gcloud app create --region="$REGION"
```

## 2. Create the secrets

Four are required. The app will not boot without them.

```bash
create_secret() {            # create_secret <name> <value>
  gcloud secrets create "$1" --replication-policy=automatic 2>/dev/null || true
  printf %s "$2" | gcloud secrets versions add "$1" --data-file=-
}

create_secret backend-database-url        'postgresql://user:PASS@/mydb?host=/cloudsql/proj:region:inst'
create_secret backend-jwt-access-secret   "$(npm run --silent prepare:env)"
create_secret backend-jwt-refresh-secret  "$(npm run --silent prepare:env)"
create_secret backend-docs-password       'a-strong-password'
```

Optional — create them only if you use the integration; otherwise deploy with
`_ALLOW_MISSING_SECRETS=true` and the feature stays off:

```bash
create_secret backend-aws-access-key-id       'AKIA...'
create_secret backend-aws-secret-access-key   '...'
create_secret backend-azure-openai-chat-key   '...'
create_secret backend-gemini-api-key          '...'
```

> `printf %s` matters — `echo` appends a newline, and a trailing `\n` inside a JWT secret or a
> password is invisible in the console and produces authentication failures that look random.

## 3. Grant the two service accounts

**Cloud Build** needs to deploy and to read secrets:

```bash
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
CB_SA="$PROJECT_NUMBER@cloudbuild.gserviceaccount.com"

for role in roles/appengine.deployer roles/appengine.appAdmin \
            roles/cloudbuild.builds.builder roles/iam.serviceAccountUser \
            roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$CB_SA" --role="$role"
done
```

**The App Engine runtime** service account (`$PROJECT_ID@appspot.gserviceaccount.com`) needs
whatever the app itself touches — `roles/cloudsql.client` for the database, and
`roles/storage.objectAdmin` on the bucket if you use GCS:

```bash
RUNTIME_SA="$PROJECT_ID@appspot.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$RUNTIME_SA" --role=roles/cloudsql.client

# Only if GCS_USE_SIGNED_URLS=true — the SA must be able to sign as itself.
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --member="serviceAccount:$RUNTIME_SA" --role=roles/iam.serviceAccountTokenCreator
```

## 4. Choose how the app reaches Postgres

This decides two substitutions and the shape of `DATABASE_URL`. **App Engine has no stable
egress IP**, which is the whole reason the first option exists.

### Option A — Cloud SQL over the unix socket (recommended)

```bash
gcloud sql instances describe <INSTANCE> --format='value(connectionName)'
# -> my-project:asia-south1:my-instance
```

| | |
|---|---|
| `DATABASE_URL` secret | `postgresql://user:PASS@/mydb?host=/cloudsql/my-project:asia-south1:my-instance` |
| `_CLOUDSQL_INSTANCE` | `my-project:asia-south1:my-instance` |
| `_DB_SSL` | `disable` — the socket is already private, there is no TLS to negotiate |

Note the empty authority (`@/mydb`) and the `host=` parameter. URL-encode the password:
`@` → `%40`, `!` → `%21`, `#` → `%23`.

### Option B — TCP to a public IP

Works, but the database must accept connections from an IP range you cannot pin down, so it
usually means authorising `0.0.0.0/0`. Prefer Option A, or put the app behind a Serverless VPC
connector with Cloud NAT to get a fixed egress address.

| | |
|---|---|
| `DATABASE_URL` secret | `postgresql://user:PASS@34.1.2.3:5432/mydb?sslmode=require` |
| `_CLOUDSQL_INSTANCE` | leave empty |
| `_DB_SSL` | `require` (or `verify-full` with `DB_SSL_CA`) |

> Both forms are covered by unit tests — see `src/core/db/connection-string.unit.test.ts`.
> The socket form has an empty authority that `new URL()` cannot parse, which is exactly the
> kind of thing that only surfaces on the first deploy.

## 5. Run migrations — separately, never from the app

App Engine instances start and scale independently; if boot ran migrations you would get
several racing on the same lock. Run them yourself, against a **TCP** URL (the socket only
exists inside App Engine):

```bash
# Local machine, or a one-off Cloud Build step.
DATABASE_URL='postgresql://user:PASS@34.1.2.3:5432/mydb?sslmode=require' \
  npx prisma migrate deploy
```

For a Cloud SQL instance with no public IP, use the Auth Proxy:

```bash
cloud-sql-proxy my-project:asia-south1:my-instance --port 5433 &
DATABASE_URL='postgresql://user:PASS@127.0.0.1:5433/mydb' npx prisma migrate deploy
```

Deploy the app only once migrations are applied — a new build expecting a column that does not
exist yet will fail every request that touches it.

## 6. Deploy

```bash
gcloud builds submit --config cloudbuild.yaml --project="$PROJECT_ID" \
  --substitutions=\
_CLOUDSQL_INSTANCE=my-project:asia-south1:my-instance,\
_CORS_ORIGINS=https://app.example.com,\
_SERVICE_NAME='My Service',\
_DOCS_USERNAME=docs
```

Every other value has a default in `cloudbuild.yaml` — edit the `substitutions:` block there
for anything that should be permanent rather than passed on each deploy.

The build prints each secret's **length**, never its value, and fails if a core secret is
empty. It then echoes the rendered `app.yaml` with every secret masked.

## 7. Verify

This deploys to a **named service** (`_APP_ENGINE_SERVICE`, default `backend`), never to
`default` — deploying to `default` would replace whatever already runs there and take all of its
traffic. A named service has its own URL, versions and scaling:

```bash
BASE="https://backend-dot-$PROJECT_ID.appspot.com"

curl -s  "$BASE/healthz"                      # {"status":"ok"}       process is up
curl -s  "$BASE/readyz"                       # {"status":"ready"}    database answers
curl -s  "$BASE/status"                       # per-dependency JSON
curl -su 'docs:PASSWORD' "$BASE/health"      # full operator dashboard
open     "$BASE/docs"                         # Swagger, behind the same credentials
```

`/readyz` returning 503 means the process booted but cannot reach Postgres — check
`DATABASE_URL` and `_CLOUDSQL_INSTANCE` first. Logs:

```bash
gcloud app logs tail -s backend --project="$PROJECT_ID"
```

Each line is `METHOD /path STATUS ms`, with anything over 300 ms tagged `SLOW`.

---

## Custom domain

A subdomain gets a **CNAME**, not an A record — A/AAAA records only apply to a naked apex
domain. And a domain mapping is app-wide: without a dispatch rule its traffic goes to
`default`, not to this service.

```bash
# 1. The apex domain must be verified once, by whoever owns it.
gcloud domains list-user-verified
gcloud domains verify example.com                # opens Search Console if it is not listed

# 2. Map the subdomain. This prints the DNS records to create.
gcloud app domain-mappings create api.example.com --project="$PROJECT_ID"

# 3. At your DNS provider:  CNAME  api  ->  ghs.googlehosted.com.
#    (An apex domain instead needs the 4 A + 4 AAAA records the command prints.)

# 4. Route the domain to THIS service. Dump the existing rules first and merge —
#    deploying a dispatch.yaml replaces ALL of them.
gcloud app describe --format='yaml(dispatchRules)'
cp dispatch.example.yaml dispatch.yaml     # edit: keep every existing rule
gcloud app deploy dispatch.yaml --project="$PROJECT_ID"

# 5. Managed TLS is automatic but takes ~15-60 minutes after DNS propagates.
gcloud app domain-mappings describe api.example.com --project="$PROJECT_ID"
```

`sslSettings.pendingManagedCertificateId` present means the certificate is still being issued —
`https://` will fail until it clears, while `http://` already works. That wait is normal and is
not a misconfiguration.

---

## Things that will bite you

**`gcp-build` needs devDependencies.** The buildpack installs everything, runs `gcp-build`, and
prunes afterwards — so `typescript` staying in `devDependencies` is correct. Moving it to
`dependencies` just makes every instance carry the compiler.

**`argon2` is a native module.** It ships prebuilt binaries for linux-x64, which is what the
buildpack runs on. If a future version ever lacks one the build will try to compile and fail on
a missing toolchain; the fix is pinning to a version with prebuilds, not adding build tools.

**Commit `src/core/db/types.ts`.** It is generated by `prisma-kysely`, but the App Engine build
never runs `prisma generate` — so the file that ships is whatever is in git. CI typechecks
against it for exactly this reason.

**Connection budget.** `max_instances × DB_POOL_MAX` must stay under the database's limit
(Cloud SQL defaults to 100). The defaults here are 4 × 8 = 32.

**Docs are hidden without credentials.** In production, `/docs`, `/redoc` and `/openapi.json`
are not mounted at all unless `DOCS_USERNAME` and `DOCS_PASSWORD` are both set. If they 404
after a deploy, that is why.

**No WebSockets.** App Engine Standard does not support them. Long-poll or stream over a
regular HTTP response, and keep it inside the 60-second request deadline that
`automatic_scaling` enforces (only `basic`/`manual` scaling allow longer).

**Rollback** is instant, because the previous version is still deployed:

```bash
gcloud app versions list --service=backend --project="$PROJECT_ID"
gcloud app services set-traffic backend --splits=<PREVIOUS_VERSION>=1 --project="$PROJECT_ID"
```
