import { Activity } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";

export const metadata = { title: "Activity" };

export default function AdminActivityPage() {
  return (
    <>
      <PageHeader
        title="Activity"
        description="Full audit log of everything that happened in this workspace."
      />
      <PlaceholderPanel
        icon={Activity}
        title="Activity is not wired up yet"
        description="The dashboard already renders a five-item preview of this feed — this page is its full, filterable view."
        todo={[
          "Create src/features/activity/ by copying src/features/users/",
          "Use useInfiniteQuery for the log — an audit trail is cursor-paginated, not offset-paginated",
          "Move the dashboard's ActivityFeed island onto the real hook once it exists",
          "Add date-range and actor filters through useTableParams",
        ]}
      />
    </>
  );
}
