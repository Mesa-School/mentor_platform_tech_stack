/**
 * `/admin/users` — the reference list page.
 *
 * Server Component. It composes a header and a client island; it does not fetch.
 * `<UsersTable />` reads `useSearchParams` via `useTableParams`, so it sits
 * under a Suspense boundary.
 */
import { UserPlus } from "lucide-react";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { TableSkeleton } from "@/components/shared/state-views";
import { Button } from "@/components/ui/button";
import { UsersTable } from "@/features/users";

export const metadata = { title: "Users" };

export default function AdminUsersPage() {
  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone with access to this workspace, and what they can do."
        actions={
          // Hiding the button is UX. The API still enforces who may invite.
          <RoleGuard allow={["admin"]}>
            <Button>
              <UserPlus data-icon="inline-start" />
              Invite user
            </Button>
          </RoleGuard>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <UsersTable />
      </Suspense>
    </>
  );
}
