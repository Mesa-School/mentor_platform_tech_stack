"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Persisted UI state (table density, collapsed panels, dismissed banners).
 *
 * NOT for server data — that belongs to TanStack Query — and NOT for tokens
 * (see `lib/auth/token-store.ts` for why access tokens stay in memory).
 *
 * localStorage is an external store, so it is read through `useSyncExternalStore`:
 * SSR gets `initialValue`, the client reads the real value, and every hook using
 * the same key stays in sync — across components *and* across browser tabs.
 *
 *   const [density, setDensity] = useLocalStorage('table.density', 'comfortable')
 *
 * Pass a referentially stable `initialValue` (a module constant, not an inline
 * object literal) — it is the server snapshot and must not change per render.
 */

/** Per-key subscribers, so a write in one component re-renders the others. */
const listeners = new Map<string, Set<() => void>>();

/**
 * Parsed-value cache. `getSnapshot` must return a referentially identical value
 * when nothing changed, or React re-renders forever — so parse only when the
 * raw string actually differs.
 */
const cache = new Map<string, { raw: string | null; value: unknown }>();

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function subscribe(key: string, onChange: () => void) {
  let keyListeners = listeners.get(key);
  if (!keyListeners) {
    keyListeners = new Set();
    listeners.set(key, keyListeners);
  }
  keyListeners.add(onChange);

  // Writes from another tab arrive as a storage event.
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    keyListeners.delete(onChange);
    if (keyListeners.size === 0) listeners.delete(key);
    window.removeEventListener("storage", onStorage);
  };
}

function readSnapshot<T>(key: string, initialValue: T): T {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    // Storage disabled (private mode / blocked cookies) — fall back to default.
  }

  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;

  let value = initialValue;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      // Corrupt entry written by an older version — keep the default.
    }
  }

  cache.set(key, { raw, value });
  return value;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const value = useSyncExternalStore(
    useCallback((onChange: () => void) => subscribe(key, onChange), [key]),
    useCallback(() => readSnapshot(key, initialValue), [key, initialValue]),
    useCallback(() => initialValue, [initialValue]), // server snapshot
  );

  const setValue = useCallback(
    (next: T | ((previous: T) => T)) => {
      const resolved =
        typeof next === "function"
          ? (next as (previous: T) => T)(readSnapshot(key, initialValue))
          : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Quota exceeded — cache the value anyway so the UI still updates.
      }
      cache.set(key, { raw: JSON.stringify(resolved), value: resolved });
      notify(key);
    },
    [key, initialValue],
  );

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    cache.delete(key);
    notify(key);
  }, [key]);

  return [value, setValue, remove] as const;
}
