/**
 * Persisted domain entities — the shapes the backend returns.
 *
 * These cross feature boundaries, so they live here rather than in a slice.
 * Transient shapes (form values, view-models, DTOs used by one feature only)
 * belong in `features/<feature>/types.ts` instead.
 *
 * Keep in lockstep with the backend schema. Timestamps are ISO 8601 strings —
 * parse to `Date` at the edge of the UI, never store `Date` in the query cache.
 */
import type { Role, UserStatus } from "./enums";

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
}

/** The authenticated principal — `/auth/me`. */
export interface CurrentUser extends User {
  permissions?: string[];
}

/** Response of `POST /auth/login`. The refresh token arrives as an httpOnly cookie. */
export interface AuthSession {
  accessToken: string;
  /** Seconds until the access token expires. Used to schedule a silent refresh. */
  expiresIn: number;
  user: CurrentUser;
}
