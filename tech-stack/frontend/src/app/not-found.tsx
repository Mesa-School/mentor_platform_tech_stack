import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <div className="grid min-h-svh place-items-center px-6">
      <div className="max-w-md text-center">
        <p className="font-heading text-6xl font-semibold tracking-tight text-primary">
          404
        </p>
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          That link doesn&apos;t point anywhere in Mesa AI CTO.
        </p>
        <Button className="mt-6" render={<Link href={ROUTES.home} />}>
          Back to home
        </Button>
      </div>
    </div>
  );
}
