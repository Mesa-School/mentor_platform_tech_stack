/**
 * Role helpers for UI decisions only.
 *
 * IMPORTANT: none of this is a security boundary. The frontend hides buttons and
 * picks workspaces; the backend's RBAC is what actually protects data. Never
 * assume "the button was hidden" means "the endpoint is safe".
 */
import { ROLE_RANK, type Role } from "@/types/enums";
import type { CurrentUser } from "@/types/models";

export function hasRole(
  user: Pick<CurrentUser, "role"> | null | undefined,
  allowed: readonly Role[],
): boolean {
  if (!user) return false;
  return allowed.includes(user.role);
}

/** True when the user's role is at least as privileged as `minimum`. */
export function hasAtLeastRole(
  user: Pick<CurrentUser, "role"> | null | undefined,
  minimum: Role,
): boolean {
  if (!user) return false;
  return ROLE_RANK[user.role] >= ROLE_RANK[minimum];
}

export function hasPermission(
  user: CurrentUser | null | undefined,
  permission: string,
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.permissions?.includes(permission) ?? false;
}
