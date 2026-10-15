"use client";

/**
 * The pinned app shell: sidebar + topbar fixed to the viewport, content
 * scrolling ONLY inside the ScrollArea.
 *
 * Two details do all the work, and both are easy to lose in a refactor:
 *
 *  1. `h-svh overflow-hidden` on the provider pins the chrome to the viewport.
 *  2. `min-h-0` on every scrolling flex child. Without it a flex child grows to
 *     its content height, the page scrolls as a whole, and the sidebar and
 *     topbar scroll away with it. This is *the* classic app-shell bug.
 *
 * `workspace` puts a `theme-*` class on the wrapper, which rebinds `--primary`
 * and `--sidebar-primary` (see globals.css). Every component downstream reads
 * those variables, so a second workspace recolors the entire shell with zero
 * per-component branching.
 */
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  workspace = "admin",
}: {
  children: ReactNode;
  workspace?: "admin";
}) {
  return (
    <SidebarProvider className={cn(`theme-${workspace}`, "h-svh overflow-hidden")}>
      <AppSidebar />
      <SidebarInset className="min-h-0 overflow-hidden">
        <AppTopbar />
        <ScrollArea className="min-h-0 flex-1">
          {/* @container/main: page grids use @xl/main: and @4xl/main: so they
              reflow when the SIDEBAR collapses, not just when the viewport
              resizes. Viewport breakpoints are wrong inside a shell. */}
          <main className="@container/main flex flex-col gap-6 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
