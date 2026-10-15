"use client";

/**
 * Recent activity list. PLACEHOLDER data — replace with a query hook from an
 * `activity` feature slice (see the recipe in the root README).
 */
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/shared/section";
import { initials } from "@/lib/format";

const PLACEHOLDER_ACTIVITY = [
  { actor: "Priya Nair", action: "merged", target: "auth: rotate refresh tokens", at: "12m ago", kind: "merge" },
  { actor: "Sam Okafor", action: "opened", target: "billing: usage metering v2", at: "1h ago", kind: "open" },
  { actor: "Lin Wei", action: "approved", target: "infra: move to spot nodes", at: "3h ago", kind: "approve" },
  { actor: "Diego Alvarez", action: "flagged", target: "api: N+1 on /invoices", at: "5h ago", kind: "flag" },
  { actor: "Priya Nair", action: "deployed", target: "web@2026.8.14", at: "Yesterday", kind: "deploy" },
] as const;

const KIND_VARIANT = {
  merge: "default",
  open: "secondary",
  approve: "secondary",
  flag: "destructive",
  deploy: "outline",
} as const;

export function ActivityFeed({ className }: { className?: string }) {
  return (
    <Section
      title="Recent activity"
      description="Across every connected repository."
      className={className}
      contentClassName="flex flex-col gap-4"
    >
      {PLACEHOLDER_ACTIVITY.map((entry) => (
        <div key={entry.target} className="flex items-start gap-3">
          <Avatar className="size-7 shrink-0">
            <AvatarFallback className="text-[0.625rem]">
              {initials(entry.actor)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug">
              <span className="font-medium">{entry.actor}</span>{" "}
              <span className="text-muted-foreground">{entry.action}</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {entry.target}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge variant={KIND_VARIANT[entry.kind]} className="text-[0.625rem]">
              {entry.action}
            </Badge>
            <span className="text-[0.6875rem] text-muted-foreground">
              {entry.at}
            </span>
          </div>
        </div>
      ))}
    </Section>
  );
}
