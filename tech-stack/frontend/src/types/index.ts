/**
 * The single import surface for global types: `import type { User, Role } from '@/types'`.
 * Never deep-import `@/types/models` from feature code.
 */
export * from "./api";
export * from "./enums";
export * from "./models";

/** Make selected keys of T optional. */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make selected keys of T required. */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

/** A value that may still be loading. */
export type Nullable<T> = T | null | undefined;

/** Async UI state for surfaces not backed by TanStack Query. */
export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };
