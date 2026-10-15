import { randomUUID } from 'node:crypto'
import type { RequestHandler } from 'express'

const HEADER = 'x-request-id'

/**
 * Every request gets an id: reused from the edge/proxy header when present so a trace survives
 * across services, otherwise minted here. Echoed back on the response and attached to the pino
 * child logger, so a user-reported id maps straight to the log line.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.headers[HEADER]
  req.id = (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID()
  res.setHeader(HEADER, req.id)
  next()
}
