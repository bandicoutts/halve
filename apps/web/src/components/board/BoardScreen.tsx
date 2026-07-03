"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Grid, Puzzle } from "@parity/engine";
import { useGame } from "@/hooks/useGame";
import { useTimer } from "@/hooks/useTimer";
import { useRecordSolve } from "@/hooks/useRecordSolve";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { Board } from "./Board";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { Button } from "@/components/ui/Button";
import { Disc } from "@/components/symbols/Disc";
import { Ring } from "@/components/symbols/Ring";
import { WinScreen } from "@/components/screens/WinScreen";
import { RulesModal } from "@/components/screens/RulesModal";
import { freshPracticeSlot } from "@/lib/practice-slot";

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

// ─── Pill control (Undo / Hint / Restart) ─────────────────────────────────────

function Pill({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick?: (() => void) | undefined;
  disabled?: boolean | undefined;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        background: "none",
        border: "1px solid var(--hairline)",
        borderRadius: 999,
        padding: "12px 22px",
        cursor: disabled ? "default" : "pointer",
        color: "inherit",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        letterSpacing: "0.16em",
        opacity: disabled ? 0.35 : 1,
        transition: "border-color 0.2s, color 0.2s",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.color = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--hairline)";
        e.currentTarget.style.color = "inherit";
      }}
    >
      {label}
    </button>
  );
}

// ─── BoardScreen ──────────────────────────────────────────────────────────────

export interface BoardScreenProps {
  puzzle: Puzzle;
  /** DB row id — used to record solves */
  puzzleId?: string | undefined;
  /** Day number shown on win screen */
  dayNo?: number | undefined;
  /** ISO date string (YYYY-MM-DD) for the keepsake card */
  date?: string | undefined;
  /** Drives win screen variant and streak fetch */
  kind?: "daily" | "archive" | "practice" | undefined;
  /** Back navigation — defaults to "/" */
  backHref?: string | undefined;
  /** True when DB was unavailable and a generated fallback is being played */
  isOffline?: boolean | undefined;
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
  const [showWin, setShowWin] = useState(false);
  const [winTime, setWinTime] = useState("");
  const [showRules, setShowRules] = useState(false);
  const solveRecorded = useRef(false);
  // Kept current on every render so the solve-recording effect always reads the
  // latest cells/duration without needing them in its dep array.
  const cellsRef = useRef<Grid>([]);

  const { cells, errors, solved, canUndo, usedHint, tap, undo, hint, restart } = useGame({
    givens: puzzle.givens,
    solution: puzzle.solution,
    edges: puzzle.edges,
  });

  // Keep the ref current so the solve-recording effect reads the latest cells
  // without needing them in its dep array. Runs before the solve effect below
  // (effects fire top-to-bottom), so cellsRef holds the solved grid at record time.
  useEffect(() => {
    cellsRef.current = cells;
  });

  // The timer still ticks purely to feed the Win reveal + solve record — no
  // visible readout during play (WEB-UX-1: ambient time pressure conflicts with
  // the calm brand voice; solve time is revealed on the Win screen).
  const { secsRef, getFormatted } = useTimer(!solved);

  const { recordAndFetch, saveError, streakData } = useRecordSolve({
    puzzleId,
    usedHint,
    kind,
    cellsRef,
    secsRef,
  });

  useEffect(() => {
    if (solved && !showWin) {
      const t = setTimeout(() => {
        setWinTime(getFormatted());
        setShowWin(true);
      }, 900); // let the diagonal solve wave complete first
      return () => clearTimeout(t);
    }
  }, [solved, showWin]);

  // Record solve once when solved. solveRecorded guards against re-entry.
  useEffect(() => {
    if (!solved || solveRecorded.current || !puzzleId) return;
    solveRecorded.current = true;
    void recordAndFetch();
  }, [solved, puzzleId, recordAndFetch]);

  // Abandon guard — leaving mid-puzzle loses in-progress work, so header
  // navigation is intercepted while the board has un-undoable progress.
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const abandonRef = useFocusTrap<HTMLDivElement>(showAbandonConfirm, () => {
    setShowAbandonConfirm(false);
    setPendingHref(null);
  });

  const interceptHref = useCallback(
    (href: string) => {
      if (canUndo && !solved) {
        setPendingHref(href);
        setShowAbandonConfirm(true);
        return true;
      }
      return false;
    },
    [canUndo, solved]
  );

  // Announced politely to screen readers: validation conflicts while playing,
  // then the solve result once the puzzle is complete.
  const liveMessage = solved
    ? `Puzzle solved in ${getFormatted()}.`
    : errors.size > 0
    ? `${errors.size} cell${errors.size === 1 ? "" : "s"} in conflict.`
    : "";

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

  const handleSecondary = useCallback(() => {
    if (kind === "daily") router.push("/stats");
    else if (kind === "archive") router.push(backHref);
    // Practice "Another puzzle" — start a fresh puzzle of the SAME difficulty
    // (a new random slot forces a distinct URL, so a new puzzle is fetched).
    else router.push(`/practice/play?difficulty=${puzzle.difficulty}&r=${freshPracticeSlot()}`);
  }, [kind, router, backHref, puzzle.difficulty]);

  const placed = cells.reduce((n, row) => n + row.filter((v) => v !== null).length, 0);
  const total = puzzle.size * puzzle.size;

  const diffCaps = puzzle.difficulty.toUpperCase();
  const kindCaps = kind === "daily" ? "DAILY" : kind === "archive" ? "ARCHIVE" : "PRACTICE";
  const kicker = `${kindCaps} · ${diffCaps}${dayNo !== undefined ? ` · NO. ${dayNo}` : ""}`;

  const statusMsg = solved
    ? "Solved — beautifully balanced."
    : errors.size > 0
    ? "A rule's broken — check the marked cells."
    : "";

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      <div role="status" aria-live="polite" style={srOnly}>
        {liveMessage}
      </div>

      <SiteHeader hideAuth interceptHref={interceptHref} maxWidth={1200} />

      <h1 style={srOnly}>{`${puzzle.difficulty} puzzle`}</h1>

      {isOffline && (
        <p
          style={{
            margin: "4px auto 0",
            maxWidth: 1200,
            padding: "0 clamp(20px, 4vw, 40px)",
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
          >
            Retry
          </button>
        </p>
      )}

      <section
        style={{
          flex: 1,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(32px, 5vw, 80px)",
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
          padding: "8px clamp(20px, 4vw, 40px) 48px",
          animation: "fadeup 0.45s var(--ease-editorial) both",
        }}
      >
        {/* Board column */}
        <div
          style={{
            flex: "0 1 560px",
            width: "100%",
            maxWidth: "min(560px, calc(100dvh - 300px))",
            minWidth: "min(100%, 280px)",
          }}
        >
          <Board
            cells={cells}
            givens={puzzle.givens}
            edges={puzzle.edges}
            errors={errors}
            onCellTap={tap}
            readOnly={solved}
            solved={solved}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginTop: 14,
              minHeight: 22,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: 17,
                lineHeight: 1.4,
                color: solved ? "var(--accent)" : errors.size > 0 ? "var(--err)" : "var(--fg-3)",
              }}
            >
              {statusMsg}
            </span>
            <span
              className="tnum"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                letterSpacing: "0.14em",
                color: "var(--fg-3)",
                flex: "none",
              }}
            >
              {placed} / {total}
            </span>
          </div>
          <div style={{ height: 2, background: "var(--hairline)", marginTop: 8 }}>
            <div
              style={{
                height: 2,
                background: "var(--accent)",
                width: `${(placed / total) * 100}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div
          style={{
            flex: "1 1 260px",
            maxWidth: 400,
            display: "flex",
            flexDirection: "column",
            gap: 26,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.22em",
              color: "var(--fg-3)",
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "clamp(34px, 4.4vw, 48px)",
              lineHeight: 1,
              letterSpacing: "-0.01em",
            }}
          >
            Find the balance.
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Pill label="UNDO" onClick={undo} disabled={!canUndo || solved} />
            <Pill label="HINT" onClick={hint} disabled={solved} />
            <Pill label="RESTART" onClick={restart} disabled={!canUndo || solved} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: 17,
                color: "var(--fg-3)",
              }}
            >
              Tap a cell to cycle
            </span>
            <Disc size={13} />
            <Ring size={13} strokeWidth={6} />
          </div>

          <button
            onClick={() => setShowRules(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-3)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.18em",
              padding: 0,
              textAlign: "left",
              width: "fit-content",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-3)")}
          >
            RULES
          </button>
        </div>
      </section>

      {showAbandonConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 8, 6, 0.62)",
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={() => {
            setShowAbandonConfirm(false);
            setPendingHref(null);
          }}
        >
          <div
            ref={abandonRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="abandon-confirm-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-xl)",
              maxWidth: 380,
              width: "100%",
              padding: "clamp(24px, 4vw, 32px)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              animation: "fadeup 0.3s var(--ease-editorial) both",
            }}
          >
            <p
              id="abandon-confirm-title"
              style={{
                margin: 0,
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: 24,
                color: "var(--fg-1)",
              }}
            >
              Leave this puzzle?
            </p>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: "var(--fg-3)" }}>
              Your progress on this grid won&rsquo;t be saved.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Button
                variant="secondary"
                full
                onClick={() => {
                  setShowAbandonConfirm(false);
                  setPendingHref(null);
                }}
              >
                Keep playing
              </Button>
              <Button variant="primary" full onClick={() => router.push(pendingHref ?? backHref)}>
                Leave
              </Button>
            </div>
          </div>
        </div>
      )}

      <RulesModal open={showRules} onClose={() => setShowRules(false)} />

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
          onClose={() => router.push(backHref)}
          onSecondary={handleSecondary}
        />
      )}
    </div>
  );
}
