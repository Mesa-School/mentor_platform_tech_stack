import rateLimit from 'express-rate-limit'
import { config, isTest } from '../../config/index.js'

/**
 * Global default. Tighten per route group where it matters — e.g. mount a much smaller limiter
 * on login/refresh/password-reset routes inside that slice's router:
 *
 *   router.post('/login', makeRateLimit({ windowMs: 60_000, limit: 5 }), controller.login)
 *
 * Behind a proxy/load balancer, set `app.set('trust proxy', 1)` (see app.ts) so the client IP
 * is the real one and not the proxy's.
 */
export function makeRateLimit(opts?: { windowMs?: number; limit?: number }) {
  return rateLimit({
    windowMs: opts?.windowMs ?? config.RATE_LIMIT_WINDOW_MS,
    limit: opts?.limit ?? config.RATE_LIMIT_MAX,
    skip: () => isTest, // never rate-limit the test suite
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  })
}

export const defaultRateLimit = makeRateLimit()
