"use client";

import { useMediaQuery } from "./use-media-query";

/**
 * Viewport is below the `md` breakpoint.
 *
 * Required by the vendored shadcn `Sidebar` (which switches to a Sheet on
 * mobile), so the name and signature must stay as-is. The implementation
 * delegates to `useMediaQuery` — the original create-next-app version used
 * `setState` inside an effect, which the React Compiler lint rules reject.
 */
const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}
