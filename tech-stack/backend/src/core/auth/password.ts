import argon2 from 'argon2'

/**
 * argon2id is the current recommended default (memory-hard, side-channel resistant).
 * The hash is never logged (pino redacts `*.passwordHash`) and never returned by an endpoint.
 */
export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id })
}

export function verifyPassword(hash: string, plain: string): Promise<boolean> {
  return argon2.verify(hash, plain)
}

/**
 * Run this on a login miss so a nonexistent email costs the same time as a wrong password.
 * Without it, response latency leaks which accounts exist.
 */
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$c29tZS1zYWx0LXZhbHVlcw$b0Y6Fz3d8kZ0mJq1s6Yl7d5v0e2b8kQwR1tS4uV6wX8'

export async function fakeVerify(): Promise<void> {
  try {
    await argon2.verify(DUMMY_HASH, 'not-the-password')
  } catch {
    /* expected — we only want the CPU cost */
  }
}
