import { db } from '../db/index.js'
import type { Executor } from '../db/index.js'

export type AuditEntry = {
  entityType: string
  entityId: string
  /** Verb, past-tense-free and stable: 'CREATE' | 'UPDATE' | 'APPROVE' | 'DELETE' | ... */
  action: string
  actorId?: string | null
  metadata?: Record<string, unknown> | null
}

/**
 * Append an audit row.
 *
 * Pass the surrounding transaction so the audit entry and the change it records commit or roll
 * back together — an audit trail that can disagree with the data is worse than none:
 *
 *   await db.transaction().execute(async trx => {
 *     await trx.updateTable('Thing').set({ status: 'APPROVED' }).where('id', '=', id).execute()
 *     await writeAudit({ entityType: 'Thing', entityId: id, action: 'APPROVE', actorId }, trx)
 *   })
 */
export async function writeAudit(entry: AuditEntry, executor: Executor = db): Promise<void> {
  await executor
    .insertInto('AuditLog')
    .values({
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      actorId: entry.actorId ?? null,
      metadata: (entry.metadata ?? null) as never,
    })
    .execute()
}
