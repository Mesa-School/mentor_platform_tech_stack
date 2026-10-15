/**
 * Business rules live here — and nowhere else. No `req`, no `res`, no SQL.
 * A plain function, so it is testable without Express and callable from a worker or CLI later.
 *
 * import { db } from '../../core/db/index.js'
 * import { writeAudit } from '../../core/audit/index.js'
 * import { ConflictError, NotFoundError, onUniqueViolation } from '../../core/errors/index.js'
 * import { scopeFor } from '../../shared/roles.js'
 * import * as repo from './_template.repository.js'
 *
 * export async function create(input: CreateThingInput, actor: AuthClaims): Promise<Thing> {
 *   // Uniqueness is a DB constraint (a check-then-insert races); translate the violation.
 *   return onUniqueViolation(
 *     () => repo.insert({ ...input, createdBy: actor.sub }),
 *     'DUPLICATE_THING_NAME',
 *     'A thing with that name already exists'
 *   )
 * }
 *
 * export async function getById(id: string, actor: AuthClaims): Promise<Thing> {
 *   const found = await repo.findById(id, scopeFor(actor, 'thing'))
 *   if (!found) throw new NotFoundError()   // out-of-scope reads 404, not 403 — no existence leak
 *   return found
 * }
 *
 * // A state transition: guard the prior state, then write the change AND the audit atomically.
 * const ALLOWED: Record<Status, Status[]> = {
 *   DRAFT:    ['ACTIVE'],
 *   ACTIVE:   ['ARCHIVED'],
 *   ARCHIVED: [],
 * }
 *
 * export async function activate(id: string, actor: AuthClaims): Promise<Thing> {
 *   const current = await getById(id, actor)
 *   if (!ALLOWED[current.status].includes('ACTIVE')) {
 *     throw new ConflictError('INVALID_STATUS_TRANSITION', 'Only a DRAFT thing can be activated')
 *   }
 *   return db.transaction().execute(async trx => {
 *     const updated = await repo.update(id, { status: 'ACTIVE' }, trx)
 *     if (!updated) throw new NotFoundError()
 *     await writeAudit(
 *       { entityType: 'Thing', entityId: id, action: 'ACTIVATE', actorId: actor.sub },
 *       trx
 *     )
 *     return updated
 *   })
 * }
 */
export {}
