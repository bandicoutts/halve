"use client";
import { HEADER_BAR, Wordmark } from "@/components/ui/Wordmark";
import { GhostLink } from "@/components/ui/GhostLink";
import { Button } from "@/components/ui/Button";
import { Mark } from "@/components/symbols/Mark";

type MarkTone = "standard" | "soft" | "faint" | "quiet";

interface Action {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface MessageScreenProps {
  /** Brand-mark visibility for the message state. */
  mark: MarkTone;
  kicker: string;
  headline: string;
  body: React.ReactNode;
  primary: Action;
  /** Optional mono ghost action (e.g. HOME). */
  secondary?: Action | undefined;
}

function MarkGlyph({ tone }: { tone: MarkTone }) {
  const opacity = tone === "faint" ? 0.35 : tone === "quiet" ? 0.65 : tone === "soft" ? 0.9 : 1;
  return <Mark size={104} decorative style={{ marginBottom: 6, opacity }} />;
}

/** Centered, editorial message screen for error / 404 / unavailable states. */
export function MessageScreen({ mark, kicker, headline, body, primary, secondary }: MessageScreenProps) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <header style={HEADER_BAR}>
        <Wordmark />
      </header>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          padding: "16px 44px 52px",
          textAlign: "center",
          animation: "fadeup 0.5s var(--ease-editorial) both",
        }}
      >
        <MarkGlyph tone={mark} />
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.22em", color: "var(--fg-3)" }}>{kicker}</div>
        <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, fontSize: "clamp(36px, 5vw, 46px)", lineHeight: 1, margin: 0, letterSpacing: "-0.02em" }}>
          {headline}
        </h1>
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: "var(--fg-3)", maxWidth: "36ch" }}>{body}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <Button href={primary.href} onClick={primary.onClick}>
            {primary.label}
          </Button>
          {secondary && (
            <GhostLink href={secondary.href} onClick={secondary.onClick}>
              {secondary.label}
            </GhostLink>
          )}
        </div>
      </div>
    </div>
  );
}
