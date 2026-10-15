/**
 * Domain enums. Keep these in lockstep with the backend — ideally codegen them
 * from the backend's OpenAPI schema. Use `as const` arrays + derived unions
 * (not TS `enum`) so the values are usable at runtime and erasable at build time.
 */

export const ROLES = ["admin", "manager", "member"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ["active", "invited", "suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

/** Ordered most- to least-privileged. Used by `hasAtLeastRole`. */
export const ROLE_RANK: Record<Role, number> = {
  admin: 3,
  manager: 2,
  member: 1,
};

/** Human-readable labels for UI. Never render a raw enum value. */
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  manager: "Manager",
  member: "Member",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: "Active",
  invited: "Invited",
  suspended: "Suspended",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLES.includes(value as Role);
}
