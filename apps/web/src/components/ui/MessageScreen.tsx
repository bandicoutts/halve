"use client";
import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";

type MarkVariant = "solid" | "ring" | "faded" | "outline";

interface Action {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface MessageScreenProps {
  /** Brand-mark treatment that colours the message (solid / ring / faded / outline). */
  mark: MarkVariant;
  kicker: string;
  headline: string;
  body: React.ReactNode;
  primary: Action;
  /** Optional mono ghost action (e.g. HOME). */
  secondary?: Action | undefined;
}

function MarkGlyph({ variant }: { variant: MarkVariant }) {
  const amber =
    variant === "outline"
      ? { fill: "none", stroke: "var(--accent)", strokeWidth: "8px" }
      : { fill: "var(--accent)", opacity: variant === "faded" ? 0.35 : variant === "ring" ? 0.9 : 1 };
  const teal =
    variant === "ring" || variant === "outline"
      ? { fill: "none", stroke: "var(--symbol-b)", strokeWidth: "8px" }
      : { fill: "var(--symbol-b)", opacity: variant === "faded" ? 0.35 : 1 };
  return (
    <svg viewBox="0 0 240 200" style={{ width: 104, marginBottom: 6 }} aria-hidden="true">
      <path d="M86 10 A90 90 0 0 0 86 190 Z" style={amber} />
      <path d="M154 10 A90 90 0 0 1 154 190 Z" style={teal} />
    </svg>
  );
}

const primaryStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--accent)",
  color: "var(--on-accent)",
  border: "none",
  borderRadius: 999,
  padding: "15px 36px",
  fontFamily: "var(--font-sans)",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  transition: "transform 0.2s ease",
  textDecoration: "none",
};

const ghostStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "var(--fg-3)",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  letterSpacing: "0.18em",
  padding: "4px 0",
  transition: "color 0.18s ease",
  textDecoration: "none",
};

function PrimaryAction({ action }: { action: Action }) {
  const hover = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.transform = "translateY(-2px)"),
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.transform = "none"),
  };
  return action.href ? (
    <Link href={action.href} style={primaryStyle} {...hover}>
      {action.label}
    </Link>
  ) : (
    <button style={primaryStyle} onClick={action.onClick} {...hover}>
      {action.label}
    </button>
  );
}

function GhostAction({ action }: { action: Action }) {
  const hover = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.color = "var(--accent)"),
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.color = "var(--fg-3)"),
  };
  return action.href ? (
    <Link href={action.href} style={ghostStyle} {...hover}>
      {action.label}
    </Link>
  ) : (
    <button style={ghostStyle} onClick={action.onClick} {...hover}>
      {action.label}
    </button>
  );
}

/** Centered, editorial message screen for error / 404 / unavailable states. */
export function MessageScreen({ mark, kicker, headline, body, primary, secondary }: MessageScreenProps) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <header style={{ padding: "20px clamp(24px, 5vw, 32px)", flex: "none" }}>
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
        <MarkGlyph variant={mark} />
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.22em", color: "var(--fg-3)" }}>{kicker}</div>
        <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, fontSize: "clamp(36px, 5vw, 46px)", lineHeight: 1, margin: 0, letterSpacing: "-0.02em" }}>
          {headline}
        </h1>
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: "var(--fg-3)", maxWidth: "36ch" }}>{body}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <PrimaryAction action={primary} />
          {secondary && <GhostAction action={secondary} />}
        </div>
      </div>
    </div>
  );
}
