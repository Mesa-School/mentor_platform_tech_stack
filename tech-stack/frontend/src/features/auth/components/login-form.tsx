"use client";

/**
 * The canonical form in this codebase. Copy its shape for every other form:
 *   Zod schema  →  useForm + zodResolver  →  mutation  →  field errors / toast
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { isApiError } from "@/lib/api/http-error";
import { notify } from "@/lib/toast";
import { useLogin } from "../hooks/use-login";
import { loginSchema, type LoginInput } from "../schemas";

export function LoginForm() {
  const login = useLogin();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    try {
      await login.mutateAsync(values);
    } catch (error) {
      // Field-level errors go on the field; everything else goes to a toast.
      if (isApiError(error)) {
        if (error.isUnauthorized) {
          form.setError("password", {
            message: "That email and password don't match.",
          });
          return;
        }
        if (error.isValidation) {
          for (const [field, messages] of Object.entries(error.fieldErrors)) {
            form.setError(field as keyof LoginInput, { message: messages[0] });
          }
          return;
        }
      }
      notify.fromError(error, "Could not sign you in");
    }
  }

  const isSubmitting = form.formState.isSubmitting || login.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={!!form.formState.errors.email}
            {...form.register("email")}
          />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!form.formState.errors.password}
            {...form.register("password")}
          />
          <FieldError errors={[form.formState.errors.password]} />
        </Field>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </FieldGroup>
    </form>
  );
}
