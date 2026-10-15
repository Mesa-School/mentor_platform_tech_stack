import type { ErrorRequestHandler } from 'express'
import { z } from 'zod'
import { AppError } from '../../errors/index.js'
import { isProduction } from '../../config/index.js'

/**
 * Registered LAST. The single place an error envelope is produced.
 *
 * Express 5 forwards rejections from async handlers here automatically — no wrapper needed.
 * Anything that is not a known error becomes a bare 500: the details go to the logs, never
 * to the client.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (res.headersSent) return _next(err)

  if (err instanceof z.ZodError) {
    res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: z.flattenError(err) },
    })
    return
  }

  if (err instanceof AppError) {
    // 5xx AppErrors are still our bug — log them with a stack.
    if (err.status >= 500) req.log?.error({ err }, err.code)
    else req.log?.warn({ code: err.code, status: err.status }, err.message)

    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    })
    return
  }

  // Malformed JSON body from express.json()
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { code: 'MALFORMED_JSON', message: 'Request body is not valid JSON' } })
    return
  }

  req.log?.error({ err }, 'unhandled error')
  res.status(500).json({
    error: {
      code: 'INTERNAL',
      message: 'Internal server error',
      ...(isProduction ? {} : { details: err instanceof Error ? err.message : String(err) }),
    },
  })
}
