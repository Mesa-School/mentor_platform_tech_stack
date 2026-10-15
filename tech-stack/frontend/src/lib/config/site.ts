/**
 * Brand + metadata constants. Change these once when the boilerplate becomes a
 * real product; every title, OG tag, and footer reads from here.
 */
import { env } from "./env";

export const siteConfig = {
  name: env.NEXT_PUBLIC_APP_NAME,
  shortName: "AI CTO",
  description:
    "Production-grade Next.js application scaffold with a typed API layer, JWT auth, and feature-sliced architecture.",
  url: env.NEXT_PUBLIC_APP_URL,
  locale: "en_US",
  themeColor: {
    light: "#ffffff",
    dark: "#0a0a0a",
  },
  links: {
    docs: "/docs",
    support: "mailto:support@example.com",
  },
} as const;

export type SiteConfig = typeof siteConfig;
