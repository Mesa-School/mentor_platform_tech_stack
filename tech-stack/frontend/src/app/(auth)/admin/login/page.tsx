/**
 * `/admin/login` — Server Component page, client island for the form.
 *
 * It lives in the `(auth)` route group (neutral shell, no sidebar) while
 * `/admin/dashboard` lives in `(app)` (the workspace shell). Route groups don't
 * appear in the URL, so both resolve under `/admin/*` while getting completely
 * different chrome — which is exactly why route groups exist.
 *
 * The page itself ships no JS. `<LoginForm />` is the only 'use client' unit,
 * because only it needs state, handlers, and a mutation.
 */
import { Suspense } from "react";

import { LoadingState } from "@/components/shared/state-views";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/features/auth";

export const metadata = { title: "Admin sign in" };

export default function AdminLoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Admin sign in</CardTitle>
        <CardDescription>
          Restricted to workspace administrators.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* LoginForm reads useSearchParams (for ?next=), which must sit under a
            Suspense boundary so the route can still be statically shelled. */}
        <Suspense fallback={<LoadingState className="min-h-52" />}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
