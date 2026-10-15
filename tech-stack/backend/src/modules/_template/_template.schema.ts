/**
 * Zod schemas — the single definition of what valid input looks like. They validate at the edge
 * AND generate the OpenAPI spec, so the docs can never disagree with the behaviour.
 *
 * import { z } from 'zod'
 *
 * export const thingIdParams = z.object({
 *   id: z.uuid(),
 * })
 *
 * export const createThingBody = z.object({
 *   name: z.string().min(1).max(200),
 *   description: z.string().max(2000).optional(),
 * })
 *
 * // PATCH: every field optional, but require at least one so an empty body is a 422.
 * export const updateThingBody = createThingBody.partial().refine(v => Object.keys(v).length > 0, {
 *   message: 'Provide at least one field to update',
 * })
 *
 * export const listThingsQuery = z.object({
 *   q: z.string().trim().min(1).optional(),
 *   status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
 *   cursor: z.string().optional(),
 *   limit: z.coerce.number().int().min(1).max(100).default(20),
 *   // Allowlist only — resolved to an indexed ORDER BY, never interpolated.
 *   sort: z.enum(['createdAt', '-createdAt', 'name', '-name']).default('-createdAt'),
 * })
 *
 * export type CreateThingInput = z.infer<typeof createThingBody>
 * export type UpdateThingInput = z.infer<typeof updateThingBody>
 * export type ListThingsQuery = z.infer<typeof listThingsQuery>
 */
export {}
