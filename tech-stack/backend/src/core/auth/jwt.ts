import { SignJWT, jwtVerify } from 'jose'
import { config } from '../config/index.js'
import { UnauthorizedError } from '../errors/index.js'
import type { Role } from '../db/enums.js'

const accessSecret = new TextEncoder().encode(config.JWT_ACCESS_SECRET)
const refreshSecret = new TextEncoder().encode(config.JWT_REFRESH_SECRET)
const ALG = 'HS256'

/**
 * What the access token carries. Role and department live in the claims so authorization
 * needs no database round trip on the hot path — the trade-off is that a role change only
 * takes effect on the next refresh (keep the access TTL short).
 */
export type AuthClaims = {
  sub: string
  role: Role
  departmentId: string | null
}

export type RefreshClaims = {
  sub: string
  /** Token id — persist a HASH of this per session so refresh tokens can be revoked. */
  jti: string
  /** Session family; revoke the whole family when a rotated token is replayed. */
  fam: string
}

export function signAccessToken(claims: AuthClaims): Promise<string> {
  return new SignJWT({ role: claims.role, departmentId: claims.departmentId })
    .setProtectedHeader({ alg: ALG })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(config.ACCESS_TOKEN_TTL)
    .sign(accessSecret)
}

export function signRefreshToken(claims: RefreshClaims): Promise<string> {
  return new SignJWT({ fam: claims.fam })
    .setProtectedHeader({ alg: ALG })
    .setSubject(claims.sub)
    .setJti(claims.jti)
    .setIssuedAt()
    .setExpirationTime(config.REFRESH_TOKEN_TTL)
    .sign(refreshSecret)
}

export async function verifyAccessToken(token: string): Promise<AuthClaims> {
  try {
    const { payload } = await jwtVerify(token, accessSecret, { algorithms: [ALG] })
    return {
      sub: payload.sub as string,
      role: payload.role as Role,
      departmentId: (payload.departmentId as string | null) ?? null,
    }
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshClaims> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret, { algorithms: [ALG] })
    return { sub: payload.sub as string, jti: payload.jti as string, fam: payload.fam as string }
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token')
  }
}

/** Cookie options for the refresh token. httpOnly + SameSite=strict keeps it out of JS and CSRF. */
export const REFRESH_COOKIE = 'refresh_token'

export const refreshCookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}
