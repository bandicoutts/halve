import type { Grid, Edge, Solution } from "@parity/engine";

export interface StoredGridSpec {
  solution: Solution;
  givens: Grid;
  edges: Edge[];
}

/**
 * Runtime-validates the raw jsonb blob from the puzzles.grid_spec column.
 * Returns a typed StoredGridSpec on success, null if the shape is wrong.
 * Treating a malformed row the same as a missing row means the caller can
 * redirect / fall back without crashing the board.
 */
export function parseGridSpec(raw: unknown, size = 6): StoredGridSpec | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;

  const solution = obj.solution;
  if (!Array.isArray(solution) || solution.length !== size) return null;
  for (const row of solution) {
    if (!Array.isArray(row) || row.length !== size) return null;
    for (const v of row) if (v !== 0 && v !== 1) return null;
  }

  const givens = obj.givens;
  if (!Array.isArray(givens) || givens.length !== size) return null;
  for (const row of givens) {
    if (!Array.isArray(row) || row.length !== size) return null;
    for (const v of row) if (v !== 0 && v !== 1 && v !== null) return null;
  }

  const edges = obj.edges;
  if (!Array.isArray(edges)) return null;
  for (const e of edges) {
    if (!e || typeof e !== "object") return null;
    const { orientation, r, c, kind } = e as Record<string, unknown>;
    if (orientation !== "h" && orientation !== "v") return null;
    if (typeof r !== "number" || typeof c !== "number") return null;
    if (kind !== "eq" && kind !== "ne") return null;
  }

  return {
    solution: solution as Solution,
    givens: givens as Grid,
    edges: edges as Edge[],
  };
}
