import { PageHeader } from "@/components/shared/page-header";
import { SettingsTabs } from "@/features/settings";

export const metadata = { title: "Settings" };

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Your profile, appearance, and workspace preferences."
      />
      <SettingsTabs />
    </>
  );
}
