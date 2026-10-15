"use client";

/**
 * Tabbed settings. Tabs are right here because the panels are cheap and switching
 * should be instant; if a panel needed its own data fetch, it would be a nested
 * route with its own `loading.tsx` instead.
 */
import { Check, Copy } from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";
import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { formatDateTime } from "@/lib/format";
import { ROLE_LABELS } from "@/types/enums";

export function SettingsTabs() {
  return (
    <Tabs defaultValue="account" className="max-w-3xl gap-6">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="workspace">Workspace</TabsTrigger>
      </TabsList>

      <TabsContent value="account">
        <AccountPanel />
      </TabsContent>

      <TabsContent value="appearance">
        <Section
          title="Appearance"
          description="Theme is stored per browser and follows your system by default."
        >
          <ThemeToggle />
        </Section>
      </TabsContent>

      <TabsContent value="workspace">
        <PlaceholderPanel
          title="Workspace settings are not wired up yet"
          description="Name, domain, SSO, and retention policy all belong to an org feature slice."
          todo={[
            "Create src/features/workspace/ with a settings.service.ts and use-workspace.ts",
            "Build the form with react-hook-form + Zod — copy features/auth/components/login-form.tsx",
            "Submit through a mutation; map ApiError.code back onto fields, toast the rest",
          ]}
        />
      </TabsContent>
    </Tabs>
  );
}

function AccountPanel() {
  const { user, isLoading } = useAuth();
  const { copied, copy } = useCopyToClipboard();

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!user) return null;

  const rows = [
    { label: "Name", value: user.name },
    { label: "Email", value: user.email },
    { label: "Role", value: ROLE_LABELS[user.role] },
    { label: "Member since", value: formatDateTime(user.createdAt) },
  ];

  return (
    <Section
      title="Account"
      description="Read-only here — profile edits go through a mutation on the users slice."
      contentClassName="flex flex-col gap-3"
    >
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between border-b pb-3 text-sm last:border-0 last:pb-0"
        >
          <span className="text-muted-foreground">{row.label}</span>
          <span className="font-medium">{row.value}</span>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1 text-sm">
        <span className="text-muted-foreground">User ID</span>
        <Button variant="ghost" size="sm" onClick={() => copy(user.id)}>
          <code className="font-mono text-xs">{user.id}</code>
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
    </Section>
  );
}
