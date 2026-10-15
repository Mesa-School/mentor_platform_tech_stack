import type { Response } from 'express'
import type { PageMeta } from '../../shared/api-response.js'

/**
 * The only place success envelopes are built. Errors are produced exclusively by the central
 * error handler, so there is exactly one shape for each outcome.
 *
 * Mutations return the full, current resource so the client can patch its TanStack Query cache
 * instead of firing a blind refetch.
 */

export function ok<T>(res: Response, data: T): Response {
  return res.status(200).json({ data })
}

export function created<T>(res: Response, data: T): Response {
  return res.status(201).json({ data })
}

export function paginated<T>(res: Response, data: T[], meta: PageMeta): Response {
  return res.status(200).json({ data, meta })
}

/** 202 for work handed to a queue. Prefer returning the resource whenever it exists already. */
export function accepted<T>(res: Response, data: T): Response {
  return res.status(202).json({ data })
}

export function noContent(res: Response): Response {
  return res.status(204).send()
}
