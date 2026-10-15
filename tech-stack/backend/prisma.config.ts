import { loadEnvFile } from 'node:process'
import { defineConfig, env } from 'prisma/config'

// Prisma 7 no longer reads .env by itself. Node's built-in loader covers it with no dependency;
// in CI/production the variables are already in the environment, so a missing file is fine.
try {
  loadEnvFile('.env')
} catch {
  /* no .env file - rely on the ambient environment */
}

/**
 * Prisma 7 moved the migration datasource out of `schema.prisma` (a `url` in the datasource
 * block is now a validation error) and into this file. `schema.prisma` still owns the models;
 * this owns *where* the CLI points.
 *
 * The runtime connection is unrelated — the app talks to Postgres through Kysely + pg
 * (src/core/db), and the Prisma Client is never generated or imported.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
    // `migrate dev` needs a throwaway database to detect drift, and a managed instance usually
    // won't grant CREATE DATABASE. Set SHADOW_DATABASE_URL to the local docker-compose Postgres
    // when you want `migrate dev`; without it, use the diff + `migrate deploy` flow (see README).
    ...(process.env.SHADOW_DATABASE_URL ? { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL } : {}),
  },
})
