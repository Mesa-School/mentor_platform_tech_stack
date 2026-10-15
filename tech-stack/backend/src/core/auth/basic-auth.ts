import { timingSafeEqual } from 'node:crypto'
import type { RequestHandler } from 'express'

/**
 * Constant-time string compare. A plain `===` leaks the length of the matching prefix through
 * timing, which is enough to brute-force a secret character by character.
 */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/**
 * HTTP Basic auth, used to gate the docs and the ops dashboard — pages that describe the whole
 * API surface and its infrastructure, and so should not be world-readable on a private service.
 *
 * This is deliberately NOT the app's auth: it protects static operator surfaces, while API
 * routes use the JWT `requireAuth` guard. Only meaningful over HTTPS — Basic credentials are
 * base64, not encrypted.
 */
export function basicAuth(username: string, password: string, realm = 'Restricted'): RequestHandler {
  return (req, res, next) => {
    const header = req.headers.authorization

    if (!header?.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', `Basic realm="${realm}", charset="UTF-8"`)
      res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } })
      return
    }

    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
    const sep = decoded.indexOf(':')
    if (sep === -1) {
      res.setHeader('WWW-Authenticate', `Basic realm="${realm}", charset="UTF-8"`)
      res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Malformed credentials' } })
      return
    }

    const user = decoded.slice(0, sep)
    const pass = decoded.slice(sep + 1)

    // Both comparisons always run — short-circuiting on the username would leak which half failed.
    const userOk = safeCompare(user, username)
    const passOk = safeCompare(pass, password)

    if (!userOk || !passOk) {
      res.setHeader('WWW-Authenticate', `Basic realm="${realm}", charset="UTF-8"`)
      res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Invalid credentials' } })
      return
    }

    next()
  }
}
