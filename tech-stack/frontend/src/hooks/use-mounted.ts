"use client";

import { useSyncExternalStore } from "react";

/** Never fires — the value is constant per environment, so nothing to subscribe to. */
const noopSubscribe = () => () => {};

/**
 * False on the server and during hydration, true once the client has taken over.
 *
 * Use it to defer anything whose server and client output cannot match — the
 * resolved theme, a locale-formatted date, a `window`-derived value — instead of
 * suppressing the hydration warning and shipping a real mismatch.
 *
 *   const mounted = useMounted()
 *   if (!mounted) return <Skeleton className="size-9" />
 *
 * Implemented with `useSyncExternalStore` rather than `useState(false)` +
 * `useEffect(() => setMounted(true))`: same result, but no setState inside an
 * effect and therefore no extra render pass (React's own recommended pattern —
 * the React Compiler lint rules reject the effect version).
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true, // client snapshot
    () => false, // server snapshot
  );
}
