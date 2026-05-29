"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Puzzle } from "@parity/engine";
import { useGame } from "@/hooks/useGame";
import { useTimer } from "@/hooks/useTimer";
import { Board } from "@/components/board/Board";
import { TopBar } from "@/components/ui/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { Mark } from "@/components/symbols/Mark";
import { Fire } from "@/components/symbols/Fire";
import { Water } from "@/components/symbols/Water";
import { EdgeSign } from "@/components/symbols/EdgeSign";

// ─── mini demo primitives ────────────────────────────────────────────────────

function MiniCell({ sym, size = 44 }: { sym: 0 | 1 | null; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "var(--radius-cell)",
      background: sym === null ? "var(--bg-sunken)" : "var(--surface)",
      border: `1.5px solid ${sym === null ? "var(--hairline)" : "transparent"}`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      {sym === 0 && <Fire size={size * 0.52} />}
      {sym === 1 && <Water size={size * 0.52} />}
    </div>
  );
}

function BadgeCircle({ ok }: { ok: boolean }) {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
      background: ok ? "var(--correct-tint, #d6f0e0)" : "var(--wrong-tint, #fde8e6)",
      color: ok ? "var(--correct)" : "var(--wrong)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: 700,
    }}>
      {ok ? "✓" : "✗"}
    </div>
  );
}

function DemoRow({ cells, badge }: { cells: (0|1|null)[]; badge?: "ok"|"bad" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div style={{ display: "flex", gap: 7 }}>
        {cells.map((s, i) => <MiniCell key={i} sym={s} size={38} />)}
      </div>
      {badge && <BadgeCircle ok={badge === "ok"} />}
    </div>
  );
}

// ─── step demos ─────────────────────────────────────────────────────────────

function Demo0() {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <MiniCell sym={0} /><MiniCell sym={1} /><MiniCell sym={null} /><MiniCell sym={0} />
    </div>
  );
}

function Demo1() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <DemoRow cells={[0, 0, 0]} badge="bad" />
      <DemoRow cells={[0, 0, 1]} badge="ok" />
    </div>
  );
}

function Demo2() {
  return <DemoRow cells={[0, 1, 1, 0]} badge="ok" />;
}

function Demo3() {
  const pair = (a: 0|1, sign: "eq"|"ne", b: 0|1) => (
    <div style={{ display: "flex", alignItems: "center" }}>
      <MiniCell sym={a} size={40} />
      <div style={{ margin: "0 -3px", zIndex: 2 }}><EdgeSign sign={sign} size={22} /></div>
      <MiniCell sym={b} size={40} />
    </div>
  );
  return (
    <div style={{ display: "flex", gap: 24 }}>
      {pair(0, "eq", 0)}
      {pair(0, "ne", 1)}
    </div>
  );
}

// ─── step data ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    title: "Two symbols",
    body: "Every cell holds either fire or water. Tap a cell to place one, tap again to switch.",
    Demo: Demo0,
  },
  {
    title: "Never three in a row",
    body: "No more than two of the same symbol may sit side by side — across a row or down a column.",
    Demo: Demo1,
  },
  {
    title: "Balanced lines",
    body: "Each row and each column must hold an equal count of fire and water.",
    Demo: Demo2,
  },
  {
    title: "Read the signs",
    body: "A sign between two cells links them: = means the same symbol, ≠ means opposites.",
    Demo: Demo3,
  },
];

// ─── progress dots ────────────────────────────────────────────────────────────

function Dots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          height: 7,
          width: i === current ? 22 : 7,
          borderRadius: 999,
          background: i === current ? "var(--accent)" : "var(--hairline)",
          transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
        }} />
      ))}
    </div>
  );
}

// ─── tutorial steps view ─────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function HintIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" /><path d="M10 22h4" />
    </svg>
  );
}

interface TutorialStepsProps {
  onPlay: () => void;
  onBack: () => void;
}

function TutorialSteps({ onPlay, onBack }: TutorialStepsProps) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <TopBar
        left={
          <IconButton label="Back" size={40} onClick={() => step === 0 ? onBack() : setStep(step - 1)}>
            <BackIcon />
          </IconButton>
        }
        title={<span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-3)" }}>How to play</span>}
        right={
          <button onClick={onPlay} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "var(--fg-3)", padding: "0 4px" }}>
            Skip
          </button>
        }
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 24px" }}>
        {/* Demo */}
        <div key={step} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 40, animation: "fade-up 0.18s cubic-bezier(0.4,0,0.2,1)" }}>
          <div style={{ display: "flex", justifyContent: "center", minHeight: 120, alignItems: "center" }}>
            <s.Demo />
          </div>

          {/* Text */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)" }}>
              {String(step + 1).padStart(2, "0")}&nbsp;/&nbsp;{String(STEPS.length).padStart(2, "0")}
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--fg-1)", margin: "12px 0 0", lineHeight: 1.1 }}>
              {s.title}
            </h2>
            <p style={{ fontSize: 16, color: "var(--fg-2)", marginTop: 12, lineHeight: 1.6, maxWidth: 320 }}>
              {s.body}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 40 }}>
          <Dots total={STEPS.length} current={step} />
          <Button variant="primary" onClick={() => isLast ? onPlay() : setStep(step + 1)}>
            {isLast ? "Play today" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── tutorial board view ──────────────────────────────────────────────────────

interface TutorialBoardProps {
  puzzle: Puzzle;
  onWin: (time: string, solution: number[][]) => void;
  onBack: () => void;
}

function TutorialBoard({ puzzle, onWin, onBack }: TutorialBoardProps) {
  const { cells, errors, solved, canUndo, tap, undo, hint } = useGame({
    givens: puzzle.givens,
    solution: puzzle.solution,
    edges: puzzle.edges,
  });
  const { formatted } = useTimer(!solved);
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (solved && !fired) {
      setFired(true);
      setTimeout(() => onWin(formatted, puzzle.solution), 520);
    }
  }, [solved, fired, formatted, onWin, puzzle.solution]);

  const [cellSize, setCellSize] = useState(64);
  useEffect(() => {
    const compute = () => Math.floor(Math.min((window.innerWidth - 48) / 4, (window.innerHeight * 0.55) / 4));
    setCellSize(compute());
    const h = () => setCellSize(compute());
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const gap = Math.max(7, Math.floor(cellSize * 0.14));

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
      <TopBar
        left={<IconButton label="Back" size={40} onClick={onBack}><BackIcon /></IconButton>}
        title={<span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-3)" }}>Practice puzzle</span>}
        right={<span style={{ width: 40 }} />}
      />
      <div style={{ textAlign: "center", paddingTop: 8 }}>
        <div className="tnum" style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1, color: solved ? "var(--correct)" : "var(--fg-1)", transition: "color 0.2s" }}>
          {formatted}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <Board cells={cells} givens={puzzle.givens} edges={puzzle.edges} errors={errors} onCellTap={tap} cellSize={cellSize} gap={gap} readOnly={solved} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 36, padding: "8px 24px 40px" }}>
        <ControlButton label="Undo" disabled={!canUndo} onClick={undo}><UndoIcon /></ControlButton>
        <ControlButton label="Hint" onClick={hint}><HintIcon /></ControlButton>
      </div>
    </div>
  );
}

function ControlButton({ label, onClick, disabled, children }: { label: string; onClick?: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <IconButton label={label} onClick={onClick} disabled={disabled} size={48}>{children}</IconButton>
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-3)" }}>{label}</span>
    </div>
  );
}

// ─── win screen ───────────────────────────────────────────────────────────────

function TutorialWin({ time, solution }: { time: string; solution: number[][] }) {
  const router = useRouter();
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "var(--bg)", zIndex: 50, animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 24px", gap: 4 }}>
        <div style={{ marginBottom: 8, animation: "lm-settle 0.5s cubic-bezier(0.34,1.4,0.5,1)" }}>
          <Mark size={64} />
        </div>
        <h1 style={{ fontSize: 46, fontWeight: 500, letterSpacing: "-0.02em", textAlign: "center", color: "var(--fg-1)", lineHeight: 1.1, margin: 0 }}>
          You got it
        </h1>
        <p style={{ textAlign: "center", color: "var(--fg-2)", marginTop: 10, marginBottom: 28, fontSize: 16 }}>
          in <span className="tnum" style={{ color: "var(--fg-1)", fontWeight: 600 }}>{time}</span>
        </p>

        {/* Mini solved board */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, marginBottom: 32 }}>
          {solution.flat().map((sym, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: "var(--radius-cell)", background: sym === 0 ? "var(--symbol-fire)" : "var(--symbol-water)", opacity: 0.9 }} />
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 360 }}>
          <Button variant="primary" full onClick={() => router.push("/play")}>Play today's puzzle</Button>
          <Button variant="secondary" full onClick={() => router.push("/")}>Go home</Button>
        </div>
      </div>
    </div>
  );
}

// ─── main export ──────────────────────────────────────────────────────────────

export function TutorialScreen() {
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem("parity-tutorial-seen", "1");
  }, []);

  return (
    <TutorialSteps
      onPlay={() => router.push("/play")}
      onBack={() => router.push("/")}
    />
  );
}
