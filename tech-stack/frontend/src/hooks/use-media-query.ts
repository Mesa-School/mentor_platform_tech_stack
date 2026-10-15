"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribe to a CSS media query.
 *
 * `useSyncExternalStore` (not useState + useEffect) so React reads the value
 * during render and there is no flash of the wrong layout on hydration; the
 * server snapshot is `false`, which matches the mobile-first default.
 *
 *   const isDesktop = useMediaQuery('(min-width: 1024px)')
 *
 * Prefer CSS/container queries for layout. Reach for this only when the
 * *behaviour* differs (e.g. Dialog on desktop vs Drawer on mobile).
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false, // server snapshot
  );
}

export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
export const usePrefersReducedMotion = () =>
  useMediaQuery("(prefers-reduced-motion: reduce)");
