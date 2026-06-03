"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Mark } from "@/components/symbols/Mark";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

export default function PracticePlayError({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary/practice/play]", error);
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
          Couldn&rsquo;t load the practice puzzle. You can try again or pick a
          different difficulty.
        </p>

        <div style={{ marginTop: 28 }}>
          <Button variant="primary" full onClick={() => retry?.()}>
            Try again
          </Button>
        </div>
        <div style={{ marginTop: 12 }}>
          <Link href="/practice" style={{ textDecoration: "none" }}>
            <Button variant="secondary" full>
              Back to practice
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
