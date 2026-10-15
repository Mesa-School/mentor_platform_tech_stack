import { OpenAPIRegistry, OpenApiGeneratorV31, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { service } from '../service.js'

// Adds `.openapi()` to Zod. Must run before any schema that uses it is defined.
extendZodWithOpenApi(z)

/**
 * One registry for the whole service. Each slice registers its own paths next to its Zod
 * schemas (`<feature>.docs.ts`), so the spec is generated from the same schemas that actually
 * validate requests — the docs cannot drift from the behaviour.
 */
export const registry = new OpenAPIRegistry()

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
})

/** Reusable error envelope, referenced by every non-2xx response. */
export const errorResponseSchema = registry.register(
  'ErrorResponse',
  z.object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  })
)

/** Wrap a resource schema in the success envelope. */
export const dataOf = <T extends z.ZodType>(schema: T) => z.object({ data: schema })

/** Wrap a resource schema in the paginated envelope. */
export const pageOf = <T extends z.ZodType>(schema: T) =>
  z.object({
    data: z.array(schema),
    meta: z.object({ nextCursor: z.string().nullable().optional(), total: z.number().optional() }),
  })

export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions)
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: `${service.name} API`,
      version: service.version,
      description: `${service.description} Every success body is \`{ data, meta? }\`; every failure is \`{ error }\`.`,
    },
    servers: [{ url: '/api/v1' }],
  })
}
