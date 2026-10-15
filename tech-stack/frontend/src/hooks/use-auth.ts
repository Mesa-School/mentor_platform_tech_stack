"use client";

import { useContext } from "react";

import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";

/**
 * Read the current session. Throws if called outside `<Providers>` — a loud
 * failure beats a silent `null` user that renders an empty dashboard.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <Providers>.");
  }
  return context;
}
