import { describe, expect, it } from 'vitest'
import { describeDatabaseTarget, runtimeConnectionString } from './connection-string.js'

// These two forms are the difference between the app booting on App Engine and crashing on
// startup, so they are pinned here rather than discovered during a deploy.
const SOCKET = 'postgresql://app_user:p%40ss@/appdb?host=/cloudsql/proj:asia-south1:inst&schema=public'
const TCP = 'postgresql://app_user:p%40ss@34.1.2.3:5432/appdb?schema=public&sslmode=require'

describe('runtimeConnectionString', () => {
  it('strips sslmode from a TCP url and keeps the rest', () => {
    expect(runtimeConnectionString(TCP)).toBe('postgresql://app_user:p%40ss@34.1.2.3:5432/appdb?schema=public')
  })

  it('handles the Cloud SQL unix-socket form, which WHATWG URL cannot parse', () => {
    expect(runtimeConnectionString(SOCKET)).toBe(SOCKET)
  })

  it('preserves the host= socket parameter when sslmode is also present', () => {
    const input = 'postgresql://u:p@/db?host=/cloudsql/a:b:c&sslmode=require'
    expect(runtimeConnectionString(input)).toBe('postgresql://u:p@/db?host=/cloudsql/a:b:c')
  })

  it('drops the whole query string when sslmode was the only parameter', () => {
    expect(runtimeConnectionString('postgresql://u:p@h:5432/db?sslmode=require')).toBe('postgresql://u:p@h:5432/db')
  })

  it('leaves a url with no query string untouched', () => {
    expect(runtimeConnectionString('postgresql://u:p@h:5432/db')).toBe('postgresql://u:p@h:5432/db')
  })
})

describe('describeDatabaseTarget', () => {
  it('reports host:port for a TCP url', () => {
    expect(describeDatabaseTarget(TCP)).toBe('34.1.2.3:5432')
  })

  it('reports the socket path for a Cloud SQL url', () => {
    expect(describeDatabaseTarget(SOCKET)).toBe('/cloudsql/proj:asia-south1:inst')
  })

  it('never leaks credentials', () => {
    expect(describeDatabaseTarget(TCP)).not.toContain('p%40ss')
    expect(describeDatabaseTarget(TCP)).not.toContain('app_user')
  })
})
