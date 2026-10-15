/**
 * Users API calls. The template every other service copies.
 *
 * Rules:
 *  - Plain async functions. No React, no hooks, no toasts, no cache access.
 *  - Return typed models from `@/types` — never `any`, never a raw Response.
 *  - Paths come from `ENDPOINTS`; query strings from `toQueryString`.
 */
import { api } from "@/lib/api/client";
import { ENDPOINTS, toQueryString } from "@/lib/api/endpoints";
import type { Paginated } from "@/types/api";
import type { User } from "@/types/models";
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateUserStatusInput,
} from "../schemas";
import type { UserListParams } from "../types";

export const usersService = {
  /** `api.list` keeps the envelope's pagination `meta` alongside the items. */
  list: (params?: UserListParams): Promise<Paginated<User>> =>
    api.list<User>(`${ENDPOINTS.users.root}${toQueryString(params)}`),

  detail: (id: string) => api.get<User>(ENDPOINTS.users.detail(id)),

  create: (input: CreateUserInput) =>
    api.post<User>(ENDPOINTS.users.root, input),

  update: (id: string, input: UpdateUserInput) =>
    api.patch<User>(ENDPOINTS.users.detail(id), input),

  updateStatus: (id: string, input: UpdateUserStatusInput) =>
    api.patch<User>(ENDPOINTS.users.status(id), input),

  remove: (id: string) => api.delete(ENDPOINTS.users.detail(id)),
};
