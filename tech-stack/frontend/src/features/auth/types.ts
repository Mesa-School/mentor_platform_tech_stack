/**
 * Feature-local types for auth.
 *
 * Persisted entities (User, AuthSession) live in `@/types/models` because they
 * cross feature boundaries. Only transient, auth-only shapes belong here.
 */

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Very weak" | "Weak" | "Fair" | "Good" | "Strong";
}

export interface LoginFormState {
  /** Where to send the user after a successful login. */
  redirectTo?: string;
}
