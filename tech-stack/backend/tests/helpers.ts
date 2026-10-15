import { randomUUID } from 'node:crypto'
import { db } from '../src/core/db/index.js'
import { buildApp } from '../src/core/http/app.js'
import { signAccessToken, type AuthClaims } from '../src/core/auth/jwt.js'
import { hashPassword } from '../src/core/auth/password.js'
import type { Role } from '../src/core/db/enums.js'

/** One app instance for the whole suite — supertest drives it in-process, no port is bound. */
export const app = buildApp()

/**
 * Insert a user directly. Seed through the repository/SQL rather than through the API so a
 * broken signup endpoint does not fail every unrelated test.
 */
export async function seedUser(
  overrides: Partial<{ email: string; role: Role; departmentId: string | null; password: string }> = {}
): Promise<AuthClaims & { email: string }> {
  const email = overrides.email ?? `user-${randomUUID()}@example.test`
  const row = await db
    .insertInto('User')
    .values({
      email,
      passwordHash: await hashPassword(overrides.password ?? 'correct-horse-battery-staple'),
      role: overrides.role ?? 'USER',
      departmentId: overrides.departmentId ?? null,
    })
    .returning(['id', 'role', 'departmentId'])
    .executeTakeFirstOrThrow()

  return { sub: row.id, role: row.role, departmentId: row.departmentId, email }
}

/** `Authorization` header value for a seeded user (or any hand-made claims). */
export async function authFor(claims: AuthClaims): Promise<string> {
  return `Bearer ${await signAccessToken(claims)}`
}
