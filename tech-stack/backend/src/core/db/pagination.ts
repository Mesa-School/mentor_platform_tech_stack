import type { Cursor, OffsetParams } from '../../shared/pagination.js'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../shared/pagination.js'
import { ValidationError } from '../errors/index.js'

/**
 * Keyset (cursor) pagination helpers.
 *
 * Prefer keyset for any list that can grow: it stays O(1) as the table grows, while OFFSET
 * scans and discards everything before the page. Reserve offset for bounded admin grids.
 *
 * The cursor encodes the sort tuple of the last row on the previous page — with the standard
 * ordering `ORDER BY "createdAt" DESC, "id" DESC` that tuple is (createdAt, id), which is
 * unique and therefore a stable resume point.
 */

export function encodeCursor(row: Cursor): string {
  const createdAt = row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt)
  return Buffer.from(`${createdAt}|${row.id}`, 'utf8').toString('base64url')
}

export function decodeCursor(cursor: string): Cursor {
  const [createdAt, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|')
  const at = createdAt ? new Date(createdAt) : new Date(Number.NaN)
  if (!id || Number.isNaN(at.getTime())) throw new ValidationError('Malformed cursor')
  return { createdAt: at, id }
}

export function clampLimit(limit?: number): number {
  if (!limit) return DEFAULT_PAGE_SIZE
  return Math.min(Math.max(1, Math.trunc(limit)), MAX_PAGE_SIZE)
}

/**
 * Fetch `limit + 1` rows, then call this: it trims the extra row and tells you whether there
 * is a next page without a second COUNT query.
 */
export function takePage<T extends Cursor>(rows: T[], limit: number): { items: T[]; nextCursor: string | null } {
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const last = items.at(-1)
  return { items, nextCursor: hasMore && last ? encodeCursor(last) : null }
}

export function offsetOf({ page, pageSize }: OffsetParams): number {
  return (Math.max(1, page) - 1) * pageSize
}

/**
 * Resolve a client-supplied sort token against an allowlist of indexed columns.
 * Never interpolate a raw sort string into SQL.
 */
export function resolveSort<TAllowed extends string>(
  sort: string | undefined,
  allowed: readonly TAllowed[],
  fallback: { column: TAllowed; direction: 'asc' | 'desc' }
): { column: TAllowed; direction: 'asc' | 'desc' } {
  if (!sort) return fallback
  const direction = sort.startsWith('-') ? 'desc' : 'asc'
  const column = (sort.startsWith('-') ? sort.slice(1) : sort) as TAllowed
  if (!allowed.includes(column)) throw new ValidationError(`Unsupported sort: ${sort}`)
  return { column, direction }
}
