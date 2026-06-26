"use client"; // Error boundaries must be Client Components
import { useEffect } from "react";
import Link from "next/link";
import { Mark } from "@/components/symbols/Mark";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

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
  backLabel = "Back home",
}: RouteErrorProps) {
  useEffect(() => {
    // Surface for monitoring; in prod the message is already redacted by Next.
    console.error(`[error-boundary${tag ? `/${tag}` : ""}]`, error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        background: "var(--bg)",
        padding: "0 24px 40px",
        animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div style={{ maxWidth: 360, width: "100%" }}>
        <Mark size={44} style={{ opacity: 0.9 }} />

        <Eyebrow style={{ marginTop: 28 }}>Something broke</Eyebrow>

        <h1
          style={{
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: "-0.025em",
            color: "var(--fg-1)",
            marginTop: 8,
            lineHeight: 1.1,
          }}
        >
          The balance slipped
        </h1>

        <p
          style={{
            fontSize: "var(--text-small)",
            lineHeight: 1.5,
            color: "var(--fg-3)",
            margin: "12px 0 0",
          }}
        >
          {body}
        </p>

        <div style={{ marginTop: 28 }}>
          <Button variant="primary" full onClick={() => retry?.()}>
            Try again
          </Button>
        </div>
        <div style={{ marginTop: 12 }}>
          <Link href={backHref} style={{ textDecoration: "none" }}>
            <Button variant="secondary" full>
              {backLabel}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
