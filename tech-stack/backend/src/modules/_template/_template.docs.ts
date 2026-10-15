/**
 * OpenAPI registration, kept next to the schemas it documents so the two stay in sync.
 * Imported for its side effect from registerAllDocs() in src/modules/router.ts.
 *
 * import { registry, dataOf, pageOf, errorResponseSchema } from '../../core/docs/registry.js'
 * import { createThingBody, listThingsQuery } from './_template.schema.js'
 * import { thingResponse } from './_template.types.js'
 *
 * registry.registerPath({
 *   method: 'post',
 *   path: '/things',
 *   tags: ['Things'],
 *   summary: 'Create a thing',
 *   security: [{ bearerAuth: [] }],
 *   request: { body: { content: { 'application/json': { schema: createThingBody } } } },
 *   responses: {
 *     201: { description: 'Created', content: { 'application/json': { schema: dataOf(thingResponse) } } },
 *     409: { description: 'Duplicate', content: { 'application/json': { schema: errorResponseSchema } } },
 *     422: { description: 'Validation error', content: { 'application/json': { schema: errorResponseSchema } } },
 *   },
 * })
 *
 * registry.registerPath({
 *   method: 'get',
 *   path: '/things',
 *   tags: ['Things'],
 *   summary: 'List things (cursor paginated)',
 *   security: [{ bearerAuth: [] }],
 *   request: { query: listThingsQuery },
 *   responses: {
 *     200: { description: 'OK', content: { 'application/json': { schema: pageOf(thingResponse) } } },
 *   },
 * })
 */
export {}
