/**
 * The `/admin/*` workspace shell.
 *
 * Every admin page renders as `children` inside this — pages never add their own
 * sidebar or topbar. `workspace="admin"` applies the `.theme-admin` accent
 * rebinding (see globals.css).
 */
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

export const metadata = {
  title: { default: "Admin", template: "%s · Mesa AI CTO Admin" },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppShell workspace="admin">{children}</AppShell>;
}
