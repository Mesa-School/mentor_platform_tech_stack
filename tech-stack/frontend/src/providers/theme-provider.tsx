"use client";

/**
 * next-themes wrapper. `attribute="class"` toggles `.dark` on <html>, which is
 * what the `@custom-variant dark` rule in globals.css keys off.
 *
 * `suppressHydrationWarning` on <html> (see app/layout.tsx) is required — the
 * theme script writes the class before React hydrates.
 */
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps, ReactNode } from "react";

type ThemeProviderProps = Omit<
  ComponentProps<typeof NextThemesProvider>,
  "children"
> & { children: ReactNode };

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      // Light is the canonical look — design and review it first. Dark is fully
      // supported (see the .dark block in globals.css) and reachable from the
      // theme toggle or by choosing "System"; it just isn't the default.
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
