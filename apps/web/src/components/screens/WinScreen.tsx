"use client";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Mark } from "@/components/symbols/Mark";
import { Disc } from "@/components/symbols/Disc";
import { Ring } from "@/components/symbols/Ring";
import { HEADER_BAR } from "@/components/ui/Wordmark";
import { formatDateLabel } from "@/lib/local-date";

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The solved grid, rendered small as a keepsake (disc / ring). */
function MiniGrid({ solution, gridSize }: { solution: number[][]; gridSize: number }) {
  const flat = solution.flat();
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gap: 7 }}>
      {flat.map((s, i) => (
        <div
          key={`${Math.floor(i / gridSize)}-${i % gridSize}`}
          style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {s === 0 ? <Disc size={22} /> : <Ring size={22} strokeWidth={5} />}
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
  streak?: number | undefined;
  nextIn?: string | undefined;
  /** True when recording the solve failed — shows a retry prompt. */
  saveError?: boolean | undefined;
  /** Re-attempts the solve insert. */
  onRetrySave?: (() => void) | undefined;
  onClose: () => void;
  onSecondary: () => void;
}

export function WinScreen({
  kind,
  time,
  solution,
  gridSize = 6,
  dayNo,
  date,
  difficulty,
  streak,
  nextIn,
  saveError,
  onRetrySave,
  onClose,
  onSecondary,
}: WinScreenProps) {
  const { toggle } = useTheme();
  // The win screen is a full-screen overlay: trap focus while shown, restore on close.
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose);

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
      ? `${cap(difficulty)} · Practice — the streak was never at stake.`
      : kind === "archive"
      ? `${cap(difficulty)}${displayDate ? ` · ${displayDate}` : ""} · From the archive`
      : `${cap(difficulty)}${displayDate ? ` · ${displayDate}` : ""}${streak ? ` · ${streak}-day streak` : ""}`;

  const secondaryLabel =
    kind === "daily" ? "See your stats" : kind === "archive" ? "Back to archive" : "Another puzzle";

  const cardNo = dayNo !== undefined ? `NO. ${dayNo}` : kind === "practice" ? "PRACTICE" : "";

  function handleShare() {
    // Deliberately no solved-grid emoji (spoiler-free — see product decision):
    // share the result line only.
    const streakPart = kind !== "practice" && streak ? ` · streak ${streak}` : "";
    const idPart = kind !== "practice" && dayNo ? `No. ${dayNo} · ` : "";
    const text = `Halve ${idPart}${time} · ${cap(difficulty)}${streakPart}\nNo spoilers — play at halve.today`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
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
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: "1px solid var(--hairline)",
              background: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <svg viewBox="0 0 200 200" className="theme-glyph" style={{ width: 15, height: 15 }} aria-hidden="true">
              <path d="M95 10 A90 90 0 0 0 95 190 Z" style={{ fill: "var(--fg-1)", opacity: 0.85 }} />
              <circle cx="100" cy="100" r="90" style={{ fill: "none", stroke: "var(--fg-1)", strokeWidth: "10px", opacity: 0.85 }} />
            </svg>
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            suppressHydrationWarning
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-3)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.16em",
              padding: "4px 0",
            }}
          >
            CLOSE
          </button>
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
              color: "var(--accent)",
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
                Couldn&apos;t save your result — check your connection.
              </span>
              <button
                onClick={onRetrySave}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
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
            <button
              onClick={handleShare}
              style={{
                background: "var(--accent)",
                color: "var(--on-accent)",
                border: "none",
                borderRadius: 999,
                padding: "16px 36px",
                fontFamily: "var(--font-sans)",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
            >
              Share result
            </button>
            <button
              onClick={onSecondary}
              style={{
                background: "none",
                color: "var(--fg-1)",
                border: "1px solid var(--hairline)",
                borderRadius: 999,
                padding: "16px 30px",
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                fontWeight: 500,
                cursor: "pointer",
                transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--hairline)";
                e.currentTarget.style.color = "var(--fg-1)";
              }}
            >
              {secondaryLabel}
            </button>
          </div>

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
              borderRadius: 20,
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
