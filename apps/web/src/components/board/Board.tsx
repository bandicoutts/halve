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
}

export function Board({
  cells,
  givens,
  edges,
  errors,
  onCellTap,
  cellSize = 50,
  gap = 9,
  readOnly = false,
}: BoardProps) {
  const N = cells.length;
  const total = N * cellSize + (N - 1) * gap;
  const span = (i: number) => i * (cellSize + gap);

  const edgeSignSize = Math.max(20, cellSize * 0.42);

  return (
    <div style={{ position: "relative", width: total, height: total }}>
      {/* Grid of cells */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${N}, ${cellSize}px)`,
          gap,
          position: "relative",
          zIndex: 1,
        }}
      >
        {cells.map((row, r) =>
          row.map((v, c) => (
            <Cell
              key={`${r}-${c}`}
              value={v}
              isGiven={!!givens[r][c]}
              isError={errors.has(`${r}-${c}`)}
              size={cellSize}
              onClick={readOnly ? undefined : () => onCellTap?.(r, c)}
            />
          ))
        )}
      </div>

      {/* Edge signs — positioned over the gap between cells */}
      {edges.map((edge, i) => {
        const { orientation: o, r, c } = edge;
        const cx = o === "h" ? span(c) + cellSize + gap / 2 : span(c) + cellSize / 2;
        const cy = o === "h" ? span(r) + cellSize / 2 : span(r) + cellSize + gap / 2;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx,
              top: cy,
              transform: "translate(-50%, -50%)",
              zIndex: 3,
            }}
          >
            <EdgeSign sign={edge.kind} size={edgeSignSize} />
          </div>
        );
      })}
    </div>
  );
}
