/**
 * App-wide constants. Anything a page, hook, or proxy needs to agree on lives here
 * so there is exactly one source of truth. Never hardcode a route string in a component.
 */
import type { Role } from "@/types/enums";

/**
 * Every internal route the app links to. Add here before you link to it.
 *
 * The admin workspace is namespaced under `/admin/*`. Adding a second workspace
 * later (e.g. `/finance/*`) means adding keys here, entries in
 * `lib/config/navigation.ts`, and a `layout.tsx` under `(app)/<workspace>/` —
 * the shell and nav machinery are already role-driven.
 */
export const ROUTES = {
  home: "/",

  /** Canonical sign-in screen. `proxy.ts` and `<AuthGate>` both redirect here. */
  login: "/admin/login",

  adminRoot: "/admin",
  adminDashboard: "/admin/dashboard",
  adminUsers: "/admin/users",
  adminAnalytics: "/admin/analytics",
  adminReports: "/admin/reports",
  adminActivity: "/admin/activity",
  adminSettings: "/admin/settings",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/** Routes reachable without a session. `proxy.ts` reads this. */
export const PUBLIC_ROUTES: readonly string[] = [
  ROUTES.home,
  ROUTES.login,
] as const;

/** Where a user lands after login, by role. */
export const ROLE_HOME: Record<Role, string> = {
  admin: ROUTES.adminDashboard,
  manager: ROUTES.adminDashboard,
  member: ROUTES.adminDashboard,
};

/** Query-string key used to bounce a user back after login. */
export const REDIRECT_PARAM = "next";

/** Pagination defaults shared by every list query and data table. */
export const PAGINATION = {
  defaultPage: 1,
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
} as const;

/** TanStack Query cache tuning. Override per-hook only with a reason. */
export const QUERY_DEFAULTS = {
  /** How long data is considered fresh before a background refetch. */
  staleTime: 60_000,
  /** How long an unused cache entry survives before garbage collection. */
  gcTime: 5 * 60_000,
  retry: 1,
} as const;

/** Debounce for search inputs that drive a network request. */
export const SEARCH_DEBOUNCE_MS = 300;

/** localStorage / cookie keys. Never inline these strings. */
export const STORAGE_KEYS = {
  theme: "app.theme",
  sidebarState: "sidebar_state",
} as const;
