import { readFileSync } from 'node:fs'
import { Kysely, PostgresDialect } from 'kysely'
import type { Transaction } from 'kysely'
import pg from 'pg'
import type { ConnectionOptions } from 'node:tls'
import { config } from '../config/index.js'
import { logger } from '../logging/index.js'
import { runtimeConnectionString } from './connection-string.js'
import type { DB } from './types.js'

/**
 * TLS is configured explicitly rather than left to the connection string, because different
 * versions of pg's parser interpret `sslmode=` differently.
 *
 *   disable      plaintext (local docker-compose)
 *   require      encrypted, certificate NOT verified — the usual setting for a managed
 *                instance reached by IP, where the server cert has no matching hostname
 *   verify-full  encrypted AND verified against DB_SSL_CA — use this once you have the
 *                provider's CA bundle; it is the only mode that stops a MITM
 */
function sslConfig(): boolean | ConnectionOptions {
  switch (config.DB_SSL) {
    case 'disable':
      return false
    case 'require':
      return { rejectUnauthorized: false }
    case 'verify-full':
      if (!config.DB_SSL_CA) throw new Error('DB_SSL=verify-full requires DB_SSL_CA (path to the CA bundle)')
      return { rejectUnauthorized: true, ca: readFileSync(config.DB_SSL_CA, 'utf8') }
  }
}


/**
 * The one database handle for the process.
 *
 * Prisma owns DDL (schema + migrations); Kysely owns every query. The Prisma Client is never
 * imported at runtime — there is no ORM here, just typed SQL over a tuned pool.
 */
const pool = new pg.Pool({
  connectionString: runtimeConnectionString(config.DATABASE_URL),
  max: config.DB_POOL_MAX, // ≈ cores × 2, capped by the DB's connection budget
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  // Stops a runaway query from pinning a connection forever.
  statement_timeout: config.DB_STATEMENT_TIMEOUT_MS,
  ssl: sslConfig(),
})

pool.on('error', err => {
  // Logged, not thrown: an error on an idle client must not take the process down.
  logger.error({ err }, 'idle pg client error')
})

export const db = new Kysely<DB>({ dialect: new PostgresDialect({ pool }) })

/** A `Kysely` instance or an open transaction — repositories accept either so they can enlist. */
export type Db = Kysely<DB>
export type Trx = Transaction<DB>
export type Executor = Db | Trx

/** Readiness probe: cheapest possible round trip that proves the pool and the DB are alive. */
export async function pingDb(): Promise<void> {
  await db.selectFrom('User').select('id').limit(1).execute()
}

export async function closeDb(): Promise<void> {
  await db.destroy()
}

/*
 * Serverless note: a per-instance pool exhausts connections under scale. On Lambda/Edge point
 * DATABASE_URL at a pooler (PgBouncer / Supabase pooler / Prisma Accelerate) and set DB_POOL_MAX=1.
 */
