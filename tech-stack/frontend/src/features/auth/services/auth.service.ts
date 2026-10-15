/**
 * Auth API calls. Plain async functions — no React, no hooks, no toasts.
 * That keeps them unit-testable and callable from a Server Component or a script.
 */
import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { AuthSession, CurrentUser } from "@/types/models";
import type { ForgotPasswordInput, LoginInput, ResetPasswordInput } from "../schemas";

export const authService = {
  /** The backend also sets the httpOnly refresh cookie on this response. */
  login: (input: LoginInput) =>
    api.post<AuthSession>(ENDPOINTS.auth.login, input, { skipAuth: true }),

  logout: () => api.post<void>(ENDPOINTS.auth.logout),

  me: () => api.get<CurrentUser>(ENDPOINTS.auth.me),

  forgotPassword: (input: ForgotPasswordInput) =>
    api.post<{ sent: boolean }>(ENDPOINTS.auth.forgotPassword, input, {
      skipAuth: true,
    }),

  resetPassword: (input: ResetPasswordInput) =>
    api.post<void>(ENDPOINTS.auth.resetPassword, input, { skipAuth: true }),
};
