/**
 * Streamed instantly while an authenticated route segment renders on the server.
 * Next wraps the segment in a Suspense boundary using this as the fallback, so
 * the shell paints immediately instead of the navigation appearing to hang.
 */
import { LoadingState } from "@/components/shared/state-views";

export default function Loading() {
  return <LoadingState className="min-h-[50vh]" />;
}
