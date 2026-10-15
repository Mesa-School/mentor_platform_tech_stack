/**
 * The shapes this slice returns. Keep them separate from the DB row types: the row is storage,
 * the DTO is contract. Never leak a column you did not mean to expose.
 *
 * import { z } from 'zod'
 *
 * // Zod (not a bare type) so it can also describe the response in the OpenAPI spec.
 * export const thingResponse = z.object({
 *   id: z.uuid(),
 *   name: z.string(),
 *   status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
 *   createdBy: z.uuid(),
 *   createdAt: z.iso.datetime(),
 *   updatedAt: z.iso.datetime(),   // exposed for optimistic concurrency
 * }).openapi('Thing')
 *
 * export type Thing = z.infer<typeof thingResponse>
 */
export {}
