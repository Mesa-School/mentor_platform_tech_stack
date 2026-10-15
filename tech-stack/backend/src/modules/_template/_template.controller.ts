/**
 * HTTP only: parse input with Zod, call the service, send the envelope. Nothing else.
 * Express 5 forwards async rejections to the error handler, so no try/catch and no wrapper.
 *
 * import type { Request, Response } from 'express'
 * import { ok, created, paginated } from '../../core/http/response.js'
 * import { createThingBody, updateThingBody, listThingsQuery, thingIdParams } from './_template.schema.js'
 * import * as service from './_template.service.js'
 *
 * export async function create(req: Request, res: Response) {
 *   const body = createThingBody.parse(req.body)
 *   const thing = await service.create(body, req.user!)
 *   created(res, thing)                       // 201 + the full resource
 * }
 *
 * export async function list(req: Request, res: Response) {
 *   const query = listThingsQuery.parse(req.query)
 *   const { items, nextCursor } = await service.list(query, req.user!)
 *   paginated(res, items, { nextCursor })     // meta.nextCursor feeds useInfiniteQuery
 * }
 *
 * export async function getOne(req: Request, res: Response) {
 *   const { id } = thingIdParams.parse(req.params)
 *   ok(res, await service.getById(id, req.user!))
 * }
 *
 * export async function update(req: Request, res: Response) {
 *   const { id } = thingIdParams.parse(req.params)
 *   const patch = updateThingBody.parse(req.body)
 *   ok(res, await service.update(id, patch, req.user!))   // mutations return the resource
 * }
 *
 * export async function activate(req: Request, res: Response) {
 *   const { id } = thingIdParams.parse(req.params)
 *   ok(res, await service.activate(id, req.user!))
 * }
 */
export {}
