import { FileText } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";

export const metadata = { title: "Reports" };

export default function AdminReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Generated architecture reviews, audits, and exports."
      />
      <PlaceholderPanel
        icon={FileText}
        title="Reports is not wired up yet"
        description="A list page like this one is a straight copy of the users slice — services, hooks, and a table."
        todo={[
          "Create src/features/reports/ by copying src/features/users/",
          "Copy features/users/components/users-table.tsx for the list, with its own columns",
          "Keep sort/search/pagination in the URL via useTableParams so views stay shareable",
          "Render loading, empty, and error states from the query — never just a spinner",
        ]}
      />
    </>
  );
}
