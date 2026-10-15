import { createRequire } from 'node:module'
import { config } from './config/index.js'

/**
 * Service identity in ONE place.
 *
 * Everything that shows a product name — the landing page, the ops dashboard, the Swagger and
 * Redoc titles, the OpenAPI document, the Basic-auth realm — reads from here, and here reads
 * from the environment. Renaming a service is therefore two variables in `.env`, not a
 * find-and-replace across a dozen template literals that will inevitably miss one.
 */

const requireFrom = createRequire(import.meta.url)

/**
 * Version comes from package.json so it can never disagree with the release. The path is the
 * same from `src/core/` in dev and `dist/core/` in a build, because dist mirrors src.
 */
function readVersion(): string {
  try {
    const pkg = requireFrom('../../package.json') as { version?: string }
    return pkg.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

/**
 * Two-character monogram for the logo mark: initials of the first two words, or the first two
 * letters of a single-word name. "Orbit Payments" → "OP", "Nexus" → "NE".
 */
function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'API'
  if (words.length === 1) return (words[0] as string).slice(0, 2).toUpperCase()
  return words
    .slice(0, 2)
    .map(w => (w[0] as string).toUpperCase())
    .join('')
}

export const service = Object.freeze({
  name: config.SERVICE_NAME,
  description: config.SERVICE_DESCRIPTION,
  version: readVersion(),
  monogram: monogram(config.SERVICE_NAME),
})

export type Service = typeof service
