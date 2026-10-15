"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PAGINATION } from "@/lib/constants";
import type { ListParams } from "@/types/api";

/**
 * Table state (page, size, search, sort) held in the URL rather than React state.
 *
 * Why the URL: a filtered table becomes shareable, survives refresh and
 * back/forward, and — because the resulting `ListParams` object goes straight
 * into a query key — TanStack Query caches each variant separately for free.
 *
 *   const { params, setSearch, setPage, setSort } = useTableParams()
 *   const { data } = useUsers(params)
 */
export function useTableParams(defaults?: Partial<ListParams>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo<ListParams>(() => {
    const page = Number(searchParams.get("page"));
    const pageSize = Number(searchParams.get("pageSize"));
    const sortDir = searchParams.get("sortDir");

    return {
      page:
        Number.isFinite(page) && page > 0
          ? page
          : (defaults?.page ?? PAGINATION.defaultPage),
      pageSize:
        Number.isFinite(pageSize) && pageSize > 0
          ? pageSize
          : (defaults?.pageSize ?? PAGINATION.defaultPageSize),
      search: searchParams.get("search") ?? defaults?.search ?? "",
      sortBy: searchParams.get("sortBy") ?? defaults?.sortBy,
      sortDir:
        sortDir === "asc" || sortDir === "desc"
          ? sortDir
          : (defaults?.sortDir ?? undefined),
    };
  }, [searchParams, defaults]);

  const patch = useCallback(
    (updates: Partial<ListParams>) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      // Any filter change invalidates the current page offset.
      if (!("page" in updates)) next.delete("page");

      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setSearch = useCallback(
    (search: string) => patch({ search }),
    [patch],
  );
  const setPage = useCallback((page: number) => patch({ page }), [patch]);
  const setPageSize = useCallback(
    (pageSize: number) => patch({ pageSize, page: 1 }),
    [patch],
  );

  /** Click a column: asc → desc → cleared. */
  const setSort = useCallback(
    (sortBy: string) => {
      if (params.sortBy !== sortBy) return patch({ sortBy, sortDir: "asc" });
      if (params.sortDir === "asc") return patch({ sortBy, sortDir: "desc" });
      return patch({ sortBy: undefined, sortDir: undefined });
    },
    [params.sortBy, params.sortDir, patch],
  );

  const reset = useCallback(
    () => router.replace(pathname, { scroll: false }),
    [pathname, router],
  );

  return { params, patch, setSearch, setPage, setPageSize, setSort, reset };
}
