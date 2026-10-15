/** Pagination types shared by every list endpoint. Helpers live in core/db/pagination.ts. */

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

/** Keyset (cursor) pagination — the default for anything that can grow. */
export type CursorParams = {
  limit: number
  cursor?: string | undefined
}

export type CursorPage<T> = {
  items: T[]
  nextCursor: string | null
}

/** Decoded cursor: the sort tuple of the last row on the previous page. */
export type Cursor = {
  createdAt: Date
  id: string
}

/** Offset pagination — bounded admin grids that need page numbers. */
export type OffsetParams = {
  page: number
  pageSize: number
}

export type OffsetPage<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/** Sort keys are always an allowlist resolved to indexed columns — never raw user input. */
export type SortDirection = 'asc' | 'desc'
