import { z } from "zod";

import { ROLES, USER_STATUSES } from "@/types/enums";

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.email("Enter a valid email address"),
  role: z.enum(ROLES),
});

/** PATCH semantics: every field optional, but at least one must be present. */
export const updateUserSchema = createUserSchema.partial().refine(
  (values) => Object.values(values).some((value) => value !== undefined),
  { message: "Change at least one field" },
);

export const updateUserStatusSchema = z.object({
  status: z.enum(USER_STATUSES),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
