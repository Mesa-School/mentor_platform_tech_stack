/**
 * The KPI tile. Build it once, reuse on every overview page — that's what keeps
 * a dashboard looking like one product rather than five.
 *
 * Feed values from a single aggregate endpoint (`/dashboard/summary`), never by
 * fetching rows and reducing them in the browser.
 */
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  /** Signed percentage change vs the previous period, e.g. 12.4 or -3.1. */
  trend?: number;
  /** Context under the value, e.g. "vs. last 30 days". */
  hint?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  hint,
  className,
}: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0;
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className={cn("gap-0 p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
      </div>

      <p className="mt-3 font-heading text-2xl font-semibold tabular-nums">
        {value}
      </p>

      {(trend !== undefined || hint) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium tabular-nums",
                // Semantic, not decorative: green/red carry meaning here, and
                // the arrow icon repeats it for anyone who can't see the hue.
                isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive",
              )}
            >
              <TrendIcon className="size-3" aria-hidden />
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </Card>
  );
}

/** Same footprint as the real tile, so data arriving causes no layout shift. */
export function StatCardSkeleton() {
  return (
    <Card className="gap-0 p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-7 w-16" />
      <Skeleton className="mt-3 h-3 w-28" />
    </Card>
  );
}
