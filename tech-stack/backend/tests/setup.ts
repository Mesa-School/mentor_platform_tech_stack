import { execSync } from 'node:child_process'
import { afterAll, beforeAll, beforeEach } from 'vitest'

/**
 * Integration tests run against a REAL Postgres (the one in docker-compose, a separate
 * database). Do not mock the database: the whole point of typed raw SQL is the SQL, and a test
 * against a fake DB proves nothing about constraints, transactions, or scoping.
 *
 * Point TEST_DATABASE_URL at that database. It is swapped in as DATABASE_URL *before* anything
 * imports the config, which is why the db module is loaded dynamically below.
 */
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-that-is-at-least-32-chars'
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-that-is-at-least-32-chars'
process.env.CORS_ORIGINS ??= 'http://localhost:3000'
process.env.DB_SSL ??= 'disable'

/**
 * Guard rail. `beforeEach` below TRUNCATEs every table in the target database, so a
 * misconfigured TEST_DATABASE_URL — or simply forgetting to set it, which falls back to
 * DATABASE_URL — would wipe a real database. Refuse to run anywhere but localhost.
 *
 * Set ALLOW_REMOTE_TEST_DB=1 only if you genuinely have a disposable remote test instance.
 */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'postgres', 'db'])
const testHost = new URL(process.env.DATABASE_URL ?? '').hostname

if (!LOCAL_HOSTS.has(testHost) && process.env.ALLOW_REMOTE_TEST_DB !== '1') {
  throw new Error(
    `Refusing to run tests against a non-local database (${testHost}). ` +
      'The suite truncates every table. Point TEST_DATABASE_URL at your local Postgres.'
  )
}

const { db, closeDb } = await import('../src/core/db/index.js')
const { sql } = await import('kysely')

beforeAll(() => {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: 'inherit',
  })
})

beforeEach(async () => {
  // Fast reset between tests: truncate every application table (discovered, so this never
  // needs updating when a slice adds a table), restart identities, cascade FKs.
  const { rows } = await sql<{ tablename: string }>`
    select tablename from pg_tables
    where schemaname = 'public' and tablename not like '\\_prisma%'
  `.execute(db)

  if (rows.length === 0) return
  const list = rows.map(r => `"${r.tablename}"`).join(', ')
  await sql.raw(`TRUNCATE ${list} RESTART IDENTITY CASCADE`).execute(db)
})

afterAll(async () => {
  await closeDb()
})
