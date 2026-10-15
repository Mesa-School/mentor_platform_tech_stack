/**
 * Toast wrapper.
 *
 * Call `notify.*` instead of the underlying toast manager so swapping the toast
 * library (or adding logging/telemetry to every error toast) is a one-file change.
 * `notify.fromError` is the standard way to surface a failed mutation.
 */
import { toast } from "@/components/ui/toast";
import { toErrorMessage } from "@/lib/api/http-error";

interface NotifyOptions {
  description?: string;
  /** 0 keeps the toast up until dismissed. */
  timeout?: number;
}

export const notify = {
  success: (title: string, options?: NotifyOptions) =>
    toast.add({ title, type: "success", ...options }),

  error: (title: string, options?: NotifyOptions) =>
    toast.add({ title, type: "error", priority: "high", ...options }),

  warning: (title: string, options?: NotifyOptions) =>
    toast.add({ title, type: "warning", ...options }),

  info: (title: string, options?: NotifyOptions) =>
    toast.add({ title, type: "info", ...options }),

  /** Surface any thrown value as an error toast with a safe message. */
  fromError: (error: unknown, fallbackTitle = "Something went wrong") =>
    toast.add({
      title: fallbackTitle,
      description: toErrorMessage(error),
      type: "error",
      priority: "high",
    }),

  /** Pending → success/error, driven by a promise (e.g. `mutateAsync`). */
  promise: <T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error?: string },
  ) =>
    toast.promise(promise, {
      loading: { title: messages.loading },
      success: { title: messages.success },
      error: (error: unknown) => ({
        title: messages.error ?? "Request failed",
        description: toErrorMessage(error),
      }),
    }),

  dismiss: (id?: string) => toast.close(id),
};
