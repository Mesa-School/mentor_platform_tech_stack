"use client";

import { useEffect, useRef, useState } from "react";

import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";

/**
 * Debounce a value. The classic use: a search input feeding a query key, so the
 * user types six characters and you fire one request instead of six.
 *
 *   const [search, setSearch] = useState('')
 *   const debounced = useDebounce(search)
 *   const { data } = useUsers({ search: debounced })
 */
export function useDebounce<T>(value: T, delay = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

/**
 * Debounce a callback. Use when you need the *call* delayed rather than a value
 * (autosave, resize handlers). The returned function is stable across renders.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay = SEARCH_DEBOUNCE_MS,
) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest callback without re-creating the debounced function.
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return (...args: Args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
  };
}
