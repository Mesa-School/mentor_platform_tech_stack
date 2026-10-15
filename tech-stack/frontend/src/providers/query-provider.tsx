"use client";

/**
 * TanStack Query is the single owner of server state.
 *
 * The QueryClient is created inside `useState` so it is instantiated once per
 * mount rather than once per module — a module-level client would be shared
 * across requests on the server and leak one user's data into another's render.
 */
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

import { isApiError } from "@/lib/api/http-error";
import { QUERY_DEFAULTS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { isDevelopment } from "@/lib/config/env";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_DEFAULTS.staleTime,
        gcTime: QUERY_DEFAULTS.gcTime,
        refetchOnWindowFocus: false,
        // Never retry a 4xx — the request is wrong, not unlucky.
        retry: (failureCount, error) => {
          if (isApiError(error) && !error.isRetryable) return false;
          return failureCount < QUERY_DEFAULTS.retry;
        },
      },
      mutations: {
        retry: false,
      },
    },
    // Central logging. Per-call `onError` still runs; this is the safety net.
    queryCache: new QueryCache({
      onError: (error, query) => {
        logger.error("Query failed", error, { queryKey: query.queryKey });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        logger.error("Mutation failed", error, {
          mutationKey: mutation.options.mutationKey,
        });
      },
    }),
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {isDevelopment && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
