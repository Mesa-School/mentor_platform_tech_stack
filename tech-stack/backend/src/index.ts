import { config } from './core/config/index.js'
import { logger } from './core/logging/index.js'
import { buildApp } from './core/http/app.js'
import { closeDb } from './core/db/index.js'

/**
 * Bootstrap.
 *
 * Config is validated at import time (a bad env crashes here, not mid-request), the app is
 * built, and the process listens. Shutdown drains in-flight requests before closing the pool
 * so a deploy never severs a transaction.
 */
const app = buildApp()

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT, env: config.NODE_ENV }, 'server listening')
})

// Kubernetes/ALB idle-timeout safety: keepAlive must outlive the proxy's idle timeout,
// and headersTimeout must exceed keepAliveTimeout, or you get sporadic 502s.
server.keepAliveTimeout = 65_000
server.headersTimeout = 66_000

let shuttingDown = false

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'shutting down')

  // Force-exit backstop: if a connection refuses to drain, do not hang the deploy forever.
  const backstop = setTimeout(() => {
    logger.error('graceful shutdown timed out — forcing exit')
    process.exit(1)
  }, 10_000)
  backstop.unref()

  server.close(async err => {
    if (err) logger.error({ err }, 'error closing server')
    try {
      await closeDb()
    } catch (dbErr) {
      logger.error({ err: dbErr }, 'error closing database pool')
    }
    process.exit(err ? 1 : 0)
  })
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

// A crash with an unknown state is not something to keep serving through: log it, then die and
// let the orchestrator restart a clean process.
process.on('unhandledRejection', reason => {
  logger.fatal({ err: reason }, 'unhandled rejection')
  void shutdown('unhandledRejection')
})
process.on('uncaughtException', err => {
  logger.fatal({ err }, 'uncaught exception')
  void shutdown('uncaughtException')
})
