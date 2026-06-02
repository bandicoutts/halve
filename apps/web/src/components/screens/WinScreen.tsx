"use client";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { TopBar } from "@/components/ui/TopBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Mark } from "@/components/symbols/Mark";
import { Logo } from "@/components/symbols/Logo";
import { Fire } from "@/components/symbols/Fire";
import { Water } from "@/components/symbols/Water";

function CloseIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function SolvedBoard({
  solution,
  gridSize,
}: {
  solution: number[][];
  gridSize: number;
}) {
  const flat = solution.flat();
  const cell = 46;
  const gap = 7;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridSize}, ${cell}px)`,
        gap,
        justifyContent: "center",
      }}
    >
      {flat.map((s, i) => (
        <div
          key={i}
          style={{
            width: cell,
            height: cell,
            borderRadius: "var(--radius-sm)",
            background: "var(--bg-sunken)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "cell-pop .4s cubic-bezier(0.34,1.4,0.5,1)",
            animationDelay: `${(i % gridSize) * 16 + Math.floor(i / gridSize) * 20}ms`,
          }}
        >
          {s === 0 ? (
            <Fire size={cell * 0.64} fill="var(--symbol-a)" />
          ) : (
            <Water size={cell * 0.64} fill="var(--symbol-b)" />
          )}
        </div>
      ))}
    </div>
  );
}

export interface WinScreenProps {
  kind: "daily" | "archive" | "practice";
  time: string;
  solution: number[][];
  gridSize?: number;
  dayNo?: number;
  date?: string;
  difficulty: string;
  streak?: number;
  nextIn?: string;
  /** True when recording the solve failed — shows a retry prompt. */
  saveError?: boolean;
  /** Re-attempts the solve insert. */
  onRetrySave?: () => void;
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
  const { theme, toggle } = useTheme();
  // The win screen is a modal overlay: trap focus while shown, restore on close.
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose);

  const eyebrow =
    kind === "practice"
      ? "Practice"
      : dayNo !== undefined
      ? `Puzzle No. ${dayNo}`
      : "Halve";

  const secondaryLabel =
    kind === "daily"
      ? "See your stats"
      : kind === "archive"
      ? "Back to archive"
      : "New puzzle";

  const displayDate = date ? formatDate(date) : undefined;

  function handleShare() {
    const cap = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    let text: string;
    if (kind !== "practice" && dayNo) {
      const streakPart = streak ? ` · streak ${streak}` : "";
      text = `Halve No. ${dayNo} · ${time} · ${cap}${streakPart}\nNo spoilers — play at halve.today`;
    } else {
      text = `Halve · ${time} · ${cap}\nNo spoilers — play at halve.today`;
    }
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
        zIndex: 50,
      }}
    >
      <TopBar
        left={
          <IconButton label="Close" size={44} onClick={onClose}>
            <CloseIcon />
          </IconButton>
        }
        title={<Eyebrow>Complete</Eyebrow>}
        right={<ThemeToggle theme={theme} onToggle={toggle} />}
      />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "8px 24px 36px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 384,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Mark entrance */}
          <div
            style={{
              marginTop: 8,
              animation: "win-mark .6s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <Mark size={48} />
          </div>

          {/* Puzzle identity */}
          <div
            style={{
              marginTop: 18,
              fontSize: "var(--text-label)",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--fg-3)",
              whiteSpace: "nowrap",
            }}
          >
            {eyebrow}
          </div>

          {/* Solve time hero */}
          <div
            style={{
              marginTop: 14,
              fontSize: "var(--text-small)",
              color: "var(--fg-3)",
              letterSpacing: "0.01em",
            }}
          >
            Solved in
          </div>
          <div
            className="tnum"
            style={{
              fontSize: 64,
              fontWeight: 500,
              letterSpacing: "-0.035em",
              color: "var(--fg-1)",
              lineHeight: 1,
              marginTop: 4,
            }}
          >
            {time}
          </div>

          {/* Keepsake card */}
          <div
            style={{
              marginTop: 28,
              width: "100%",
              background: "var(--surface)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-xl)",
              padding: "18px 18px 20px",
              boxShadow: "var(--shadow-md)",
              animation: "win-settle .5s cubic-bezier(0.34,1.4,0.5,1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <Logo size={16} />
              {displayDate && (
                <span
                  style={{
                    fontSize: "var(--text-label)",
                    fontWeight: 600,
                    color: "var(--fg-3)",
                    letterSpacing: "0.02em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayDate}
                </span>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <SolvedBoard solution={solution} gridSize={gridSize} />
            </div>
          </div>

          {/* Meta: difficulty + streak */}
          <div
            style={{
              marginTop: 16,
              fontSize: "var(--text-small)",
              color: "var(--fg-3)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ textTransform: "capitalize" }}>{difficulty}</span>
            {kind === "daily" && streak !== undefined && streak > 0 && (
              <>
                <span aria-hidden="true" style={{ color: "var(--hairline-2)" }}>
                  ·
                </span>
                <span>
                  <span
                    className="tnum"
                    style={{ color: "var(--accent)", fontWeight: 600 }}
                  >
                    {streak}
                  </span>
                  -day streak
                </span>
              </>
            )}
          </div>

          <div style={{ flex: 1, minHeight: 24 }} />

          {/* Save failure — solve wasn't recorded; offer a retry */}
          {saveError && (
            <div
              role="alert"
              style={{
                width: "100%",
                marginTop: 16,
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
              <span style={{ fontSize: "var(--text-small)", color: "var(--fg-2)" }}>
                Couldn&apos;t save your result — check your connection.
              </span>
              <button
                onClick={onRetrySave}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  fontSize: "var(--text-small)",
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

          {/* Actions */}
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 24,
            }}
          >
            <Button variant="primary" full onClick={handleShare}>
              <ShareIcon /> Share result
            </Button>
            <Button variant="secondary" full onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          </div>

          {/* Next puzzle countdown — daily only */}
          {kind === "daily" && nextIn && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: "var(--fg-3)",
                marginTop: 18,
              }}
            >
              <span style={{ fontSize: "var(--text-small)" }}>Next puzzle in</span>
              <span
                className="tnum"
                style={{ fontSize: "var(--text-small)", fontWeight: 600, color: "var(--fg-2)" }}
              >
                {nextIn}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
