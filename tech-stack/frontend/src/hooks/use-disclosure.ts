"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Open/close state for dialogs, sheets, drawers, and popovers.
 *
 * Saves the same four lines in every component and gives the modal a consistent
 * prop surface: `<Dialog open={dialog.isOpen} onOpenChange={dialog.setOpen}>`.
 */
export function useDisclosure(defaultOpen = false) {
  const [isOpen, setOpen] = useState(defaultOpen);

  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((previous) => !previous), []);

  return useMemo(
    () => ({ isOpen, open, close, toggle, setOpen }),
    [isOpen, open, close, toggle],
  );
}

export type Disclosure = ReturnType<typeof useDisclosure>;
