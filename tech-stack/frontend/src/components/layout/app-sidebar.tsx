"use client";

/**
 * The workspace sidebar. Every tab renders from `lib/config/navigation.ts` —
 * to add a link you edit that config, never this component.
 *
 * The active item gets an accent tint plus a left accent bar, both reading
 * `--sidebar-primary`, so it recolors with the workspace theme automatically.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Brand, BrandMark } from "@/components/layout/brand";
import { NavUser } from "@/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { isNavItemActive, navigationForRole } from "@/lib/config/navigation";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { state } = useSidebar();
  const sections = navigationForRole(user?.role);
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center px-3">
        {/* Wordmark when expanded, mark alone when collapsed to the icon rail. */}
        {isCollapsed ? (
          <Link href="/" className="flex justify-center">
            <BrandMark />
          </Link>
        ) : (
          <Brand />
        )}
      </SidebarHeader>

      <SidebarSeparator className="mx-0" />

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = isNavItemActive(item, pathname);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        className={cn(
                          "relative",
                          active &&
                            "bg-sidebar-primary/10 font-medium text-sidebar-primary hover:bg-sidebar-primary/15 hover:text-sidebar-primary",
                          // Accent bar on the active tab, hidden in the icon rail.
                          active &&
                            "before:absolute before:inset-y-1 before:-left-2 before:w-0.5 before:rounded-full before:bg-sidebar-primary group-data-[collapsible=icon]:before:hidden",
                        )}
                        render={
                          <Link href={item.href}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        }
                      />
                      {item.badge && (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
