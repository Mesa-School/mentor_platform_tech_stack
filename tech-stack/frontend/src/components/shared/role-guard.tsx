"use client";

/**
 * Hide a client subtree from roles that shouldn't see it.
 *
 *   <RoleGuard allow={['admin']}><DeleteButton /></RoleGuard>
 *
 * ⚠️ UI ONLY. Hiding a button is not authorization — the backend's RBAC is.
 * Never use this to "protect" data that was already fetched into the client.
 */
import type { ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";
import { hasAtLeastRole, hasRole } from "@/lib/auth/roles";
import type { Role } from "@/types/enums";

export function RoleGuard({
  allow,
  minimum,
  fallback = null,
  children,
}: {
  /** Exact roles permitted. */
  allow?: readonly Role[];
  /** Or: the least-privileged role permitted (uses ROLE_RANK). */
  minimum?: Role;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) return <>{fallback}</>;

  const permitted = minimum
    ? hasAtLeastRole(user, minimum)
    : allow
      ? hasRole(user, allow)
      : true;

  return permitted ? <>{children}</> : <>{fallback}</>;
}
