"use client"; // Error boundaries must be Client Components
import { RouteError } from "@/components/RouteError";

// Root render-error boundary. Wraps every route segment's page/loading/not-found
// (but NOT the root layout itself — see global-error for that).
export default function Error(props: {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}) {
  return (
    <RouteError
      {...props}
      body={
        <>
          An unexpected error interrupted this page. You can try again, or head
          back to today&rsquo;s puzzle.
        </>
      }
    />
  );
}
