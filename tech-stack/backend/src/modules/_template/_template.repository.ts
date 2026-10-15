/**
 * The ONLY place SQL lives. No business rules, no HTTP.
 *
 * Every function takes an optional executor so it can enlist in a caller's transaction.
 *
 * import { db } from '../../core/db/index.js'
 * import type { Executor } from '../../core/db/index.js'
 * import { takePage, decodeCursor, clampLimit } from '../../core/db/pagination.js'
 * import type { Scope } from '../../shared/roles.js'
 *
 * const COLUMNS = ['id', 'name', 'status', 'createdBy', 'createdAt', 'updatedAt'] as const
 *
 * // Row-level authorization, applied in the WHERE clause — never by filtering in memory.
 * function applyScope<Q>(q: Q, scope: Scope): Q {
 *   switch (scope.kind) {
 *     case 'all':  return q
 *     case 'own':  return (q as any).where('createdBy', '=', scope.userId)
 *     case 'dept': return (q as any).where('departmentId', '=', scope.departmentId)
 *   }
 * }
 *
 * export function findById(id: string, scope: Scope, ex: Executor = db) {
 *   let q = ex.selectFrom('Thing').select(COLUMNS).where('id', '=', id)
 *   q = applyScope(q, scope)
 *   return q.executeTakeFirst()          // undefined when out of scope → service throws 404
 * }
 *
 * // Joins in ONE statement — this is the whole reason for dropping the ORM. No N+1.
 * export function findWithTags(id: string, ex: Executor = db) {
 *   return ex.selectFrom('Thing as t')
 *     .leftJoin('ThingTag as g', 'g.thingId', 't.id')
 *     .select(eb => [
 *       't.id', 't.name', 't.status',
 *       sql<string[]>`coalesce(array_agg(g.label) filter (where g.label is not null), '{}')`.as('tags'),
 *     ])
 *     .where('t.id', '=', id)
 *     .groupBy('t.id')
 *     .executeTakeFirst()
 * }
 *
 * export async function listKeyset(p: { limit: number; cursor?: string; scope: Scope }, ex: Executor = db) {
 *   const limit = clampLimit(p.limit)
 *   let q = ex.selectFrom('Thing').select(COLUMNS)
 *     .orderBy('createdAt', 'desc').orderBy('id', 'desc')
 *     .limit(limit + 1)                  // one extra row tells us whether a next page exists
 *   q = applyScope(q, p.scope)
 *   if (p.cursor) {
 *     const c = decodeCursor(p.cursor)
 *     q = q.where(eb => eb.or([
 *       eb('createdAt', '<', c.createdAt),
 *       eb.and([eb('createdAt', '=', c.createdAt), eb('id', '<', c.id)]),
 *     ]))
 *   }
 *   return takePage(await q.execute(), limit)
 * }
 *
 * export function insert(values: NewThing, ex: Executor = db) {
 *   return ex.insertInto('Thing').values(values).returning(COLUMNS).executeTakeFirstOrThrow()
 * }
 *
 * export function update(id: string, patch: ThingPatch, ex: Executor = db) {
 *   return ex.updateTable('Thing').set({ ...patch, updatedAt: new Date() })
 *     .where('id', '=', id).returning(COLUMNS).executeTakeFirst()
 * }
 */
export {}
