import type { Readable } from 'node:stream'
import { config } from '../config/index.js'
import { LocalStorage } from './local.js'

/**
 * The storage port. Application code depends on this interface only, so swapping the local-disk
 * adapter for S3/GCS/R2 later is a one-line change in this file — no feature code moves.
 */
export interface Storage {
  put(key: string, body: Buffer | Readable, contentType?: string): Promise<{ key: string }>
  get(key: string): Promise<Readable>
  delete(key: string): Promise<void>
  /** Time-limited URL for direct download. The local adapter returns a plain app-served path. */
  signedUrl(key: string, expiresInSeconds?: number): Promise<string>
}

export type { Readable }

/**
 * The process-wide instance. Replace the right-hand side with an S3Storage adapter in
 * production — nothing else in the codebase needs to know.
 */
export const storage: Storage = new LocalStorage(config.STORAGE_DIR)
