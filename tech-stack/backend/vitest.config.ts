import { defineConfig } from 'vitest/config'

/**
 * Two projects, because they have different needs.
 *
 *   unit         *.unit.test.ts - pure functions, no I/O, no setup. Runs anywhere, instantly.
 *   integration  *.test.ts      - the full HTTP stack against a real Postgres, so it needs
 *                                 migrations applied and a truncate between tests.
 *
 * Splitting them means a contributor with no database can still run `npm run test:unit`, and
 * CI can fail fast on the cheap suite before spinning up a container.
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.unit.test.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          environment: 'node',
          include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
          exclude: ['**/*.unit.test.ts', '**/node_modules/**'],
          setupFiles: ['tests/setup.ts'],
          // One shared Postgres - run serially so tests cannot race on the truncate reset.
          fileParallelism: false,
          maxWorkers: 1,
          hookTimeout: 30_000,
          testTimeout: 30_000,
        },
      },
    ],
  },
})
