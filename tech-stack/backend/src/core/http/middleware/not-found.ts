import type { RequestHandler } from 'express'
import { NotFoundError } from '../../errors/index.js'

/** Registered after all routers, before the error handler, so 404s use the same envelope. */
export const notFound: RequestHandler = req => {
  throw new NotFoundError(`No route for ${req.method} ${req.originalUrl}`)
}
