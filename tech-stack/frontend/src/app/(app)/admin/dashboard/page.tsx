/**
 * `/admin/dashboard` — the shape every page in this workspace should have.
 *
 * Server Component. It fetches nothing and owns no components: it composes a
 * header plus client islands imported from feature slices. Copy this file when
 * you add a page.
 */
import { Download } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  ActivityFeed,
  DashboardStats,
  ThroughputChart,
} from "@/features/dashboard";

export const metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Delivery health, review throughput, and open architecture decisions."
        actions={
          <Button variant="outline" size="sm">
            <Download data-icon="inline-start" />
            Export
          </Button>
        }
      />

      <DashboardStats />

      {/* @xl/main / @4xl/main are CONTAINER queries on <main> — the grid reflows
          when the sidebar collapses, which viewport breakpoints can't see. */}
      <div className="grid gap-4 @4xl/main:grid-cols-3">
        <ThroughputChart className="@4xl/main:col-span-2" />
        <ActivityFeed />
      </div>
    </>
  );
}
