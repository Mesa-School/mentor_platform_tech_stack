import type { Role } from '../core/db/enums.js'

export type { Role }

export const ROLES = ['USER', 'MANAGER', 'ADMIN'] as const satisfies readonly Role[]

/**
 * Roles answer "may you call this endpoint". Scope answers "on which rows".
 * The scope is resolved from the caller's claims and handed to the repository, which turns it
 * into a WHERE clause — filtering in SQL, never in memory.
 */
export type Scope =
  | { kind: 'own'; userId: string }
  | { kind: 'dept'; departmentId: string | null }
  | { kind: 'all' }

export type ScopeSubject = {
  sub: string
  role: Role
  departmentId: string | null
}

/**
 * Default policy. Each feature that needs a different matrix passes its own resource key and
 * extends this switch — keep the whole matrix in one readable place.
 */
export function scopeFor(user: ScopeSubject, _resource: string): Scope {
  switch (user.role) {
    case 'ADMIN':
      return { kind: 'all' }
    case 'MANAGER':
      return { kind: 'dept', departmentId: user.departmentId }
    default:
      return { kind: 'own', userId: user.sub }
  }
}
