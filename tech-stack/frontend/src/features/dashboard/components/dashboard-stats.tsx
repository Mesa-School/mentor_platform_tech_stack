"use client";

/**
 * The KPI row.
 *
 * Values are PLACEHOLDER. Replace with a single aggregate query:
 *   const { data, isPending } = useQuery({
 *     queryKey: queryKeys.dashboard.summary(),
 *     queryFn: dashboardService.summary,
 *   })
 * One summary endpoint — never fetch rows and reduce them in the browser.
 */
import { Activity, GitPullRequest, ShieldAlert, Users } from "lucide-react";

import { StatCard, StatCardSkeleton } from "@/components/shared/stat-card";

const PLACEHOLDER_STATS = [
  {
    label: "Open PRs",
    value: 24,
    icon: GitPullRequest,
    trend: 12.4,
    hint: "vs. last week",
  },
  {
    label: "Active engineers",
    value: 18,
    icon: Users,
    trend: 4.2,
    hint: "vs. last week",
  },
  {
    label: "Deploys",
    value: 37,
    icon: Activity,
    trend: -3.1,
    hint: "vs. last week",
  },
  {
    label: "Open incidents",
    value: 2,
    icon: ShieldAlert,
    hint: "1 sev-2, 1 sev-3",
  },
];

export function DashboardStats() {
  // Flip to `useQuery(...).isPending` once the summary endpoint exists.
  const isPending = false;

  return (
    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @4xl/main:grid-cols-4">
      {isPending
        ? Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))
        : PLACEHOLDER_STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
    </div>
  );
}
