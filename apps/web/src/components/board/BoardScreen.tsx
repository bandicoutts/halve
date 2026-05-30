"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Puzzle } from "@parity/engine";
import { useGame } from "@/hooks/useGame";
import { useTimer } from "@/hooks/useTimer";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Board } from "./Board";
import { TopBar } from "@/components/ui/TopBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { IconButton } from "@/components/ui/IconButton";
import { Logo } from "@/components/symbols/Logo";
import { Mark } from "@/components/symbols/Mark";
import { Button } from "@/components/ui/Button";

function UndoIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function HintIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

interface WinScreenProps {
  time: string;
  solution: number[][];
  dayNo?: number;
  onHome: () => void;
  onStats: () => void;
}

function WinScreen({ time, solution, dayNo, onHome, onStats }: WinScreenProps) {
  function handleShare() {
    const text = dayNo
      ? `Halve No. ${dayNo} · ${time}`
      : `Halve · ${time}`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        zIndex: 50,
        animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <TopBar
        left={<IconButton label="Close" size={40} onClick={onHome}><CloseIcon /></IconButton>}
        title={<span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-3)" }}>Complete</span>}
        right={<span style={{ width: 40 }} />}
      />
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", padding: "20px 24px 40px", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8, animation: "lm-settle 0.5s cubic-bezier(0.34,1.4,0.5,1)" }}>
          <Mark size={56} />
        </div>
        <h1 style={{ fontSize: 46, fontWeight: 500, letterSpacing: "-0.02em", textAlign: "center", color: "var(--fg-1)", lineHeight: 1.1, margin: 0 }}>
          Solved
        </h1>
        <p style={{ textAlign: "center", color: "var(--fg-2)", marginTop: 10, marginBottom: 24, fontSize: 16 }}>
          in <span className="tnum" style={{ color: "var(--fg-1)", fontWeight: 600 }}>{time}</span>
        </p>

        {/* Share card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-xl)",
            padding: "18px 20px",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <Logo size={17} />
            {dayNo && <span className="tnum" style={{ fontSize: 12, color: "var(--fg-3)" }}>No. {dayNo}</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 3, marginBottom: 14 }}>
            {solution.flat().map((sym, i) => (
              <div key={i} style={{ height: 28, borderRadius: 3, background: sym === 0 ? "var(--symbol-a)" : "var(--symbol-b)", opacity: 0.9 }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 26 }}>
            <div>
              <div className="tnum" style={{ fontSize: 22, fontWeight: 500, color: "var(--fg-1)", lineHeight: 1 }}>{time}</div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-3)", marginTop: 6 }}>Time</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          <Button variant="primary" full onClick={handleShare}>
            <ShareIcon />
            Share result
          </Button>
          <Button variant="secondary" full onClick={onStats}>See your stats</Button>
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export interface BoardScreenProps {
  puzzle: Puzzle;
  /** DB row id for daily puzzles — used to record solves */
  puzzleId?: string;
  /** If provided, shows puzzle number on win screen */
  dayNo?: number;
  /** Back navigation — defaults to "/" */
  backHref?: string;
  /** True when DB was unavailable and a generated fallback is being played */
  isOffline?: boolean;
}

export function BoardScreen({ puzzle, puzzleId, dayNo, backHref = "/", isOffline }: BoardScreenProps) {
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const [showWin, setShowWin] = useState(false);
  const [winTime, setWinTime] = useState("");
  const solveRecorded = useRef(false);

  const { cells, errors, solved, canUndo, usedHint, tap, undo, hint } = useGame({
    givens: puzzle.givens,
    solution: puzzle.solution,
    edges: puzzle.edges,
  });

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

  // Record solve once when the puzzle is completed
  useEffect(() => {
    if (!solved || solveRecorded.current || !puzzleId) return;
    solveRecorded.current = true;
    const durationMs = secs * 1000;
    const hintUsed = usedHint;
    const pid = puzzleId;
    void (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("solves").insert({
        user_id: user.id,
        puzzle_id: pid,
        duration_ms: durationMs,
        used_hint: hintUsed,
      });
    })();
  }, [solved, puzzleId, secs, usedHint]);

  const [cellSize, setCellSize] = useState(48);
  useEffect(() => {
    const compute = () =>
      Math.floor(Math.min((window.innerWidth - 48) / 6, (window.innerHeight * 0.55) / 6));
    setCellSize(compute());
    const handler = () => setCellSize(compute());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  const gap = Math.max(6, Math.floor(cellSize * 0.16));

  const handleBack = useCallback(() => router.push(backHref), [router, backHref]);
  const handleStats = useCallback(() => router.push("/stats"), [router]);

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
        left={<IconButton label="Back" size={40} onClick={handleBack}><BackIcon /></IconButton>}
        title={
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-3)" }}>
            {puzzle.difficulty}
          </span>
        }
        right={<ThemeToggle theme={theme} onToggle={toggleTheme} />}
      />

      {isOffline && (
        <p style={{ margin: "8px 24px 0", fontSize: 13, color: "var(--fg-3)", textAlign: "center" }}>
          {"Today's puzzle is unavailable — playing a practice puzzle instead."}
        </p>
      )}
      <div style={{ textAlign: "center", paddingTop: 8 }}>
        <div className="tnum" style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1, color: solved ? "var(--correct)" : "var(--fg-1)", transition: "color 0.2s" }}>
          {formatted}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
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

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 36, padding: "8px 24px 40px" }}>
        <ControlButton label="Undo" disabled={!canUndo} onClick={undo}>
          <UndoIcon />
        </ControlButton>
        <ControlButton label="Hint" onClick={hint}>
          <HintIcon />
        </ControlButton>
      </div>

      {showWin && (
        <WinScreen
          time={winTime}
          solution={puzzle.solution}
          dayNo={dayNo}
          onHome={handleBack}
          onStats={handleStats}
        />
      )}
    </div>
  );
}

function BackIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

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
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-3)" }}>
        {label}
      </span>
    </div>
  );
}
