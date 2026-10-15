import { z } from 'zod'

/**
 * Environment is parsed ONCE, at import time. A typo in a variable crashes the process at boot
 * instead of surfacing as an undefined at 3am inside a request handler.
 *
 * Add a new setting here first — nothing in the app should read `process.env` directly.
 */
/** Env values are always strings; treat only an explicit "false"/"0" as false. */
const booleanFromEnv = (fallback: boolean) =>
  z
    .string()
    .default(String(fallback))
    .transform(v => v !== 'false' && v !== '0')

const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  // Service identity. Every user-visible name (landing page, docs titles, OpenAPI info,
  // auth realm) is derived from these — see core/service.ts. Renaming a service is a
  // two-variable change, not a find-and-replace.
  SERVICE_NAME: z.string().min(1).default('My Service'),
  SERVICE_DESCRIPTION: z.string().default('A typed REST API.'),

  DATABASE_URL: z.string().min(1),
  TEST_DATABASE_URL: z.string().min(1).optional(),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  DB_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  // TLS to the database. Managed Postgres (Cloud SQL, RDS, Neon, Supabase) needs 'require'.
  // Supply DB_SSL_CA with the provider's CA bundle to get full certificate verification.
  DB_SSL: z.enum(['disable', 'require', 'verify-full']).default('disable'),
  DB_SSL_CA: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(32, 'must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'must be at least 32 characters'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),

  // Comma-separated allowlist. Never `*` when credentials are sent.
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform(s => s.split(',').map(o => o.trim()).filter(Boolean)),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  // HTTP Basic credentials for /docs, /redoc, /openapi.json and the /health dashboard.
  // Leave unset in development to browse them freely; in production, docs are NOT mounted at
  // all unless both are present (see core/docs) — an unauthenticated API map is a gift to an
  // attacker.
  DOCS_USERNAME: z.string().optional(),
  DOCS_PASSWORD: z.string().optional(),

  STORAGE_DIR: z.string().default('var/uploads'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // ── Google Cloud Storage ───────────────────────────────────────────────────
  // Optional: unset means the local-disk adapter stays in use. On App Engine leave
  // GCS_SERVICE_ACCOUNT_PATH unset — the runtime service account (Application Default
  // Credentials) signs and authorises, and a key file on disk would be a liability.
  GCS_BUCKET_NAME: z.string().optional(),
  GCS_BUCKET_PREFIX: z.string().default(''),
  GCS_PROJECT_ID: z.string().optional(),
  GCS_SERVICE_ACCOUNT_PATH: z.string().optional(),
  // true = the browser PUTs straight to GCS via a presigned URL, instead of streaming the
  // upload through this service. Requires the runtime SA to hold
  // roles/iam.serviceAccountTokenCreator on itself, and bucket CORS to allow the frontend.
  GCS_USE_SIGNED_URLS: booleanFromEnv(false),
  // V4 signing caps the lifetime at 7 days; anything larger is rejected by Google at signing
  // time, so catch it at boot instead of on the first upload.
  GCS_SIGNED_URL_EXPIRATION: z.coerce.number().int().positive().max(604_800, 'max is 604800 (7 days)').default(3600),

  // ── AWS SES (transactional email) ──────────────────────────────────────────
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  SES_FROM_EMAIL: z.string().optional(),

  // ── Azure OpenAI (chat) ────────────────────────────────────────────────────
  // BASE_URL must end in a slash; DEPLOYMENT is an Azure deployment name, never a model id.
  AZURE_OPENAI_CHAT_BASE_URL: z.string().optional(),
  AZURE_OPENAI_CHAT_DEPLOYMENT: z.string().optional(),
  AZURE_OPENAI_CHAT_API_KEY: z.string().optional(),

  // ── Gemini (OpenAI-compatible endpoint, so the same SDK works) ─────────────
  GEMINI_BASE_URL: z.string().default('https://generativelanguage.googleapis.com/v1beta/openai/'),
  GEMINI_MODEL: z.string().default('gemini-3.7-flash'),
  GEMINI_API_KEY: z.string().optional(),
})

const parsed = Env.safeParse(process.env)

if (!parsed.success) {
  // Deliberately console, not the logger — the logger depends on this config.
  console.error('❌ Invalid environment:', z.flattenError(parsed.error).fieldErrors)
  process.exit(1)
}

export const config = Object.freeze(parsed.data)
export type Config = typeof config

export const isProduction = config.NODE_ENV === 'production'
export const isTest = config.NODE_ENV === 'test'

/** Docs and the ops dashboard are password-protected once both credentials are set. */
export const docsAuthEnabled = Boolean(config.DOCS_USERNAME && config.DOCS_PASSWORD)

/**
 * Integrations are optional and each degrades cleanly when its credentials are absent, so a
 * developer can run the service without an AWS or Azure account. Check the flag before
 * constructing a client; never read the raw variables elsewhere.
 */
export const gcsEnabled = Boolean(config.GCS_BUCKET_NAME)
export const sesEnabled = Boolean(config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY && config.SES_FROM_EMAIL)
export const azureChatEnabled = Boolean(
  config.AZURE_OPENAI_CHAT_BASE_URL && config.AZURE_OPENAI_CHAT_DEPLOYMENT && config.AZURE_OPENAI_CHAT_API_KEY
)
export const geminiEnabled = Boolean(config.GEMINI_API_KEY)
