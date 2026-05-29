import { isComplete } from './board.js';
import type { Edge, Grid, Sym } from './types.js';

/** The two cells an edge constrains: [r1,c1,r2,c2]. */
export function edgeCells(edge: Edge): [number, number, number, number] {
  return edge.orientation === 'h'
    ? [edge.r, edge.c, edge.r, edge.c + 1]
    : [edge.r, edge.c, edge.r + 1, edge.c];
}

/**
 * Cells that currently break a rule, as a set of `"r-c"` keys.
 * Used both for UI highlighting and validity checks. Empty cells never conflict.
 */
export function findViolations(grid: Grid, edges: readonly Edge[]): Set<string> {
  const size = grid.length;
  const half = size / 2;
  const bad = new Set<string>();
  const mark = (r: number, c: number) => bad.add(`${r}-${c}`);

  // Adjacency: no three identical in a row, horizontally or vertically.
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = grid[r]![c];
      if (v === null) continue;
      if (c + 2 < size && grid[r]![c + 1] === v && grid[r]![c + 2] === v) {
        mark(r, c);
        mark(r, c + 1);
        mark(r, c + 2);
      }
      if (r + 2 < size && grid[r + 1]![c] === v && grid[r + 2]![c] === v) {
        mark(r, c);
        mark(r + 1, c);
        mark(r + 2, c);
      }
    }
  }

  // Balance: no line may hold more than half of either symbol.
  for (let r = 0; r < size; r++) {
    for (const sym of [0, 1] as Sym[]) {
      const cols: number[] = [];
      for (let c = 0; c < size; c++) if (grid[r]![c] === sym) cols.push(c);
      if (cols.length > half) for (const c of cols) mark(r, c);
    }
  }
  for (let c = 0; c < size; c++) {
    for (const sym of [0, 1] as Sym[]) {
      const rows: number[] = [];
      for (let r = 0; r < size; r++) if (grid[r]![c] === sym) rows.push(r);
      if (rows.length > half) for (const r of rows) mark(r, c);
    }
  }

  // Edges: `eq` cells must match, `ne` must differ (only when both filled).
  for (const edge of edges) {
    const [r1, c1, r2, c2] = edgeCells(edge);
    const a = grid[r1]?.[c1];
    const b = grid[r2]?.[c2];
    if (a === null || a === undefined || b === null || b === undefined) continue;
    const ok = edge.kind === 'eq' ? a === b : a !== b;
    if (!ok) {
      mark(r1, c1);
      mark(r2, c2);
    }
  }

  return bad;
}

/** True when the grid (possibly partial) breaks no rule. */
export function isValid(grid: Grid, edges: readonly Edge[]): boolean {
  return findViolations(grid, edges).size === 0;
}

/** True when the grid is fully filled and breaks no rule. */
export function isSolved(grid: Grid, edges: readonly Edge[]): boolean {
  return isComplete(grid) && isValid(grid, edges);
}

/**
 * Would placing `val` at the empty cell (r,c) immediately break a rule?
 * Checks the local triple, line-balance overflow, and any edge with a known
 * neighbour. Fast prune for the solver and uniqueness search — assumes (r,c) is empty.
 */
export function wouldViolate(
  grid: Grid,
  r: number,
  c: number,
  val: Sym,
  edges: readonly Edge[],
  size: number,
): boolean {
  // Triple through (r,c), horizontally.
  if (c >= 2 && grid[r]![c - 1] === val && grid[r]![c - 2] === val) return true;
  if (c >= 1 && c + 1 < size && grid[r]![c - 1] === val && grid[r]![c + 1] === val) return true;
  if (c + 2 < size && grid[r]![c + 1] === val && grid[r]![c + 2] === val) return true;
  // Triple through (r,c), vertically.
  if (r >= 2 && grid[r - 1]![c] === val && grid[r - 2]![c] === val) return true;
  if (r >= 1 && r + 1 < size && grid[r - 1]![c] === val && grid[r + 1]![c] === val) return true;
  if (r + 2 < size && grid[r + 1]![c] === val && grid[r + 2]![c] === val) return true;

  // Balance overflow on the row / column.
  const half = size / 2;
  let rowCount = 0;
  for (let cc = 0; cc < size; cc++) if (grid[r]![cc] === val) rowCount++;
  if (rowCount + 1 > half) return true;
  let colCount = 0;
  for (let rr = 0; rr < size; rr++) if (grid[rr]![c] === val) colCount++;
  if (colCount + 1 > half) return true;

  // Edges touching (r,c) with a known neighbour.
  for (const edge of edges) {
    const [r1, c1, r2, c2] = edgeCells(edge);
    let nv: Sym | null | undefined;
    if (r1 === r && c1 === c) nv = grid[r2]?.[c2];
    else if (r2 === r && c2 === c) nv = grid[r1]?.[c1];
    else continue;
    if (nv === null || nv === undefined) continue;
    if (edge.kind === 'eq' ? val !== nv : val === nv) return true;
  }

  return false;
}
