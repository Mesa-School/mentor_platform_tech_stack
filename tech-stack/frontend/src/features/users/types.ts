/**
 * Feature-local shapes. `User` itself lives in `@/types/models` because other
 * features reference it; these view-models are only meaningful inside the slice.
 */
import type { ListParams } from "@/types/api";
import type { Role, UserStatus } from "@/types/enums";

export interface UserListParams extends ListParams {
  role?: Role;
  status?: UserStatus;
}

/** Aggregates rendered on the users page header. */
export interface UserStats {
  total: number;
  active: number;
  invited: number;
  suspended: number;
}
