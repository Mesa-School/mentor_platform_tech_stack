"use client";

/**
 * The one client boundary at the root of the tree.
 *
 * Order matters:
 *   Theme  → no dependencies
 *   Query  → must wrap Auth (AuthProvider calls useQueryClient to clear on logout)
 *   Auth   → must wrap anything that reads the session
 *   Toaster→ innermost so toasts render above app content
 *
 * Everything below this is still a Server Component unless it declares 'use client'
 * itself — passing Server Components as `children` keeps them off the client bundle.
 */
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth/auth-context";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster>{children}</Toaster>
          </TooltipProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
