/**
 * DATABASE_URL comes in two shapes and both have to work:
 *
 *   TCP     postgresql://user:pass@34.1.2.3:5432/db?schema=public&sslmode=require
 *   socket  postgresql://user:pass@/db?host=/cloudsql/proj:region:inst
 *
 * The socket form is what App Engine and Cloud Run use, because they have no stable egress IP
 * and reach Cloud SQL through a unix socket instead. Its authority section is EMPTY, which
 * WHATWG `new URL()` rejects outright — so none of this may go through the URL parser.
 */

/** Split a postgres URL into its base and its query parameters, without parsing the authority. */
function splitQuery(url: string): { base: string; params: string[] } {
  const at = url.indexOf('?')
  if (at === -1) return { base: url, params: [] }
  return {
    base: url.slice(0, at),
    params: url.slice(at + 1).split('&').filter(Boolean),
  }
}

/**
 * The URL handed to `pg`, with `sslmode` removed.
 *
 * DATABASE_URL is shared with Prisma, which needs `sslmode=` to negotiate TLS during
 * migrations. `pg` reads the same parameter and (as of pg 8) treats `require` as *full
 * certificate verification*, which then overrides the pool's `ssl` option and fails against a
 * managed instance reached by IP. Stripping it here makes DB_SSL the single source of truth for
 * the runtime connection, while Prisma still reads the untouched value from the environment.
 */
export function runtimeConnectionString(url: string): string {
  const { base, params } = splitQuery(url)
  const kept = params.filter(p => !p.toLowerCase().startsWith('sslmode='))
  return kept.length > 0 ? `${base}?${kept.join('&')}` : base
}

/**
 * A human-readable target for the ops dashboard — never the credentials.
 * Returns `34.1.2.3:5432` for TCP, or `/cloudsql/proj:region:inst` for a unix socket.
 */
export function describeDatabaseTarget(url: string): string {
  const { base, params } = splitQuery(url)

  const socket = params.find(p => p.toLowerCase().startsWith('host='))
  if (socket) return decodeURIComponent(socket.slice('host='.length))

  // Authority is everything between '//' and the path that follows it.
  const afterScheme = base.slice(base.indexOf('//') + 2)
  const authority = afterScheme.split('/')[0] ?? ''
  const hostPort = authority.includes('@') ? authority.slice(authority.lastIndexOf('@') + 1) : authority
  return hostPort || 'unknown host'
}
