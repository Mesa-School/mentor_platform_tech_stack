/**
 * The single navigation source of truth.
 *
 * The sidebar, the topbar breadcrumb, and (later) the command palette all render
 * from this array — add a nav item here, not in three components. `roles` filters
 * what a user sees; that is a UI convenience, not authorization (the API still
 * enforces access).
 *
 * Adding a second workspace later means adding a `workspace` field and filtering
 * on it too — the shell itself needs no changes.
 */
import {
  Activity,
  BarChart3,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/lib/constants";
import type { Role } from "@/types/enums";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Omit to show for every signed-in role. */
  roles?: readonly Role[];
  /** Match child routes too (`/admin/users/123` keeps `/admin/users` active). */
  matchNested?: boolean;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: ROUTES.adminDashboard,
        icon: LayoutDashboard,
      },
      {
        title: "Analytics",
        href: ROUTES.adminAnalytics,
        icon: BarChart3,
        matchNested: true,
      },
    ],
  },
  {
    title: "Manage",
    items: [
      {
        title: "Users",
        href: ROUTES.adminUsers,
        icon: Users,
        roles: ["admin", "manager"],
        matchNested: true,
      },
      {
        title: "Reports",
        href: ROUTES.adminReports,
        icon: FileText,
        matchNested: true,
      },
      {
        title: "Activity",
        href: ROUTES.adminActivity,
        icon: Activity,
        matchNested: true,
        badge: "New",
      },
    ],
  },
  {
    title: "Workspace",
    items: [
      {
        title: "Settings",
        href: ROUTES.adminSettings,
        icon: Settings,
        roles: ["admin"],
        matchNested: true,
      },
    ],
  },
];

/** Flat list of every nav item — used for breadcrumbs and title lookup. */
export const allNavItems: NavItem[] = navigation.flatMap(
  (section) => section.items,
);

/** Sections a given role may see, with empty sections dropped. */
export function navigationForRole(role: Role | undefined): NavSection[] {
  if (!role) return [];
  return navigation
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || item.roles.includes(role),
      ),
    }))
    .filter((section) => section.items.length > 0);
}

/** Whether a nav item should render as active for the current pathname. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/") return pathname === "/";
  return item.matchNested
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : pathname === item.href;
}

/** The nav item matching the current pathname, for the topbar and breadcrumb. */
export function findNavItem(pathname: string): NavItem | undefined {
  return (
    allNavItems.find((item) => item.href === pathname) ??
    allNavItems.find((item) => pathname.startsWith(`${item.href}/`))
  );
}

/** The section a nav item belongs to — the middle crumb in the breadcrumb. */
export function findNavSection(pathname: string): NavSection | undefined {
  return navigation.find((section) =>
    section.items.some(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    ),
  );
}
