import type { Metadata, Viewport } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";

import { Providers } from "@/providers";
import { siteConfig } from "@/lib/config/site";
import "./globals.css";

/**
 * Poppins is the global typeface.
 *
 * `next/font` self-hosts it at build time: no request to fonts.googleapis.com at
 * runtime, no layout shift from a late swap, and no privacy hop to Google.
 * Poppins is not a variable font, so the weights must be listed explicitly —
 * keep this list tight, every weight is another file to download.
 *
 * The `variable` option exposes it as `--font-poppins`; `globals.css` binds that
 * to Tailwind's `--font-sans` (and `--font-heading`) in the `@theme inline`
 * block. So `font-sans` and the base `html` rule resolve to Poppins everywhere —
 * no per-component font classes, and one line to swap the typeface later.
 */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — by MSL Team`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: "MSL Team" }],
  creator: "MSL Team",
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: siteConfig.themeColor.light },
    { media: "(prefers-color-scheme: dark)", color: siteConfig.themeColor.dark },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // next-themes writes the theme class before hydration; without this React
      // reports a mismatch on every load.
      suppressHydrationWarning
      className={`${poppins.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
