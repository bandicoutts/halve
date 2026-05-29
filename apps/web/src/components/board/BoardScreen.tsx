"use client";
import { useCallback, useEffect, useState } from "react";
import type { Puzzle } from "@parity/engine";
import { useGame } from "@/hooks/useGame";
import { useTimer } from "@/hooks/useTimer";
import { Board } from "./Board";
import { TopBar } from "@/components/ui/TopBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { IconButton } from "@/components/ui/IconButton";
import { Logo } from "@/components/symbols/Logo";

/* Lucide icons as inline SVGs — keeps the bundle zero-dep */
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

interface WinBannerProps {
  time: string;
  onDismiss: () => void;
}

function WinBanner({ time, onDismiss }: WinBannerProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.35)",
        zIndex: 50,
        animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)",
      }}
      onClick={onDismiss}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-xl)",
          padding: "40px 48px",
          textAlign: "center",
          maxWidth: 340,
          width: "90%",
          boxShadow: "var(--shadow-lg)",
          animation: "settle 0.32s cubic-bezier(0.4,0,0.2,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--fg-3)",
            marginBottom: 16,
          }}
        >
          Solved
        </div>
        <div
          className="tnum"
          style={{
            fontSize: 44,
            fontWeight: 500,
            color: "var(--correct)",
            letterSpacing: "-0.01em",
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          {time}
        </div>
        <button
          onClick={onDismiss}
          style={{
            height: 52,
            borderRadius: 999,
            border: "none",
            padding: "0 32px",
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            background: "var(--accent)",
            color: "var(--on-accent)",
            cursor: "pointer",
            transition: "background 0.16s, transform 0.12s",
            fontFamily: "var(--font-sans)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-strong)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

interface BoardScreenProps {
  puzzle: Puzzle;
}

export function BoardScreen({ puzzle }: BoardScreenProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showWin, setShowWin] = useState(false);
  const [winTime, setWinTime] = useState("");

  const { cells, errors, solved, canUndo, tap, undo, hint } = useGame({
    givens: puzzle.givens,
    solution: puzzle.solution,
    edges: puzzle.edges,
  });

  const { formatted } = useTimer(!solved);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  useEffect(() => {
    if (solved && !showWin) {
      const t = setTimeout(() => {
        setWinTime(formatted);
        setShowWin(true);
      }, 520);
      return () => clearTimeout(t);
    }
  }, [solved, showWin, formatted]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }, []);

  /* Scale cell size to viewport after mount to avoid hydration mismatch */
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
        left={<Logo size={20} />}
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

      {/* Timer */}
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

      {/* Board — centered, takes available space */}
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

      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
          padding: "8px 24px 40px",
        }}
      >
        <ControlButton label="Undo" disabled={!canUndo} onClick={undo}>
          <UndoIcon />
        </ControlButton>
        <ControlButton label="Hint" onClick={hint}>
          <HintIcon />
        </ControlButton>
      </div>

      {showWin && (
        <WinBanner time={winTime} onDismiss={() => setShowWin(false)} />
      )}
    </div>
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
