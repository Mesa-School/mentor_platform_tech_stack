"use client";

/**
 * Sticky topbar: sidebar trigger, breadcrumb, and global actions.
 *
 * The breadcrumb is derived from `lib/config/navigation.ts`, so it can never
 * disagree with the highlighted sidebar tab.
 *
 * Note: no `backdrop-blur` here. A `backdrop-filter` ancestor creates a
 * containing block that traps `position: fixed` descendants — which breaks
 * dialogs and drawers opened from the topbar. A solid `bg-background` is the
 * safe choice inside a shell whose content already scrolls independently.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { findNavItem, findNavSection } from "@/lib/config/navigation";
import { ROUTES } from "@/lib/constants";

export function AppTopbar() {
  const pathname = usePathname();
  const item = findNavItem(pathname);
  const section = findNavSection(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-1 h-4" />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden sm:block">
            <BreadcrumbLink render={<Link href={ROUTES.adminDashboard} />}>
              Admin
            </BreadcrumbLink>
          </BreadcrumbItem>

          {section && (
            <>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem className="hidden sm:block">
                <span className="text-muted-foreground">{section.title}</span>
              </BreadcrumbItem>
            </>
          )}

          {item && (
            <>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{item.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}
