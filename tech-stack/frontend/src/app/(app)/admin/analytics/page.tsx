import { BarChart3 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";

export const metadata = { title: "Analytics" };

export default function AdminAnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Cycle time, review latency, and delivery trends across teams."
      />
      <PlaceholderPanel
        icon={BarChart3}
        title="Analytics is not wired up yet"
        description="The route, nav tab, and shell are in place. What's missing is the feature slice behind it."
        todo={[
          "Create src/features/analytics/ by copying src/features/users/",
          "Add the endpoints to lib/api/endpoints.ts and a key block to lib/api/query-keys.ts",
          "Write analytics.service.ts (plain async, no React), then use-analytics.ts on top of it",
          "Replace this panel with charts — copy the ThroughputChart pattern from the dashboard",
        ]}
      />
    </>
  );
}
