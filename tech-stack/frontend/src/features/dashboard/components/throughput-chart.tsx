"use client";

/**
 * Recharts via shadcn's `chart` wrapper.
 *
 * `ChartContainer` exposes every series in `config` as `var(--color-<key>)`, so
 * the chart recolors with the theme AND the workspace accent automatically —
 * no hardcoded hex, no light/dark branching. The `--chart-*` tokens are tuned
 * for contrast on the card surface; a pale accent line on white is unreadable.
 *
 * Data is PLACEHOLDER — swap for a series returned by the same aggregate
 * endpoint that feeds the stat cards.
 */
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Section } from "@/components/shared/section";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  merged: { label: "Merged", color: "var(--chart-1)" },
  opened: { label: "Opened", color: "var(--chart-2)" },
} satisfies ChartConfig;

const PLACEHOLDER_DATA = [
  { week: "W1", merged: 32, opened: 41 },
  { week: "W2", merged: 45, opened: 48 },
  { week: "W3", merged: 38, opened: 36 },
  { week: "W4", merged: 52, opened: 55 },
  { week: "W5", merged: 61, opened: 58 },
  { week: "W6", merged: 48, opened: 44 },
  { week: "W7", merged: 67, opened: 63 },
  { week: "W8", merged: 72, opened: 69 },
];

export function ThroughputChart({ className }: { className?: string }) {
  return (
    <Section
      title="Review throughput"
      description="Pull requests opened vs. merged, last 8 weeks."
      className={className}
    >
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <AreaChart data={PLACEHOLDER_DATA} margin={{ left: -20, right: 8 }}>
          <defs>
            {/* Gradient fills reference the same var the stroke uses, so the
                fill follows the theme too. */}
            <linearGradient id="fillMerged" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-merged)" stopOpacity={0.45} />
              <stop offset="95%" stopColor="var(--color-merged)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fillOpened" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-opened)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-opened)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />

          <Area
            dataKey="opened"
            type="monotone"
            stroke="var(--color-opened)"
            fill="url(#fillOpened)"
            strokeWidth={2}
          />
          <Area
            dataKey="merged"
            type="monotone"
            stroke="var(--color-merged)"
            fill="url(#fillMerged)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </Section>
  );
}
