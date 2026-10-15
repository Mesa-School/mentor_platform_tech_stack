import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A route that exists and is navigable but has no feature behind it yet.
 *
 * Deliberately looks unfinished — a placeholder that looks like a real screen
 * gets shipped by accident. `todo` spells out exactly what building it means,
 * so the next person (or agent) can pick it up without asking.
 */
export function PlaceholderPanel({
  title,
  description,
  icon: Icon = Construction,
  todo,
  className,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  /** The concrete steps to replace this with a real feature. */
  todo?: string[];
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "items-center gap-0 border-dashed bg-muted/30 p-10 text-center",
        className,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden />
      </div>

      <h2 className="mt-4 font-heading text-base font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground text-pretty">
        {description}
      </p>

      {todo && todo.length > 0 && (
        <div className="mt-6 w-full max-w-md rounded-lg border bg-card p-4 text-left">
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            To build this
          </p>
          <ol className="mt-3 space-y-2">
            {todo.map((step, index) => (
              <li key={step} className="flex gap-2.5 text-sm">
                <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[0.625rem] text-muted-foreground">
                  {index + 1}
                </span>
                <span className="text-muted-foreground text-pretty">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Card>
  );
}
