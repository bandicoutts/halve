"use client";
import { useState } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { Mark } from "@/components/symbols/Mark";
import { SymbolA } from "@/components/symbols/SymbolA";
import { SymbolB } from "@/components/symbols/SymbolB";
import { HEADER_BAR } from "@/components/ui/Wordmark";
import { ThemeGlyph } from "@/components/ui/SiteHeader";
import { GhostLink } from "@/components/ui/GhostLink";
import { Button } from "@/components/ui/Button";
import { formatDateLabel } from "@/lib/local-date";
import { shareResult } from "@/lib/share-result";

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The solved grid, rendered small as a keepsake (amber / teal rings). */
function MiniGrid({ solution, gridSize }: { solution: number[][]; gridSize: number }) {
  const flat = solution.flat();
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gap: 7 }}>
      {flat.map((s, i) => (
        <div
          key={`${Math.floor(i / gridSize)}-${i % gridSize}`}
          style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {s === 0 ? <SymbolA size={22} /> : <SymbolB size={22} />}
        </div>
      ))}
    </div>
  );
}

export interface WinScreenProps {
  kind: "daily" | "archive" | "practice";
  time: string;
  solution: number[][];
  gridSize?: number | undefined;
  dayNo?: number | undefined;
  date?: string | undefined;
  difficulty: string;
  usedHint?: boolean | undefined;
  streak?: number | undefined;
  nextIn?: string | undefined;
  /** True when recording the solve failed — shows a retry prompt. */
  saveError?: boolean | undefined;
  /** Re-attempts the solve insert. */
  onRetrySave?: (() => void) | undefined;
  onClose: () => void;
  onSecondary: () => void;
  onTertiary?: (() => void) | undefined;
}

export function WinScreen({
  kind,
  time,
  solution,
  gridSize = 6,
  dayNo,
  date,
  difficulty,
  usedHint = false,
  streak,
  nextIn,
  saveError,
  onRetrySave,
  onClose,
  onSecondary,
  onTertiary,
}: WinScreenProps) {
  // The win screen is a full-screen overlay: trap focus while shown, restore on close.
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose);
  const [sharing, setSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  const displayDate = date ? formatDateLabel(date) : undefined;

  const kicker =
    kind === "practice"
      ? `SOLVED · PRACTICE · ${difficulty.toUpperCase()}`
      : dayNo !== undefined
      ? kind === "archive"
        ? `SOLVED · NO. ${dayNo} · ARCHIVE`
        : `SOLVED · NO. ${dayNo}`
      : "SOLVED";

  const metaLine =
    kind === "practice"
      ? `${cap(difficulty)} · Practice${usedHint ? " · Hints used" : ""} · Streak unchanged`
      : kind === "archive"
      ? `${cap(difficulty)}${displayDate ? ` · ${displayDate}` : ""} · From the archive${usedHint ? " · Hints used" : ""}`
      : `${cap(difficulty)}${displayDate ? ` · ${displayDate}` : ""}${streak ? ` · ${streak}-day streak` : ""}${usedHint ? " · Hints used" : ""}`;

  const secondaryLabel =
    kind === "daily" ? "Back to home" : kind === "archive" ? "Back to archive" : "Another puzzle";
  const closeLabel = kind === "daily" ? "HOME" : kind === "archive" ? "ARCHIVE" : "PRACTICE";

  const cardNo = dayNo !== undefined ? `NO. ${dayNo}` : kind === "practice" ? "PRACTICE" : "";

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    setShareMessage("");
    // Deliberately no solved-grid emoji (spoiler-free — see product decision):
    // share the result line only.
    const streakPart = kind !== "practice" && streak ? ` · streak ${streak}` : "";
    const idPart = kind !== "practice" && dayNo ? `No. ${dayNo} · ` : "";
    const hintPart = usedHint ? " · hints used" : "";
    const text = `Halve ${idPart}${time} · ${cap(difficulty)}${streakPart}${hintPart}\nNo spoilers. Play at halve.today`;
    const outcome = await shareResult(text, {
      share: navigator.share?.bind(navigator),
      writeText: navigator.clipboard?.writeText.bind(navigator.clipboard),
    });
    setSharing(false);
    setShareMessage({
      shared: "Result shared.",
      copied: "Result copied. Ready to paste.",
      cancelled: "",
      failed: "Couldn’t share your result. Please try again.",
    }[outcome]);
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Puzzle complete"
      tabIndex={-1}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: "var(--fg-1)",
        zIndex: 50,
        overflow: "auto",
      }}
    >
      {/* Minimal header — wordmark + theme toggle + close */}
      <header style={HEADER_BAR}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Mark size={21} />
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 22,
              letterSpacing: "-0.01em",
            }}
          >
            Halve
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <ThemeGlyph />
          <GhostLink onClick={onClose}>{closeLabel}</GhostLink>
        </div>
      </header>

      <section
        style={{
          flex: 1,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(36px, 6vw, 88px)",
          maxWidth: 1140,
          width: "100%",
          margin: "0 auto",
          padding: "8px clamp(20px, 4vw, 40px) 64px",
          animation: "fadeup 0.55s var(--ease-editorial) both",
        }}
      >
        {/* Left — the reveal */}
        <div style={{ flex: "1 1 400px", display: "flex", flexDirection: "column", gap: 22, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.22em",
              color: "var(--accent-text)",
            }}
          >
            {kicker}
          </div>
          <div
            className="tnum"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "var(--text-jumbo)",
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
            }}
          >
            {time}
          </div>
          <p style={{ margin: 0, fontSize: 16, color: "var(--fg-3)", lineHeight: 1.5 }}>{metaLine}</p>

          {saveError && (
            <div
              role="alert"
              style={{
                padding: "12px 14px",
                background: "var(--surface)",
                border: "1px solid var(--hairline)",
                borderRadius: "var(--radius-lg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 14, color: "var(--fg-2)" }}>
                Couldn&apos;t save your result. Check your connection.
              </span>
              <button
                onClick={onRetrySave}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-text)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  padding: 0,
                  whiteSpace: "nowrap",
                }}
              >
                Retry
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
            <Button onClick={handleShare} disabled={sharing}>{sharing ? "Sharing…" : "Share result"}</Button>
            <Button variant="secondary" onClick={onSecondary}>{secondaryLabel}</Button>
          </div>
          {kind === "daily" && onTertiary && (
            <GhostLink onClick={onTertiary}>SEE YOUR STATS</GhostLink>
          )}

          <p role="status" style={{ margin: 0, minHeight: "1.5em", fontSize: "var(--text-small)", color: "var(--fg-2)" }}>
            {shareMessage}
          </p>

          {kind === "daily" && nextIn && (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                letterSpacing: "0.18em",
                color: "var(--fg-3)",
                marginTop: 4,
              }}
            >
              NEXT PUZZLE IN {nextIn.toUpperCase()}
            </div>
          )}
        </div>

        {/* Right — keepsake card */}
        <div style={{ flex: "0 1 380px", width: "100%", minWidth: "min(100%, 300px)" }}>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-xl)",
              padding: "clamp(20px, 3vw, 28px)",
              display: "flex",
              flexDirection: "column",
              gap: 18,
              animation: "fadeup 0.6s var(--ease-editorial) both",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Mark size={16} />
                <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, fontSize: 18 }}>
                  Halve
                </span>
              </div>
              {cardNo && (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    color: "var(--fg-3)",
                  }}
                >
                  {cardNo}
                </span>
              )}
            </div>

            <MiniGrid solution={solution} gridSize={gridSize} />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid var(--hairline)",
                paddingTop: 14,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  letterSpacing: "0.12em",
                  color: "var(--fg-3)",
                }}
              >
                {(displayDate ?? "Practice").toUpperCase()}
              </span>
              <span
                className="tnum"
                style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.12em" }}
              >
                {time} · {difficulty.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
