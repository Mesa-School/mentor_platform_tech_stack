/**
 * `(app)` — pass-through for every authenticated route, reserved for the session
 * guard. The visual shell belongs to each workspace layout below it
 * (`admin/layout.tsx`), so a second workspace can have different chrome without
 * touching this file.
 *
 * Two layers of gating, on purpose:
 *   `proxy.ts`   runs before render — no flash of a protected page.
 *   `<AuthGate>` runs after the silent refresh settles — handles the case where
 *                the cookie exists but the session is actually dead.
 *
 * Neither is authorization. The API is.
 */
import type { ReactNode } from "react";

import { AuthGate } from "@/components/shared/auth-gate";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
