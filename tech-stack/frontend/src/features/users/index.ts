/**
 * Public surface of the users slice — the reference feature.
 * Copy this folder wholesale when you add a new domain.
 */
export { UsersTable } from "./components/users-table";
export {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUpdateUserStatus,
  useUser,
  useUsers,
} from "./hooks/use-users";
export {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type UpdateUserStatusInput,
} from "./schemas";
export type { UserListParams, UserStats } from "./types";
