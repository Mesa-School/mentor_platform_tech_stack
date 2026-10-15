"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { REDIRECT_PARAM, ROLE_HOME, ROUTES } from "@/lib/constants";
import { notify } from "@/lib/toast";
import { authService } from "../services/auth.service";
import type { ForgotPasswordInput, LoginInput } from "../schemas";

/**
 * Log in, then route the user to the right place.
 *
 * The mutation delegates to `AuthContext.login` (not the service directly) so the
 * token lands in the store and the context holds the user. Redirect target:
 * the `?next=` param if present, otherwise the role's home from `ROLE_HOME`.
 */
export function useLogin() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  return useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (user) => {
      const requested = searchParams.get(REDIRECT_PARAM);
      const destination =
        requested && requested.startsWith("/") // never trust an absolute URL from the query string
          ? requested
          : ROLE_HOME[user.role];

      notify.success(`Welcome back, ${user.name.split(" ")[0]}`);
      router.replace(destination);
      router.refresh(); // re-run Server Components now that a session exists
    },
    // Errors are handled at the call site so the form can map them onto fields.
  });
}

export function useLogout() {
  const { logout } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationKey: ["auth", "logout"],
    mutationFn: logout,
    onSuccess: () => {
      router.replace(ROUTES.login);
      router.refresh();
    },
    onError: (error) => notify.fromError(error, "Could not sign you out"),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationKey: ["auth", "forgot-password"],
    mutationFn: (input: ForgotPasswordInput) =>
      authService.forgotPassword(input),
    onSuccess: () =>
      notify.success("Check your inbox", {
        description: "If that email is registered, a reset link is on its way.",
      }),
    onError: (error) => notify.fromError(error),
  });
}
