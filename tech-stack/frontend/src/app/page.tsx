/**
 * `/` — the project's "it's alive" screen.
 *
 * Deliberately plain: a Server Component shell with two small client islands
 * (`<BackendStatus />`, `<ThemeToggle />`). No hero, no gradient wash — this is
 * a status card, not a marketing page. Replace it with a real landing when the
 * product has something to say; until then it earns its place as a smoke test.
 * If it renders and the health dot is green, the frontend is up AND it can
 * reach the API.
 *
 * Everything here is drawn with theme tokens, so it reads correctly in light
 * and dark without a single conditional.
 */
import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BackendStatus } from "@/components/shared/backend-status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getApiDocsBaseUrl } from "@/lib/config/env";
import { ROUTES } from "@/lib/constants";

export const metadata = { title: "Project initialized" };

const checklist = [
  "Next.js 16 · App Router · React Compiler",
  "Poppins, typed API client, TanStack Query",
  "Admin workspace at /admin/dashboard",
];

export default function LandingPage() {
  const docsBase = getApiDocsBaseUrl();

  return (
    <main className="grid min-h-svh place-items-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <div className="flex flex-col leading-none">
              <span className="font-heading text-sm font-semibold tracking-tight">
                Mesa <span className="text-primary">AI CTO</span>
              </span>
              <span className="mt-1 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                by MSL Team
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <Card className="gap-0 p-6">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[0.6875rem] font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            Project initialized
          </span>

          <h1 className="mt-4 font-heading text-xl font-semibold tracking-tight">
            Your app is running
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
            The boilerplate is set up and serving. Start building in{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.8em]">
              src/features/
            </code>
            .
          </p>

          <ul className="mt-5 space-y-2 border-t pt-5">
            {checklist.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm text-muted-foreground"
              >
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/50"
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button size="sm" render={<Link href={ROUTES.adminDashboard} />}>
              Open dashboard
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              render={
                <a href={`${docsBase}/docs`} target="_blank" rel="noreferrer" />
              }
            >
              <BookOpen data-icon="inline-start" />
              API docs
            </Button>
          </div>
        </Card>

        <div className="mt-4 flex items-center justify-between px-1">
          <BackendStatus />
          <Link
            href={ROUTES.login}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
