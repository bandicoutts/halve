"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Grid, Puzzle } from "@parity/engine";
import { useGame } from "@/hooks/useGame";
import { useTimer } from "@/hooks/useTimer";
import { createClient } from "@/lib/supabase/client";
import { recordSolve } from "@/app/actions/record-solve";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Board } from "./Board";
import { TopBar } from "@/components/ui/TopBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { WinScreen } from "@/components/screens/WinScreen";
import Link from "next/link";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeStreakClient(days: string[], today: string): number {
  const set = new Set(days);
  let n = 0;
  const d = new Date(`${today}T00:00:00`);
  while (set.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

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
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--fg-3)",
        }}
      >
        {label}
      </span>
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
  const solveRecorded = useRef(false);
  // Kept current on every render so the solve-recording effect always reads the
  // latest cells without needing cells in its dep array.
  const cellsRef = useRef<Grid>([]);

  const { cells, errors, solved, canUndo, usedHint, tap, undo, hint } = useGame({
    givens: puzzle.givens,
    solution: puzzle.solution,
    edges: puzzle.edges,
  });

  cellsRef.current = cells;

  const { secs, formatted } = useTimer(!solved);

  useEffect(() => {
    if (solved && !showWin) {
      const t = setTimeout(() => {
        setWinTime(formatted);
        setShowWin(true);
      }, 520);
      return () => clearTimeout(t);
    }
  }, [solved, showWin, formatted]);

  // Record solve + fetch streak (daily only)
  useEffect(() => {
    if (!solved || solveRecorded.current || !puzzleId) return;
    solveRecorded.current = true;
    const durationMs = Math.max(1, secs * 1000);
    const hintUsed = usedHint;
    const pid = puzzleId;
    const finalGrid = cellsRef.current;
    void (async () => {
      const result = await recordSolve({
        puzzleId: pid,
        grid: finalGrid,
        durationMs,
        usedHint: hintUsed,
        localDate: new Date().toLocaleDateString("en-CA"),
      });

      if (!result.ok && !result.alreadySolved) {
        console.error("Failed to record solve");
        return;
      }

      if (kind === "daily") {
        const today = new Date().toLocaleDateString("en-CA");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
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
          streak: computeStreakClient(days, today),
          nextIn: computeNextIn(),
        });
      }
    })();
  }, [solved, puzzleId, secs, usedHint, kind]);

  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

  const [cellSize, setCellSize] = useState(48);
  useEffect(() => {
    const compute = () =>
      Math.floor(
        Math.min((window.innerWidth - 48) / 6, (window.innerHeight * 0.55) / 6)
      );
    setCellSize(compute());
    const handler = () => setCellSize(compute());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  const gap = Math.max(6, Math.floor(cellSize * 0.16));

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
      <TopBar
        left={
          <IconButton label="Back" size={40} onClick={handleBack}>
            <BackIcon />
          </IconButton>
        }
        title={
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--fg-3)",
            }}
          >
            {puzzle.difficulty}
          </span>
        }
        right={<ThemeToggle theme={theme} onToggle={toggleTheme} />}
      />

      {isOffline && (
        <p
          style={{
            margin: "8px 24px 0",
            fontSize: 13,
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
              fontSize: 13,
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
          style={{
            fontSize: 44,
            fontWeight: 500,
            letterSpacing: "-0.01em",
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
      </div>

      {showAbandonConfirm ? (
        <div
          style={{
            padding: "16px 24px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            animation: "fade-up 0.18s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <p style={{ fontSize: 15, color: "var(--fg-2)", margin: 0, textAlign: "center" }}>
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
                fontSize: 13,
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
          onClose={handleBack}
          onSecondary={handleSecondary}
        />
      )}
    </div>
  );
}
