"use client"; // Error boundaries must be Client Components
import { useEffect } from "react";
import { MessageScreen } from "@/components/ui/MessageScreen";

interface RouteErrorProps {
  error: Error & { digest?: string };
  // Next 16.2 forwards `unstable_retry` (re-fetches + re-renders the segment);
  // `reset` is the older clear-and-re-render. Accept both, prefer retry.
  reset?: () => void;
  unstable_retry?: () => void;
  /** Log scope, e.g. "tutorial" → "[error-boundary/tutorial]". Omit for root. */
  tag?: string;
  /** The sentence(s) shown under the heading. */
  body: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}

/**
 * Shared branded render-error fallback for the app-router `error.tsx` boundaries.
 * Each route's `error.tsx` is a thin wrapper that supplies the copy + back link.
 */
export function RouteError({
  error,
  reset,
  unstable_retry,
  tag,
  body,
  backHref = "/",
  backLabel = "Home",
}: RouteErrorProps) {
  useEffect(() => {
    // Surface for monitoring; in prod the message is already redacted by Next.
    console.error(`[error-boundary${tag ? `/${tag}` : ""}]`, error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  return (
    <MessageScreen
      mark="solid"
      kicker="ERROR"
      headline="Something went wrong."
      body={body}
      primary={{ label: "Retry", onClick: () => retry?.() }}
      secondary={{ label: backLabel.toUpperCase(), href: backHref }}
    />
  );
}
