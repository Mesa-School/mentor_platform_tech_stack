import { pino } from 'pino'
import { config, isProduction, isTest } from '../config/index.js'

/**
 * Structured JSON logs in production (queryable), pretty-printed in dev.
 * `redact` is not optional polish — credentials must never reach the log sink.
 */
export const logger = pino({
  level: isTest ? 'silent' : config.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.accessToken',
      '*.refreshToken',
      '*.secret',
    ],
    censor: '[redacted]',
  },
  // Dev prints one readable line per request. `ignore` drops the pieces pino-http attaches
  // automatically — the full request/response objects and the raw duration — because the
  // access-log message already carries method, path, status and ms.
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname,req,res,responseTime,reqId',
            messageFormat: '{msg}',
            singleLine: true,
          },
        },
      }),
})

export type Logger = typeof logger
