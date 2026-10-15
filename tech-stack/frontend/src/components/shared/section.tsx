import type { ReactNode } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A titled panel — the unit dashboard pages are built from. Using this instead
 * of a bare `<Card>` per page keeps title size, spacing, and action placement
 * identical everywhere.
 */
export function Section({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="font-heading text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {/* CardAction is the header's grid slot for trailing controls — it
            right-aligns without fighting the title/description rows. */}
        {actions && (
          <CardAction className="flex gap-2">{actions}</CardAction>
        )}
      </CardHeader>
      <CardContent className={cn(contentClassName)}>{children}</CardContent>
    </Card>
  );
}
