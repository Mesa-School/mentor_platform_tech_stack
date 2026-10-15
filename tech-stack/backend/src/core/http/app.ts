import express, { type Express, type RequestHandler } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { pinoHttp } from 'pino-http'

import { config, docsAuthEnabled, isProduction } from '../config/index.js'
import { service } from '../service.js'
import { logger } from '../logging/index.js'
import { pingDb } from '../db/index.js'
import { basicAuth } from '../auth/basic-auth.js'
import { mountDocs } from '../docs/index.js'
import { landing, statusJson, healthDashboard } from './landing.js'
import { requestId } from './middleware/request-id.js'
import { defaultRateLimit } from './middleware/rate-limit.js'
import { notFound } from './middleware/not-found.js'
import { errorHandler } from './middleware/error-handler.js'
import { apiRouter, registerAllDocs } from '../../modules/router.js'

/**
 * Requests slower than this are tagged SLOW in the access log. Set well above a healthy
 * in-region request and below what a user would call sluggish, so a latency regression is
 * greppable without having to reproduce it.
 */
const SLOW_REQUEST_MS = 300

/** `req.url` is stripped of the mount path inside a mounted router — originalUrl is the truth. */
const path = (req: { originalUrl?: string; url?: string }) => req.originalUrl ?? req.url ?? '-'

/**
 * The composition root. This is the only file in `core/` allowed to import from `modules/`.
 *
 * Order matters: identity and security before anything reads the request, routers next, and the
 * error handler absolutely last — it is what turns a thrown error into the error envelope.
 *
 * Exported as a factory (not a singleton) so tests can build a fresh app without a live server.
 */
export function buildApp(): Express {
  const app = express()

  // Behind a load balancer / reverse proxy, trust exactly one hop so rate limiting and logs
  // see the real client IP rather than the proxy's.
  if (isProduction) app.set('trust proxy', 1)
  app.disable('x-powered-by')

  // ── observability ─────────────────────────────────────────────────────────
  app.use(requestId)
  app.use(
    pinoHttp({
      logger,
      genReqId: req => req.id,
      // ONE line per request. pino-http's default dumps the entire request and response
      // objects, which buries the signal — everything worth knowing (method, path, status,
      // duration) goes in the message instead, and the serializers below drop the blobs.
      customSuccessMessage: (req, res, responseTime) => {
        const slow = responseTime >= SLOW_REQUEST_MS ? ' SLOW' : ''
        return `${req.method} ${path(req)} ${res.statusCode} ${Math.round(responseTime)}ms${slow}`
      },
      customErrorMessage: (req, res, err) => `${req.method} ${path(req)} ${res.statusCode} — ${err.message}`,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error'
        if (res.statusCode >= 400) return 'warn'
        return 'info'
      },
      serializers: { req: () => undefined, res: () => undefined },
      // Health probes fire constantly and would drown everything else.
      autoLogging: { ignore: req => path(req) === '/healthz' || path(req) === '/readyz' },
    })
  )

  // ── security ──────────────────────────────────────────────────────────────
  app.use(helmet())
  app.use(
    cors({
      origin: config.CORS_ORIGINS.length > 0 ? config.CORS_ORIGINS : false,
      credentials: true, // required for the httpOnly refresh cookie
    })
  )
  app.use(defaultRateLimit)

  // ── body parsing ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' })) // cap the body; an unbounded parser is a DoS vector
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))
  app.use(cookieParser())

  // ── probes (never behind auth: the orchestrator has no credentials) ───────
  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' }) // liveness: the process is up
  })
  app.get('/readyz', async (_req, res) => {
    // readiness: the process can actually serve traffic (the DB answers)
    try {
      await pingDb()
      res.json({ status: 'ready' })
    } catch {
      res.status(503).json({ status: 'not-ready' })
    }
  })
  app.get('/status', statusJson) // public JSON for uptime monitors

  // ── operator surfaces ─────────────────────────────────────────────────────
  const docsGuards: RequestHandler[] = docsAuthEnabled
    ? [basicAuth(config.DOCS_USERNAME as string, config.DOCS_PASSWORD as string, `${service.name} Ops`)]
    : []

  app.get('/', landing) // public status landing
  app.get('/health', ...docsGuards, healthDashboard) // gated ops dashboard
  registerAllDocs() // populate the OpenAPI registry before the document is generated
  mountDocs(app) // /openapi.json, /docs, /redoc — gated by the same credentials

  // ── the API ───────────────────────────────────────────────────────────────
  app.use('/api/v1', apiRouter)

  // ── tail ──────────────────────────────────────────────────────────────────
  app.use(notFound)
  app.use(errorHandler) // MUST be last

  return app
}
