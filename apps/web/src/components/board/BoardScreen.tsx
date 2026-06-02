"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Grid, Puzzle } from "@parity/engine";
import { useGame } from "@/hooks/useGame";
import { useTimer } from "@/hooks/useTimer";
import { computeStreak } from "@/lib/streak";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { createClient } from "@/lib/supabase/client";
import { recordSolve } from "@/app/actions/record-solve";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Board } from "./Board";
import { TopBar } from "@/components/ui/TopBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { WinScreen } from "@/components/screens/WinScreen";
import Link from "next/link";

// Visually hidden but available to screen readers (for aria-live regions).
const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeNextIn(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackIcon() {
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
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function UndoIcon() {
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
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function HintIcon() {
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
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

// ─── ControlButton ────────────────────────────────────────────────────────────

function ControlButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <IconButton label={label} onClick={onClick} disabled={disabled} size={48}>
        {children}
      </IconButton>
      <Eyebrow>{label}</Eyebrow>
    </div>
  );
}

// ─── BoardScreen ──────────────────────────────────────────────────────────────

export interface BoardScreenProps {
  puzzle: Puzzle;
  /** DB row id — used to record solves */
  puzzleId?: string;
  /** Day number shown on win screen */
  dayNo?: number;
  /** ISO date string (YYYY-MM-DD) for the keepsake card */
  date?: string;
  /** Drives win screen variant and streak fetch */
  kind?: "daily" | "archive" | "practice";
  /** Back navigation — defaults to "/" */
  backHref?: string;
  /** True when DB was unavailable and a generated fallback is being played */
  isOffline?: boolean;
}

export function BoardScreen({
  puzzle,
  puzzleId,
  dayNo,
  date,
  kind = "daily",
  backHref = "/",
  isOffline,
}: BoardScreenProps) {
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const [showWin, setShowWin] = useState(false);
  const [winTime, setWinTime] = useState("");
  const [streakData, setStreakData] = useState<{
    streak: number;
    nextIn: string;
  } | null>(null);
  const [saveError, setSaveError] = useState(false);
  const solveRecorded = useRef(false);
  // Kept current on every render so the solve-recording effect always reads the
  // latest cells/duration without needing them in its dep array.
  const cellsRef = useRef<Grid>([]);
  const secsRef = useRef(0);

  const { cells, errors, solved, canUndo, usedHint, tap, undo, hint } = useGame({
    givens: puzzle.givens,
    solution: puzzle.solution,
    edges: puzzle.edges,
  });

  cellsRef.current = cells;

  const { secs, formatted } = useTimer(!solved);
  secsRef.current = secs;

  useEffect(() => {
    if (solved && !showWin) {
      const t = setTimeout(() => {
        setWinTime(formatted);
        setShowWin(true);
      }, 520);
      return () => clearTimeout(t);
    }
  }, [solved, showWin, formatted]);

  // Record the solve, then (daily only) fetch the streak for the win screen.
  // Reads duration/grid from refs so it never needs them in a dep array, and is
  // safe to call again from the win-screen Retry button after a save failure.
  const recordAndFetch = useCallback(async () => {
    if (!puzzleId) return;
    setSaveError(false);
    // Guests get a silent no-op — no solve to record, no streak to show.
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const result = await recordSolve({
      puzzleId,
      grid: cellsRef.current,
      durationMs: Math.max(1, secsRef.current * 1000),
      usedHint,
      localDate: new Date().toLocaleDateString("en-CA"),
    });

    if (!result.ok && !result.alreadySolved) {
      setSaveError(true);
      return;
    }

    if (kind === "daily") {
      const today = new Date().toLocaleDateString("en-CA");
      const { data: solveDays } = await supabase
        .from("solves")
        .select("solved_at, local_date")
        .eq("user_id", user.id);
      const days = [
        ...new Set(
          (solveDays ?? []).map(
            (r: { solved_at: string; local_date: string | null }) =>
              r.local_date ?? r.solved_at.slice(0, 10)
          )
        ),
      ] as string[];
      setStreakData({
        streak: computeStreak(days, today),
        nextIn: computeNextIn(),
      });
    }
  }, [puzzleId, usedHint, kind]);

  // Record solve once when solved. solveRecorded guards against re-entry.
  useEffect(() => {
    if (!solved || solveRecorded.current || !puzzleId) return;
    solveRecorded.current = true;
    void recordAndFetch();
  }, [solved, puzzleId, recordAndFetch]);

  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const abandonRef = useFocusTrap<HTMLDivElement>(showAbandonConfirm, () =>
    setShowAbandonConfirm(false)
  );

  // Announced politely to screen readers: validation conflicts while playing,
  // then the solve result once the puzzle is complete.
  const liveMessage = solved
    ? `Puzzle solved in ${formatted}.`
    : errors.size > 0
    ? `${errors.size} cell${errors.size === 1 ? "" : "s"} in conflict.`
    : "";

  const boardWrapRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState<number | null>(null);
  useEffect(() => {
    const el = boardWrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      // 6 cells + 5 gaps (gap ≈ 0.16×cellSize) → total ≈ 6.8×cellSize
      setCellSize(Math.floor(entry.contentRect.width / 6.8));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const gap = cellSize ? Math.max(6, Math.floor(cellSize * 0.16)) : 8;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === "z") {
        if (canUndo && !solved) {
          e.preventDefault();
          undo();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canUndo, solved, undo]);

  const handleBack = useCallback(() => {
    if (canUndo && !solved) {
      setShowAbandonConfirm(true);
    } else {
      router.push(backHref);
    }
  }, [router, backHref, canUndo, solved]);

  const handleSecondary = useCallback(() => {
    if (kind === "daily") router.push("/stats");
    else if (kind === "archive") router.push(backHref);
    else router.push("/practice");
  }, [kind, router, backHref]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div role="status" aria-live="polite" style={srOnly}>
        {liveMessage}
      </div>

      <TopBar
        left={
          <IconButton label="Back" size={40} onClick={handleBack}>
            <BackIcon />
          </IconButton>
        }
        title={<Eyebrow>{puzzle.difficulty}</Eyebrow>}
        right={<ThemeToggle theme={theme} onToggle={toggleTheme} />}
      />

      <h1 style={srOnly}>{`${puzzle.difficulty} puzzle`}</h1>

      {isOffline && (
        <p
          style={{
            margin: "8px 24px 0",
            fontSize: "var(--text-small)",
            color: "var(--fg-3)",
            textAlign: "center",
          }}
        >
          {"Today's puzzle is unavailable — playing a practice puzzle instead. "}
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "none",
              border: "none",
              color: "var(--fg-3)",
              fontSize: "var(--text-small)",
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              fontFamily: "var(--font-sans)",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--fg-2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--fg-3)";
            }}
          >
            Retry
          </button>
        </p>
      )}

      <div style={{ textAlign: "center", paddingTop: 8 }}>
        <div
          className="tnum"
          role="timer"
          aria-label={`Elapsed time ${formatted}`}
          style={{
            fontSize: "var(--text-timer)",
            fontWeight: 500,
            letterSpacing: "var(--tracking-snug)",
            lineHeight: 1,
            color: solved ? "var(--correct)" : "var(--fg-1)",
            transition: "color 0.2s",
          }}
        >
          {formatted}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        {/* CSS-sized container eliminates layout shift; cellSize is derived via ResizeObserver */}
        <div
          ref={boardWrapRef}
          style={{ width: "min(calc(100vw - 48px), 55vh)", aspectRatio: "1" }}
        >
          {cellSize !== null && (
            <Board
              cells={cells}
              givens={puzzle.givens}
              edges={puzzle.edges}
              errors={errors}
              onCellTap={tap}
              cellSize={cellSize}
              gap={gap}
              readOnly={solved}
            />
          )}
        </div>
      </div>

      {showAbandonConfirm ? (
        <div
          ref={abandonRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="abandon-confirm-title"
          tabIndex={-1}
          style={{
            padding: "16px 24px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            animation: "fade-up 0.18s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <p
            id="abandon-confirm-title"
            style={{ fontSize: 15, color: "var(--fg-2)", margin: 0, textAlign: "center" }}
          >
            Leave this puzzle?
          </p>
          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <Button
              variant="secondary"
              full
              onClick={() => setShowAbandonConfirm(false)}
            >
              Keep playing
            </Button>
            <Button variant="primary" full onClick={() => router.push(backHref)}>
              Leave
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 36,
              padding: "8px 24px 16px",
            }}
          >
            <ControlButton label="Undo" disabled={!canUndo} onClick={undo}>
              <UndoIcon />
            </ControlButton>
            <ControlButton label="Hint" onClick={hint}>
              <HintIcon />
            </ControlButton>
          </div>
          <div style={{ textAlign: "center", paddingBottom: 32 }}>
            <Link
              href="/tutorial"
              style={{
                fontSize: "var(--text-small)",
                color: "var(--fg-2)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                minHeight: 44,
                padding: "0 8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--fg-1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--fg-2)";
              }}
            >
              How to play
            </Link>
          </div>
        </>
      )}

      {showWin && (
        <WinScreen
          kind={kind}
          time={winTime}
          solution={puzzle.solution}
          gridSize={puzzle.size}
          dayNo={dayNo}
          date={date}
          difficulty={puzzle.difficulty}
          streak={streakData?.streak}
          nextIn={streakData?.nextIn}
          saveError={saveError}
          onRetrySave={() => void recordAndFetch()}
          onClose={handleBack}
          onSecondary={handleSecondary}
        />
      )}
    </div>
  );
}
