/**
 * Public surface of the auth slice. Other code imports ONLY from here:
 *   import { LoginForm, useLogout } from '@/features/auth'
 *
 * Reaching past this barrel (`@/features/auth/services/...`) is a lint-worthy
 * smell — it couples callers to internals you should be free to refactor.
 */
export { LoginForm } from "./components/login-form";
export { useForgotPassword, useLogin, useLogout } from "./hooks/use-login";
export {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type ResetPasswordInput,
} from "./schemas";
export type { LoginFormState, PasswordStrength } from "./types";
