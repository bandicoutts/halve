"use client";
import { useCallback, useState } from "react";
import type { Edge, Grid } from "@parity/engine";
import { Cell } from "./Cell";
import { EdgeSign } from "@/components/symbols/EdgeSign";

interface BoardProps {
  cells: Grid;
  givens: Grid;
  edges: Edge[];
  errors: Set<string>;
  onCellTap?: (r: number, c: number) => void;
  cellSize?: number;
  gap?: number;
  readOnly?: boolean;
  /** When true, cells play a one-shot diagonal settle wave on completion. */
  solved?: boolean;
}

const ARROW_DELTA: Record<string, [number, number]> = {
  ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0],
};

export function Board({
  cells,
  givens,
  edges,
  errors,
  onCellTap,
  cellSize = 50,
  gap = 9,
  readOnly = false,
  solved = false,
}: BoardProps) {
  const N = cells.length;
  // Diagonal settle wave: each cell lifts staggered by its distance from the
  // top-left corner, so a completed board resolves corner-to-corner.
  const SETTLE_STEP = 30; // ms between successive diagonals
  const total = N * cellSize + (N - 1) * gap;
  const span = (i: number) => i * (cellSize + gap);
  const edgeSignSize = Math.max(20, cellSize * 0.42);

  // Roving tabindex: only the active cell is in the tab order (one stop into
  // the grid). Arrow keys move focus; the focused cell becomes active so Tab
  // re-enters where you left off. Tracked via onFocus so clicks keep it in sync.
  const [active, setActive] = useState<[number, number]>([0, 0]);
  const onCellFocus = useCallback((r: number, c: number) => setActive([r, c]), []);

  // Per-cell edge-constraint description for screen readers. Each edge is owned
  // by its top-left cell ('h' links to the cell on the right, 'v' to the one
  // below), so folding the rule into that cell's label lets a non-sighted
  // solver hear every constraint while navigating cell by cell.
  const edgeHintByCell = new Map<string, string>();
  for (const e of edges) {
    const phrase = `${e.kind === "eq" ? "Same symbol as" : "Opposite symbol to"} the cell ${e.orientation === "h" ? "to the right" : "below"}`;
    const key = `${e.r}-${e.c}`;
    const prev = edgeHintByCell.get(key);
    edgeHintByCell.set(key, prev ? `${prev}; ${phrase}` : phrase);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const delta = ARROW_DELTA[e.key];
    if (!delta) return;
    const wrapper = (e.target as HTMLElement).closest("[data-row]");
    if (!wrapper) return;
    const r = parseInt(wrapper.getAttribute("data-row") ?? "0", 10);
    const c = parseInt(wrapper.getAttribute("data-col") ?? "0", 10);
    const nr = Math.min(N - 1, Math.max(0, r + delta[0]));
    const nc = Math.min(N - 1, Math.max(0, c + delta[1]));
    if (nr === r && nc === c) return;
    e.preventDefault();
    setActive([nr, nc]); // move the roving tab stop with the arrow keys
    const target = e.currentTarget.querySelector(
      `[data-row="${nr}"][data-col="${nc}"] button`
    ) as HTMLElement | null;
    target?.focus();
  }

  return (
    <div style={{ position: "relative", width: total, height: total }}>
      {/* Grid of cells — data-row/col wrappers enable arrow-key navigation */}
      <div
        role="grid"
        aria-label={`Puzzle grid, ${N} by ${N}`}
        aria-readonly={readOnly || undefined}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${N}, ${cellSize}px)`,
          gap,
          position: "relative",
          zIndex: 1,
        }}
        onKeyDown={handleKeyDown}
      >
        {cells.map((row, r) => (
          <div key={r} role="row" style={{ display: "contents" }}>
            {row.map((v, c) => (
              <div
                key={c}
                role="gridcell"
                data-row={r}
                data-col={c}
                style={{ display: "contents" }}
              >
                <Cell
                  value={v}
                  isGiven={!!givens[r]![c]}
                  isError={errors.has(`${r}-${c}`)}
                  rowIndex={r}
                  colIndex={c}
                  size={cellSize}
                  onCellTap={onCellTap}
                  readOnly={readOnly}
                  settleDelay={solved ? (r + c) * SETTLE_STEP : undefined}
                  tabIndex={r === active[0] && c === active[1] ? 0 : -1}
                  onFocus={onCellFocus}
                  edgeHint={edgeHintByCell.get(`${r}-${c}`)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Edge signs — purely visual; the constraint is announced via the owning
          cell's aria-label (edgeHint above), so these are hidden from SR. */}
      {edges.map((edge) => {
        const { orientation: o, r, c } = edge;
        const cx = o === "h" ? span(c) + cellSize + gap / 2 : span(c) + cellSize / 2;
        const cy = o === "h" ? span(r) + cellSize / 2 : span(r) + cellSize + gap / 2;
        return (
          <div
            key={`${o}-${r}-${c}`}
            aria-hidden
            style={{ position: "absolute", left: cx, top: cy, transform: "translate(-50%, -50%)", zIndex: 3 }}
          >
            <EdgeSign sign={edge.kind} size={edgeSignSize} />
          </div>
        );
      })}
    </div>
  );
}
