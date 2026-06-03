"use client";
import { Button } from "@/components/ui/Button";

/** Shown when the daily puzzle's offline generator throws unexpectedly. */
export function DailyUnavailable() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
        textAlign: "center",
        background: "var(--bg)",
      }}
    >
      <h1
        style={{
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "var(--fg-1)",
          lineHeight: 1.2,
          margin: 0,
        }}
      >
        {"Today's puzzle is unavailable"}
      </h1>
      <p
        style={{
          marginTop: 12,
          fontSize: 16,
          color: "var(--fg-2)",
          maxWidth: 320,
          marginInline: "auto",
          lineHeight: 1.5,
        }}
      >
        Something went wrong loading the puzzle. Please try again.
      </p>
      <div style={{ marginTop: 28, maxWidth: 320, width: "100%" }}>
        <Button variant="primary" full onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    </div>
  );
}
