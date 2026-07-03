"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { generatePuzzle } from "@parity/engine";
import type { Puzzle } from "@parity/engine";
import { useGame } from "@/hooks/useGame";
import { useTimer } from "@/hooks/useTimer";
import { Board } from "@/components/board/Board";
import { TopBar } from "@/components/ui/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Mark } from "@/components/symbols/Mark";
import { Logo } from "@/components/symbols/Logo";
import { Fire } from "@/components/symbols/Fire";
import { Water } from "@/components/symbols/Water";
import { TeachBoard, GoodBad } from "@/components/tutorial/TeachBoard";
import { BackIcon, CloseIcon } from "@/components/ui/icons";

// ─── Types ───────────────────────────────────────────────────────────────────

type CellValue = 0 | 1 | null;
type Grid2D = CellValue[][];

// ─── Tutorial grid constants ──────────────────────────────────────────────────

const TN = 4;

const TSOL: Grid2D = [
  [0, 1, 1, 0],
  [1, 0, 0, 1],
  [0, 1, 0, 1],
  [1, 0, 1, 0],
];

// Edge signs on the demo board (signs step + intro board)
const TH_EDGES: Record<string, "eq" | "ne"> = { "0,1": "eq", "2,0": "ne" };
const TV_EDGES: Record<string, "eq" | "ne"> = { "1,2": "eq" };

// Edge sign for the deduction walkthrough
const DED_H_EDGES: Record<string, "eq" | "ne"> = { "0,1": "eq" };

const keyOf = (r: number, c: number) => `${r},${c}`;

function fullGrid(): Grid2D {
  return TSOL.map((row) => row.slice()) as Grid2D;
}
function emptyGrid(): Grid2D {
  return Array.from({ length: TN }, () => Array<CellValue>(TN).fill(null));
}
function allGivens(): Record<string, boolean> {
  const g: Record<string, boolean> = {};
  for (let r = 0; r < TN; r++)
    for (let c = 0; c < TN; c++) g[keyOf(r, c)] = true;
  return g;
}

// ─── Deduction walkthrough ────────────────────────────────────────────────────

const DED_LAST = 3;

const DED_CAPTIONS: string[] = [
  "Start from a cell you're given — this one's a ring.",
  "The = sign links it to its neighbour, so that cell is a ring too.",
  "The row now has its two rings, so the rest can only be solids.",
  "Every step was forced. You never had to guess.",
];

const DED_HIGHLIGHTS: string[][] = [
  ["0,1"],
  ["0,1", "0,2"],
  ["0,0", "0,3"],
  [],
];

function getDedCells(phase: number): Grid2D {
  const c = emptyGrid();
  c[0]![1] = 1;
  if (phase >= 1) c[0]![2] = 1;
  if (phase >= 2) {
    c[0]![0] = 0;
    c[0]![3] = 0;
  }
  return c;
}

// ─── ProgressDots ─────────────────────────────────────────────────────────────

function ProgressDots({ count, active }: { count: number; active: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          style={{
            height: 7,
            borderRadius: "var(--radius-full)",
            width: i === active ? 22 : 7,
            background: i === active ? "var(--accent)" : "var(--hairline-2)",
            transition: "width .22s cubic-bezier(0.4,0,0.2,1), background .22s",
            display: "block",
          }}
        />
      ))}
    </div>
  );
}

// ─── ThreeStrip — good/bad row contrast for the line-law step ────────────────

function ThreeStrip({
  values,
  state,
  size,
}: {
  values: (0 | 1)[];
  state: "bad" | "good";
  size: number;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ display: "inline-flex", gap: 5 }}>
        {values.map((v, i) => (
          <div
            key={i}
            style={{
              width: size,
              height: size,
              borderRadius: "var(--radius-cell)",
              background: "var(--surface)",
              border: "1px solid var(--hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {v === 0 ? (
              <Fire size={size * 0.6} fill="var(--symbol-a)" />
            ) : (
              <Water size={size * 0.6} fill="var(--symbol-b)" />
            )}
          </div>
        ))}
      </span>
      <GoodBad good={state === "good"} size={size * 0.65} />
    </span>
  );
}

// ─── TutorialWin ──────────────────────────────────────────────────────────────

function TutorialWin({
  time,
  solution,
  onPlayToday,
  onHome,
}: {
  time: string;
  solution: number[][];
  onPlayToday: () => void;
  onHome: () => void;
}) {
  const flat = solution.flat();
  const cell = 54;
  const gap = 8;

  return (
    <div
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
          <IconButton label="Close" size={40} onClick={onHome}>
            <CloseIcon />
          </IconButton>
        }
        title={<Eyebrow>How to play</Eyebrow>}
        right={<span style={{ width: 40 }} />}
      />
      <h1 className="sr-only">How to play</h1>
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
          {/* Mark entrance — same animation as real Win */}
          <div
            style={{
              marginTop: 8,
              animation: "win-mark .6s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <Mark size={48} />
          </div>

          {/* Eyebrow — accent instead of fg-3, no number to earn yet */}
          <div
            style={{
              marginTop: 18,
              fontSize: "var(--text-label)",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--accent)",
              whiteSpace: "nowrap",
            }}
          >
            You&rsquo;ve got it
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

          {/* Keepsake card — 4×4 in real symbols */}
          <div
            style={{
              marginTop: 28,
              width: "100%",
              background: "var(--surface)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-xl)",
              padding: "18px 18px 22px",
              boxShadow: "var(--shadow-md)",
              animation: "win-settle .5s cubic-bezier(0.34,1.4,0.5,1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 18,
              }}
            >
              <Logo size={16} />
              <span
                style={{
                  fontSize: "var(--text-label)",
                  fontWeight: 600,
                  color: "var(--fg-3)",
                  letterSpacing: "0.02em",
                  whiteSpace: "nowrap",
                }}
              >
                Your first solve
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(4, ${cell}px)`,
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
                      animationDelay: `${(i % 4) * 22 + Math.floor(i / 4) * 26}ms`,
                    }}
                  >
                    {s === 0 ? (
                      <Fire size={cell * 0.62} fill="var(--symbol-a)" />
                    ) : (
                      <Water size={cell * 0.62} fill="var(--symbol-b)" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              fontSize: "var(--text-small)",
              color: "var(--fg-3)",
              textAlign: "center",
              lineHeight: 1.5,
              maxWidth: 280,
            }}
          >
            That&rsquo;s the whole game. Today&rsquo;s board is bigger, but the rules
            don&rsquo;t change.
          </div>

          <div style={{ flex: 1, minHeight: 24 }} />

          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 24,
            }}
          >
            <Button variant="primary" full onClick={onPlayToday}>
              Play today&rsquo;s puzzle
            </Button>
            <Button variant="secondary" full onClick={onHome}>
              Go home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TutorialPractice — hands-on 4×4 solve ───────────────────────────────────

function TutorialPractice({
  onWin,
  onBack,
}: {
  onWin: (time: string, solution: number[][]) => void;
  onBack: () => void;
}) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);

  useEffect(() => {
    setPuzzle(generatePuzzle({ size: 4, difficulty: "easy" }));
  }, []);

  if (!puzzle) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)" }} />
    );
  }

  return <PracticeBoard puzzle={puzzle} onWin={onWin} onBack={onBack} />;
}

function PracticeBoard({
  puzzle,
  onWin,
  onBack,
}: {
  puzzle: Puzzle;
  onWin: (time: string, solution: number[][]) => void;
  onBack: () => void;
}) {
  const { cells, errors, solved, canUndo, tap, undo } = useGame({
    givens: puzzle.givens,
    solution: puzzle.solution,
    edges: puzzle.edges,
  });
  const { getFormatted } = useTimer(!solved, true); // tutorial shows a live timer
  const fired = useRef(false);

  useEffect(() => {
    if (solved && !fired.current) {
      fired.current = true;
      setTimeout(() => onWin(getFormatted(), puzzle.solution), 520);
    }
  }, [solved, onWin, puzzle.solution]);

  const [cellSize, setCellSize] = useState(60);
  useEffect(() => {
    const compute = () =>
      Math.floor(
        Math.min(
          (window.innerWidth - 48) / 4,
          (window.innerHeight * 0.48) / 4
        )
      );
    setCellSize(compute());
    const h = () => setCellSize(compute());
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const gap = Math.max(7, Math.floor(cellSize * 0.14));

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
          <IconButton label="Back" size={40} onClick={onBack}>
            <BackIcon />
          </IconButton>
        }
        title={<Eyebrow>Practice puzzle</Eyebrow>}
        right={<span style={{ width: 40 }} />}
      />

      <h1 className="sr-only">How to play</h1>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px 12px",
          gap: 22,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 300 }}>
          <div
            style={{
              fontSize: "var(--text-h3)",
              fontWeight: 600,
              letterSpacing: "var(--tracking-snug)",
              color: "var(--fg-1)",
            }}
          >
            Your turn
          </div>
          <p
            style={{
              fontSize: "var(--text-small)",
              lineHeight: 1.5,
              color: "var(--fg-3)",
              margin: "6px 0 0",
            }}
          >
            {solved
              ? "Solved — nicely deduced."
              : "Fill the empty cells. Tap to place, tap again to switch."}
          </p>
        </div>

        <div
          className="tnum"
          style={{
            fontSize: "var(--text-h1)",
            fontWeight: 500,
            letterSpacing: "var(--tracking-snug)",
            lineHeight: 1,
            color: solved ? "var(--correct)" : "var(--fg-1)",
            transition: "color 0.2s",
          }}
        >
          {getFormatted()}
        </div>

        {/* Board auto-sizes to its container; reuse the computed cell size to
            keep the tutorial grid at a comparable footprint (full Phase 3
            restyle pending). */}
        <div style={{ width: cellSize * 4 + gap * 3, maxWidth: "calc(100vw - 48px)" }}>
          <Board
            cells={cells}
            givens={puzzle.givens}
            edges={puzzle.edges}
            errors={errors}
            onCellTap={tap}
            readOnly={solved}
          />
        </div>

        <button
          onClick={undo}
          disabled={!canUndo || solved}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 44,
            padding: "0 16px",
            borderRadius: "var(--radius-full)",
            border: "1.5px solid var(--hairline-2)",
            background: "transparent",
            color: canUndo && !solved ? "var(--fg-2)" : "var(--hairline-2)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-small)",
            fontWeight: 500,
            cursor: canUndo && !solved ? "pointer" : "default",
            transition: "all .15s",
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
          </svg>
          Undo
        </button>
      </div>
    </div>
  );
}

// ─── TutorialFlow ─────────────────────────────────────────────────────────────

type FlowMode = "teach" | "practice" | "win";

const STEPS = [
  {
    title: "Two symbols",
    body: "Every cell holds one of two symbols — a solid or a ring. This is a 4×4 board; the daily puzzle is 6×6. Tap the empty cell to try it.",
  },
  {
    title: "Read the signs",
    body: "Some cells are linked by a sign. = means the two cells hold the same symbol; ≠ means they're opposite. These are your surest first moves.",
  },
  {
    title: "The line law",
    body: "Every row and column holds an equal count of each — two and two here. And no symbol may sit three in a row. Together these two rules force most of the board.",
  },
] as const;

const TOTAL_DOTS = STEPS.length + 1; // 3 rule steps + 1 deduction step

function TutorialFlow({
  onPlay,
  onBack,
}: {
  onPlay: () => void;
  onBack: () => void;
}) {
  // idx 0..2 = rule steps, idx 3 = deduction
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState(0);
  const [mode, setMode] = useState<FlowMode>("teach");
  const [winData, setWinData] = useState<{
    time: string;
    solution: number[][];
  } | null>(null);
  // Intro board: full grid with one tappable cell
  const [introCells, setIntroCells] = useState<Grid2D>(() => {
    const g = fullGrid();
    g[1]![1] = null;
    return g;
  });

  const onDeduction = idx === STEPS.length;

  const advance = useCallback(() => {
    if (!onDeduction) {
      setIdx((i) => i + 1);
    } else if (phase < DED_LAST) {
      setPhase((p) => p + 1);
    } else {
      setMode("practice");
    }
  }, [onDeduction, phase]);

  const back = useCallback(() => {
    if (onDeduction) {
      if (phase > 0) {
        setPhase((p) => p - 1);
      } else {
        setIdx(STEPS.length - 1);
      }
    } else if (idx > 0) {
      setIdx((i) => i - 1);
    } else {
      onBack();
    }
  }, [onDeduction, phase, idx, onBack]);

  if (mode === "win" && winData) {
    return (
      <TutorialWin
        time={winData.time}
        solution={winData.solution}
        onPlayToday={onPlay}
        onHome={onBack}
      />
    );
  }

  if (mode === "practice") {
    return (
      <TutorialPractice
        onWin={(time, solution) => {
          setWinData({ time, solution });
          setMode("win");
        }}
        onBack={() => setMode("teach")}
      />
    );
  }

  // ── Build demo ──
  const SIZE = 44;
  const GAP = 20;

  let demo: React.ReactNode;
  let counter: string;
  let title: string;
  let body: string;

  if (onDeduction) {
    const dedCells = getDedCells(phase);
    counter = `${String(TOTAL_DOTS).padStart(2, "0")} / ${String(TOTAL_DOTS).padStart(2, "0")}`;
    title = "It's always provable";
    body = DED_CAPTIONS[phase] ?? "";
    demo = (
      <TeachBoard
        cells={dedCells}
        n={TN}
        size={SIZE}
        gap={GAP}
        givens={{}}
        hEdges={DED_H_EDGES}
        vEdges={{}}
        highlight={DED_HIGHLIGHTS[phase] ?? []}
        focusEdges={phase === 1}
      />
    );
  } else {
    const step = STEPS[idx]!;
    counter = `${String(idx + 1).padStart(2, "0")} / ${String(TOTAL_DOTS).padStart(2, "0")}`;
    title = step.title;
    body = step.body;

    if (idx === 0) {
      // Symbols step: board with one interactive cell
      demo = (
        <TeachBoard
          cells={introCells}
          n={TN}
          size={SIZE}
          gap={GAP}
          givens={allGivens()}
          hEdges={{}}
          vEdges={{}}
          onTap={(r, c) => {
            if (r !== 1 || c !== 1) return;
            setIntroCells((g) => {
              const next = g.map((row) => row.slice()) as Grid2D;
              const cur = g[1]![1];
              next[1]![1] = cur === null ? 0 : cur === 0 ? 1 : null;
              return next;
            });
          }}
        />
      );
    } else if (idx === 1) {
      // Signs step: full board with edge signs highlighted
      demo = (
        <TeachBoard
          cells={fullGrid()}
          n={TN}
          size={SIZE}
          gap={GAP}
          givens={allGivens()}
          hEdges={TH_EDGES}
          vEdges={TV_EDGES}
          focusEdges
        />
      );
    } else {
      // Lines step: full board (row 3 highlighted) + ThreeStrip contrast
      const rowHi = [keyOf(3, 0), keyOf(3, 1), keyOf(3, 2), keyOf(3, 3)];
      const STRIP_CELL = 38;
      demo = (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <TeachBoard
            cells={fullGrid()}
            n={TN}
            size={SIZE}
            gap={GAP}
            givens={allGivens()}
            hEdges={{}}
            vEdges={{}}
            highlight={rowHi}
          />
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <ThreeStrip values={[0, 0, 0]} state="bad" size={STRIP_CELL} />
            <ThreeStrip values={[0, 0, 1]} state="good" size={STRIP_CELL} />
          </div>
        </div>
      );
    }
  }

  const primaryLabel = onDeduction
    ? phase < DED_LAST
      ? "Continue"
      : "Try one yourself"
    : "Continue";

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      <TopBar
        left={
          <IconButton label="Back" size={40} onClick={back}>
            <BackIcon />
          </IconButton>
        }
        title={<Eyebrow>How to play</Eyebrow>}
        right={
          <button
            onClick={onPlay}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "var(--text-small)",
              fontWeight: 600,
              color: "var(--fg-2)",
              fontFamily: "var(--font-sans)",
              padding: "0 6px",
              minHeight: 44,
              display: "inline-flex",
              alignItems: "center",
              transition: "color .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--fg-1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--fg-2)";
            }}
          >
            Skip
          </button>
        }
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <div
          key={onDeduction ? `d${phase}` : `s${idx}`}
          style={{
            width: "100%",
            maxWidth: 360,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            animation: "tut-fade .24s cubic-bezier(0.4,0,0.2,1) both",
          }}
        >
          <div
            style={{
              minHeight: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 28,
            }}
          >
            {demo}
          </div>

          <div
            className="tnum"
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.14em",
              color: "var(--accent)",
              marginBottom: 14,
            }}
          >
            {counter}
          </div>

          <h1
            style={{
              fontSize: 30,
              fontWeight: 500,
              letterSpacing: "-0.025em",
              color: "var(--fg-1)",
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            {title}
          </h1>

          <p
            style={{
              fontSize: 16,
              lineHeight: 1.55,
              color: "var(--fg-2)",
              margin: "12px 0 0",
              maxWidth: 330,
            }}
          >
            {body}
          </p>
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px 28px",
          gap: 16,
        }}
      >
        <ProgressDots count={TOTAL_DOTS} active={onDeduction ? TOTAL_DOTS - 1 : idx} />
        <Button
          variant="primary"
          onClick={advance}
          style={{ height: 50, padding: "0 26px" }}
        >
          {primaryLabel}
        </Button>
      </div>
    </div>
  );
}

// ─── Main export — no props, sets halve-tutorial-seen on mount ────────────────

export function TutorialScreen() {
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem("halve-tutorial-seen", "1");
  }, []);

  return (
    <TutorialFlow
      onPlay={() => router.push("/play")}
      onBack={() => router.push("/")}
    />
  );
}
