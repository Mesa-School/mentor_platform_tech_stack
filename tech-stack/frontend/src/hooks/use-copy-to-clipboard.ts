"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { notify } from "@/lib/toast";

/**
 * Copy text and flip a `copied` flag for ~2s so a button can show a checkmark.
 * Falls back to a toast on failure (clipboard access is permission-gated and
 * unavailable outside a secure context).
 */
export function useCopyToClipboard(resetAfterMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const copy = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), resetAfterMs);
        return true;
      } catch (error) {
        notify.fromError(error, "Could not copy to clipboard");
        return false;
      }
    },
    [resetAfterMs],
  );

  return { copied, copy };
}
