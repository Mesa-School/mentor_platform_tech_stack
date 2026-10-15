"use client";

/**
 * Query + mutation hooks for the users slice — the template every feature copies.
 *
 * Pattern per mutation:
 *   1. mutationFn calls the service
 *   2. onSuccess writes the returned resource into its detail cache
 *      (the backend returns the mutated entity, so no extra round-trip)
 *   3. invalidate the list namespace so tables refetch
 *   4. toast success; toast or re-throw on error
 */
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/lib/api/query-keys";
import { notify } from "@/lib/toast";
import type { User } from "@/types/models";
import { usersService } from "../services/users.service";
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateUserStatusInput,
} from "../schemas";
import type { UserListParams } from "../types";

export function useUsers(params?: UserListParams) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => usersService.list(params),
    // Keep the old page on screen while the next one loads — no table flicker.
    placeholderData: keepPreviousData,
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.users.detail(id ?? ""),
    queryFn: () => usersService.detail(id!),
    // Dependent query: don't fire until we actually have an id.
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["users", "create"],
    mutationFn: (input: CreateUserInput) => usersService.create(input),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.users.detail(user.id), user);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      notify.success("User created", { description: user.email });
    },
    onError: (error) => notify.fromError(error, "Could not create the user"),
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["users", "update", id],
    mutationFn: (input: UpdateUserInput) => usersService.update(id, input),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.users.detail(user.id), user);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      notify.success("Changes saved");
    },
    onError: (error) => notify.fromError(error, "Could not save changes"),
  });
}

/**
 * Optimistic update — the row flips instantly and rolls back if the server says no.
 * Reserve this pattern for cheap, reversible toggles; plain invalidation is the
 * default everywhere else.
 */
export function useUpdateUserStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["users", "status", id],
    mutationFn: (input: UpdateUserStatusInput) =>
      usersService.updateStatus(id, input),

    onMutate: async (input) => {
      const detailKey = queryKeys.users.detail(id);
      await queryClient.cancelQueries({ queryKey: detailKey });

      const previous = queryClient.getQueryData<User>(detailKey);
      if (previous) {
        queryClient.setQueryData<User>(detailKey, {
          ...previous,
          status: input.status,
        });
      }
      return { previous };
    },

    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.users.detail(id), context.previous);
      }
      notify.fromError(error, "Could not update status");
    },

    // Always reconcile with the server, success or failure.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["users", "delete"],
    mutationFn: (id: string) => usersService.remove(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      notify.success("User removed");
    },
    onError: (error) => notify.fromError(error, "Could not remove the user"),
  });
}
