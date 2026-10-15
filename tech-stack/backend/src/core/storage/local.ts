import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { dirname, join, normalize, resolve, sep } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import type { Storage } from './index.js'
import { NotFoundError, ValidationError } from '../errors/index.js'

/** Local-disk adapter for development and tests. Do not use in production. */
export class LocalStorage implements Storage {
  private readonly root: string

  constructor(root: string) {
    this.root = resolve(process.cwd(), root)
  }

  /** Refuses to resolve outside the root — blocks `../` traversal in a caller-supplied key. */
  private pathFor(key: string): string {
    const full = resolve(join(this.root, normalize(key)))
    if (full !== this.root && !full.startsWith(this.root + sep)) {
      throw new ValidationError('Invalid storage key')
    }
    return full
  }

  async put(key: string, body: Buffer | Readable): Promise<{ key: string }> {
    const path = this.pathFor(key)
    await mkdir(dirname(path), { recursive: true })
    const source = Buffer.isBuffer(body) ? Readable.from(body) : body
    await pipeline(source, createWriteStream(path))
    return { key }
  }

  async get(key: string): Promise<Readable> {
    const path = this.pathFor(key)
    const stream = createReadStream(path)
    return new Promise((resolvePromise, reject) => {
      stream.once('open', () => resolvePromise(stream))
      stream.once('error', () => reject(new NotFoundError('File not found')))
    })
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true })
  }

  async signedUrl(key: string): Promise<string> {
    // No signing on local disk — the real adapter returns a presigned URL here.
    return `/files/${encodeURIComponent(key)}`
  }
}
