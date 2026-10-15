import type { AuthClaims } from '../auth/jwt.js'

/**
 * One global augmentation for the whole app. `req.user` is populated by `requireAuth`;
 * `req.id` is set by the requestId middleware and picked up by pino-http for correlation.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthClaims
      id: string
    }
  }
}

export {}
