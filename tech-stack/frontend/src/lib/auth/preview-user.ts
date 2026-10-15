import type { CurrentUser } from "@/types/models";

/**
 * The stand-in principal used while `NEXT_PUBLIC_AUTH_ENABLED=false`.
 *
 * Without it the shell has no `user`, so the sidebar renders no tabs and the
 * user menu disappears — the app would look broken rather than unauthenticated.
 * With it, every screen is browsable before a backend exists.
 *
 * Role is `admin` so all nav tabs and `<RoleGuard>`-ed controls are visible.
 * This is never used once auth is enabled; it exists purely for local preview,
 * and grants nothing — the API has no idea this user exists.
 */
export const PREVIEW_USER: CurrentUser = {
  id: "preview-user",
  name: "Preview Admin",
  email: "preview@mesa.local",
  role: "admin",
  status: "active",
  avatarUrl: null,
  lastLoginAt: new Date(0).toISOString(),
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};
