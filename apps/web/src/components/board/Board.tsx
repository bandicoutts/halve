"use client";
import { useCallback, useState } from "react";
import type { Edge, EdgeKind, EdgeOrientation, Grid } from "@parity/engine";
import { Cell } from "./Cell";

interface BoardProps {
  cells: Grid;
  givens: Grid;
  edges: Edge[];
  errors: Set<string>;
  onCellTap?: (r: number, c: number) => void;
  readOnly?: boolean;
  /** When true, cells play a one-shot diagonal settle wave on completion. */
  solved?: boolean;
}

const ARROW_DELTA: Record<string, [number, number]> = {
  ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0],
};

// ms between successive diagonals of the solve wave
const SETTLE_STEP = 55;

export function Board({
  cells,
  givens,
  edges,
  errors,
  onCellTap,
  readOnly = false,
  solved = false,
}: BoardProps) {
  const N = cells.length;

  // Roving tabindex: only the active cell is in the tab order (one stop into
  // the grid). Arrow keys move focus; the focused cell becomes active so Tab
  // re-enters where you left off. Tracked via onFocus so clicks keep it in sync.
  const [active, setActive] = useState<[number, number]>([0, 0]);
  const onCellFocus = useCallback((r: number, c: number) => setActive([r, c]), []);

  // Per-cell edge data. The visual cap is owned by the edge's top-left cell
  // ('h' links to the right, 'v' to the cell below). The same ownership feeds
  // the screen-reader phrase so a non-sighted solver hears every constraint.
  const edgeCapByCell = new Map<string, { kind: EdgeKind; orientation: EdgeOrientation }>();
  const edgeHintByCell = new Map<string, string>();
  for (const e of edges) {
    const key = `${e.r}-${e.c}`;
    if (!edgeCapByCell.has(key)) edgeCapByCell.set(key, { kind: e.kind, orientation: e.orientation });
    const phrase = `${e.kind === "eq" ? "Same symbol as" : "Opposite symbol to"} the cell ${e.orientation === "h" ? "to the right" : "below"}`;
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
    <div
      role="grid"
      aria-label={`Puzzle grid, ${N} by ${N}`}
      aria-readonly={readOnly || undefined}
      onKeyDown={handleKeyDown}
      style={{
        width: "100%",
        aspectRatio: "1",
        border: "1px solid var(--hairline)",
        display: "grid",
        gridTemplateColumns: `repeat(${N}, 1fr)`,
        gridTemplateRows: `repeat(${N}, 1fr)`,
      }}
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
                isGiven={givens[r]![c] !== null}
                isError={errors.has(`${r}-${c}`)}
                rowIndex={r}
                colIndex={c}
                n={N}
                onCellTap={onCellTap}
                readOnly={readOnly}
                settleDelay={solved ? (r + c) * SETTLE_STEP : undefined}
                tabIndex={r === active[0] && c === active[1] ? 0 : -1}
                onFocus={onCellFocus}
                edgeHint={edgeHintByCell.get(`${r}-${c}`)}
                edge={edgeCapByCell.get(`${r}-${c}`)}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
