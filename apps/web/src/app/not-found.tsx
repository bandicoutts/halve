import Link from "next/link";
import { Mark } from "@/components/symbols/Mark";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

// Root not-found boundary. Renders for `notFound()` calls in any segment AND for
// any URL that matches no route. Server Component — no client hooks needed.
export default function NotFound() {
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

        <Eyebrow style={{ marginTop: 28 }}>404</Eyebrow>

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
          Nothing here
        </h1>

        <p
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: "var(--fg-3)",
            margin: "12px 0 0",
          }}
        >
          This page doesn&rsquo;t exist — the puzzle may not have been published
          yet, or the link is wrong.
        </p>

        <div style={{ marginTop: 28 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Button variant="primary" full>
              Back home
            </Button>
          </Link>
        </div>
        <div style={{ marginTop: 12 }}>
          <Link href="/archive" style={{ textDecoration: "none" }}>
            <Button variant="secondary" full>
              Browse the archive
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
