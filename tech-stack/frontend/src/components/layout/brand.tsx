/**
 * Brand marks for Mesa AI CTO.
 *
 * Everything visual about the identity lives here: the logo glyph, the wordmark,
 * and the "built by MSL Team" credit. Change the brand once, and the sidebar,
 * the login screen, the landing page, and the footer all follow.
 */
import Link from "next/link";

import { cn } from "@/lib/utils";

/** The mark: an "M" monogram in a gradient tile. Pure SVG/CSS — no image asset. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
        "bg-gradient-to-br from-primary to-primary/60 text-primary-foreground",
        "shadow-sm ring-1 ring-black/5 dark:ring-white/10",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none">
        <path
          d="M4 19V6.5c0-.6.7-.9 1.1-.4L12 14l6.9-7.9c.4-.5 1.1-.2 1.1.4V19"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function BrandWordmark({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <span className={cn("flex flex-col leading-none", className)}>
      <span className="font-heading text-sm font-semibold tracking-tight">
        Mesa <span className="text-primary">AI CTO</span>
      </span>
      {showTagline && (
        <span className="mt-1 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          by MSL Team
        </span>
      )}
    </span>
  );
}

/** Mark + wordmark, linking home. Use in the sidebar header and auth screens. */
export function Brand({
  href = "/",
  showTagline = false,
  className,
}: {
  href?: string;
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-md outline-none transition-opacity",
        "hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <BrandMark />
      <BrandWordmark showTagline={showTagline} />
    </Link>
  );
}

/** The credit line. Rendered in the app footer and on the landing page. */
export function BuiltByMsl({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Built by{" "}
      <span className="font-medium text-foreground">MSL Team</span>
    </p>
  );
}
