#!/usr/bin/env bash
#
# One-command deploy to App Engine.
#
#   bash scripts/deploy.sh                          # dry run: shows everything, changes nothing
#   bash scripts/deploy.sh --apply                  # create/update secrets, then deploy
#   bash scripts/deploy.sh --apply --secrets-only   # just sync Secret Manager
#
# It reads .env, works out the Cloud SQL socket URL that App Engine needs (which is NOT the
# public-IP URL you use locally), pushes every secret to Secret Manager, and submits the Cloud
# Build. Non-secret settings are passed as substitutions so they stay out of Secret Manager.
#
# Requires: gcloud, authenticated (`gcloud auth login`) with a project set.

set -euo pipefail
cd "$(dirname "$0")/.."

APPLY=false
SECRETS_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=true ;;
    --secrets-only) SECRETS_ONLY=true ;;
    *) echo "unknown argument: $arg" >&2; exit 2 ;;
  esac
done

SECRET_PREFIX="${SECRET_PREFIX:-backend}"

say()  { printf '\n\033[1m%s\033[0m\n' "$*"; }
info() { printf '  %s\n' "$*"; }
die()  { printf '\n\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }

# ── .env ─────────────────────────────────────────────────────────────────────
[ -f .env ] || die ".env not found. Copy .env.example and fill it in."

# Read a variable from .env without sourcing it — sourcing would execute anything in there,
# and values legitimately contain '#', '$' and spaces.
env_get() {
  sed -n "s/^$1=//p" .env | head -1 | sed -E 's/[[:space:]]+#.*$//' | sed -E 's/[[:space:]]+$//'
}

DATABASE_URL_LOCAL=$(env_get DATABASE_URL)
[ -n "$DATABASE_URL_LOCAL" ] || die "DATABASE_URL is not set in .env"

# ── gcloud ───────────────────────────────────────────────────────────────────
command -v gcloud >/dev/null || die "gcloud is not installed or not on PATH."

ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | head -1 || true)
[ -n "$ACCOUNT" ] || die "No active gcloud account. Run: gcloud auth login"

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
[ -n "$PROJECT_ID" ] && [ "$PROJECT_ID" != "(unset)" ] || die "No project set. Run: gcloud config set project <PROJECT_ID>"

say "Target"
info "account   $ACCOUNT"
info "project   $PROJECT_ID"

# A stale token fails here rather than halfway through creating secrets.
gcloud projects describe "$PROJECT_ID" --format='value(projectId)' >/dev/null 2>&1 \
  || die "Cannot reach project $PROJECT_ID — your credentials have probably expired. Run: gcloud auth login"

# ── find the Cloud SQL instance behind the local DATABASE_URL ────────────────
# Locally you connect over the public IP; App Engine has no stable egress IP and must use the
# unix socket. Matching on the IP means the connection name is derived, never typed twice.
DB_HOST=$(printf '%s' "$DATABASE_URL_LOCAL" | sed -E 's#^[a-z+]+://[^@]*@##; s#[:/?].*$##')

say "Cloud SQL"
info "local host  $DB_HOST"

CONNECTION_NAME="${CLOUDSQL_INSTANCE:-}"
if [ -z "$CONNECTION_NAME" ]; then
  CONNECTION_NAME=$(gcloud sql instances list --project="$PROJECT_ID" \
    --filter="ipAddresses.ipAddress=$DB_HOST" --format='value(connectionName)' 2>/dev/null | head -1 || true)
fi
[ -n "$CONNECTION_NAME" ] || die "No Cloud SQL instance in $PROJECT_ID has IP $DB_HOST.
  List them:  gcloud sql instances list --project=$PROJECT_ID
  Then re-run with:  CLOUDSQL_INSTANCE=<proj:region:inst> bash scripts/deploy.sh"
info "connection  $CONNECTION_NAME"

# ── build the socket-form URL App Engine will use ────────────────────────────
#   local   postgresql://user:pass@34.1.2.3:5432/db?schema=public&sslmode=require
#   socket  postgresql://user:pass@/db?host=/cloudsql/proj:region:inst&schema=public
# sslmode is dropped: over the socket there is no TLS to negotiate.
DATABASE_URL_SOCKET=$(
  DB_URL="$DATABASE_URL_LOCAL" CONN="$CONNECTION_NAME" python3 - <<'PY' 2>/dev/null || \
  DB_URL="$DATABASE_URL_LOCAL" CONN="$CONNECTION_NAME" python - <<'PY'
import os, re
url, conn = os.environ["DB_URL"], os.environ["CONN"]
head, _, tail = url.partition("://")
auth, _, rest = tail.rpartition("@")
path, _, query = rest.partition("/")[2].partition("?")
params = [p for p in query.split("&") if p and not p.lower().startswith(("sslmode=", "host="))]
params.insert(0, "host=/cloudsql/" + conn)
print(f"{head}://{auth}@/{path}?" + "&".join(params))
PY
)
info "socket url  $(printf '%s' "$DATABASE_URL_SOCKET" | sed -E 's#(//[^:]+:)[^@]+@#\1****@#')"

# ── secrets ──────────────────────────────────────────────────────────────────
# Names must match availableSecrets in cloudbuild.yaml.
declare -a CORE_KEYS=(DATABASE_URL JWT_ACCESS_SECRET JWT_REFRESH_SECRET DOCS_PASSWORD)
declare -a OPT_KEYS=(AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AZURE_OPENAI_CHAT_API_KEY GEMINI_API_KEY)

secret_name() {
  case "$1" in
    DATABASE_URL)              echo "$SECRET_PREFIX-database-url" ;;
    JWT_ACCESS_SECRET)         echo "$SECRET_PREFIX-jwt-access-secret" ;;
    JWT_REFRESH_SECRET)        echo "$SECRET_PREFIX-jwt-refresh-secret" ;;
    DOCS_PASSWORD)             echo "$SECRET_PREFIX-docs-password" ;;
    AWS_ACCESS_KEY_ID)         echo "$SECRET_PREFIX-aws-access-key-id" ;;
    AWS_SECRET_ACCESS_KEY)     echo "$SECRET_PREFIX-aws-secret-access-key" ;;
    AZURE_OPENAI_CHAT_API_KEY) echo "$SECRET_PREFIX-azure-openai-chat-key" ;;
    GEMINI_API_KEY)            echo "$SECRET_PREFIX-gemini-api-key" ;;
  esac
}

secret_value() {
  # DATABASE_URL is the one value that differs between local and App Engine.
  if [ "$1" = "DATABASE_URL" ]; then printf '%s' "$DATABASE_URL_SOCKET"; else env_get "$1"; fi
}

say "Secrets"
MISSING_CORE=()
for key in "${CORE_KEYS[@]}" "${OPT_KEYS[@]}"; do
  value=$(secret_value "$key")
  name=$(secret_name "$key")
  if [ -z "$value" ]; then
    printf '  %-26s %-34s \033[33mEMPTY (skipped)\033[0m\n' "$key" "$name"
    case " ${CORE_KEYS[*]} " in *" $key "*) MISSING_CORE+=("$key") ;; esac
    continue
  fi
  printf '  %-26s %-34s %d chars\n' "$key" "$name" "${#value}"
  if [ "$APPLY" = true ]; then
    gcloud secrets describe "$name" --project="$PROJECT_ID" >/dev/null 2>&1 \
      || gcloud secrets create "$name" --replication-policy=automatic --project="$PROJECT_ID" >/dev/null
    # printf %s, never echo: a trailing newline inside a JWT secret or password is invisible
    # and produces authentication failures that look random.
    printf '%s' "$value" | gcloud secrets versions add "$name" --data-file=- --project="$PROJECT_ID" >/dev/null
  fi
done

[ ${#MISSING_CORE[@]} -eq 0 ] || die "Core secrets missing from .env: ${MISSING_CORE[*]}"

if [ "$APPLY" != true ]; then
  say "Dry run — nothing was changed."
  info "Re-run with --apply to write the secrets and deploy."
fi

[ "$SECRETS_ONLY" = true ] && { say "Secrets only — stopping before deploy."; exit 0; }

# ── substitutions (non-secret) ───────────────────────────────────────────────
CORS_ORIGINS=$(env_get CORS_ORIGINS)
case "$CORS_ORIGINS" in
  *localhost*|"") printf '\n\033[33mwarning:\033[0m CORS_ORIGINS is "%s".\n' "$CORS_ORIGINS"
                  info "That is a development value. Pass the production origin instead:"
                  info "  CORS_ORIGINS=https://app.example.com bash scripts/deploy.sh --apply" ;;
esac

SUBS="_CLOUDSQL_INSTANCE=$CONNECTION_NAME"
SUBS="$SUBS,_DB_SSL=disable"
# Never 'default' — that would replace whatever else runs in this project.
SUBS="$SUBS,_APP_ENGINE_SERVICE=${APP_ENGINE_SERVICE:-backend}"
add_sub() { local v; v=$(env_get "$2"); [ -n "$v" ] && SUBS="$SUBS,$1=$v"; return 0; }
add_sub _SERVICE_NAME SERVICE_NAME
add_sub _SERVICE_DESCRIPTION SERVICE_DESCRIPTION
add_sub _DOCS_USERNAME DOCS_USERNAME
add_sub _LOG_LEVEL LOG_LEVEL
add_sub _GCS_BUCKET_NAME GCS_BUCKET_NAME
add_sub _GCS_BUCKET_PREFIX GCS_BUCKET_PREFIX
add_sub _GCS_PROJECT_ID GCS_PROJECT_ID
add_sub _GCS_USE_SIGNED_URLS GCS_USE_SIGNED_URLS
add_sub _GCS_SIGNED_URL_EXPIRATION GCS_SIGNED_URL_EXPIRATION
add_sub _AWS_REGION AWS_REGION
add_sub _SES_FROM_EMAIL SES_FROM_EMAIL
add_sub _AZURE_OPENAI_CHAT_BASE_URL AZURE_OPENAI_CHAT_BASE_URL
add_sub _AZURE_OPENAI_CHAT_DEPLOYMENT AZURE_OPENAI_CHAT_DEPLOYMENT
add_sub _GEMINI_BASE_URL GEMINI_BASE_URL
add_sub _GEMINI_MODEL GEMINI_MODEL
SUBS="$SUBS,_CORS_ORIGINS=${CORS_ORIGINS_OVERRIDE:-$CORS_ORIGINS}"

say "Deploy"
info "gcloud builds submit --config cloudbuild.yaml --project=$PROJECT_ID \\"
info "  --substitutions=$SUBS"

if [ "$APPLY" != true ]; then exit 0; fi

gcloud builds submit --config cloudbuild.yaml --project="$PROJECT_ID" --substitutions="$SUBS"

SVC="${APP_ENGINE_SERVICE:-backend}"
say "Deployed"
info "https://$SVC-dot-$PROJECT_ID.appspot.com/          landing"
info "https://$SVC-dot-$PROJECT_ID.appspot.com/readyz    should return {\"status\":\"ready\"}"
info "gcloud app logs tail -s $SVC --project=$PROJECT_ID"
