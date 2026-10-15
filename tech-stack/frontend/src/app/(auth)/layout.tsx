/**
 * Neutral shell for unauthenticated screens — no sidebar, no topbar.
 *
 * `(auth)` is a route group: the parentheses keep it out of the URL, so this
 * layout applies to /login without adding an /auth segment.
 */
import type { ReactNode } from "react";

import { BrandMark, BuiltByMsl } from "@/components/layout/brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh place-items-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark className="size-10 rounded-xl" />
          <div>
            <p className="font-heading text-lg font-semibold tracking-tight">
              Mesa <span className="text-primary">AI CTO</span>
            </p>
            <p className="mt-1 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              by MSL Team
            </p>
          </div>
        </div>

        {children}

        <BuiltByMsl className="mt-10 text-center" />
      </div>
    </div>
  );
}
