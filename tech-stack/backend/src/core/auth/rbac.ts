import type { RequestHandler } from 'express'
import { ForbiddenError, UnauthorizedError } from '../errors/index.js'
import { verifyAccessToken } from './jwt.js'
import type { Role } from '../db/enums.js'
import type { Scope } from '../../shared/roles.js'
import { scopeFor } from '../../shared/roles.js'

function bearer(header: string | undefined): string | null {
  if (!header?.startsWith('Bearer ')) return null
  return header.slice(7).trim() || null
}

/** Rejects with 401 when there is no valid access token. Populates `req.user`. */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = bearer(req.headers.authorization)
  if (!token) return next(new UnauthorizedError())
  try {
    req.user = await verifyAccessToken(token)
    next()
  } catch (err) {
    next(err)
  }
}

/** Populates `req.user` when a valid token is present, but never rejects. For public+personalized routes. */
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const token = bearer(req.headers.authorization)
  if (!token) return next()
  try {
    req.user = await verifyAccessToken(token)
  } catch {
    /* ignore — the route is public */
  }
  next()
}

/** Coarse gate: may this role call this endpoint at all? Always mount after `requireAuth`. */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError())
    if (!roles.includes(req.user.role)) return next(new ForbiddenError())
    next()
  }

/** Allows the resource owner (`:id` matches the caller) or any of the listed roles. */
export const requireSelfOrRole =
  (param: string, ...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError())
    if (req.params[param] === req.user.sub || roles.includes(req.user.role)) return next()
    next(new ForbiddenError())
  }

/**
 * Row-level authorization. Roles say whether you may call the endpoint; the scope says which
 * rows you may see — and it is applied in the SQL WHERE clause, never by filtering in memory.
 *
 * Because scoping lives in the query, an out-of-scope `GET /:id` simply matches no row and the
 * service throws 404. The caller cannot distinguish "doesn't exist" from "not yours", which is
 * the correct non-leaky behaviour.
 */
export function scopeOf(req: { user?: { sub: string; role: Role; departmentId: string | null } }, resource: string): Scope {
  if (!req.user) throw new UnauthorizedError()
  return scopeFor(req.user, resource)
}
