import { cloneGrid, isComplete } from './board.js';
import { edgeCells, isValid } from './validators.js';
import { type Edge, type Grid, type Sym } from './types.js';

/** Which deduction technique forced a placement. */
export type Technique = 'adjacency' | 'balance' | 'edge';

export interface SolveStats {
  /** Placements forced by the no-three adjacency rule. */
  adjacency: number;
  /** Placements forced by the row/column balance rule. */
  balance: number;
  /** Placements forced by an `=`/`≠` edge with a known neighbour. */
  edge: number;
  /** Propagation rounds run before the grid stabilised. */
  passes: number;
}

export interface SolveResult {
  grid: Grid;
  /** Fully filled and rule-consistent. */
  solved: boolean;
  /** A cell had no legal value — the start state was inconsistent. */
  contradiction: boolean;
  stats: SolveStats;
}

// A value is forbidden at (r,c) if placing it completes a triple.
function adjacencyForbids(grid: Grid, r: number, c: number, val: Sym, size: number): boolean {
  if (c >= 2 && grid[r]![c - 1] === val && grid[r]![c - 2] === val) return true;
  if (c >= 1 && c + 1 < size && grid[r]![c - 1] === val && grid[r]![c + 1] === val) return true;
  if (c + 2 < size && grid[r]![c + 1] === val && grid[r]![c + 2] === val) return true;
  if (r >= 2 && grid[r - 1]![c] === val && grid[r - 2]![c] === val) return true;
  if (r >= 1 && r + 1 < size && grid[r - 1]![c] === val && grid[r + 1]![c] === val) return true;
  if (r + 2 < size && grid[r + 1]![c] === val && grid[r + 2]![c] === val) return true;
  return false;
}

// Forbidden if the line already holds half of `val`.
function balanceForbids(grid: Grid, r: number, c: number, val: Sym, size: number): boolean {
  const half = size / 2;
  let row = 0;
  for (let cc = 0; cc < size; cc++) if (grid[r]![cc] === val) row++;
  if (row + 1 > half) return true;
  let col = 0;
  for (let rr = 0; rr < size; rr++) if (grid[rr]![c] === val) col++;
  return col + 1 > half;
}

// Forbidden if an edge with a known neighbour rules `val` out.
function edgeForbids(grid: Grid, r: number, c: number, val: Sym, edges: readonly Edge[]): boolean {
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

// First technique that forbids `val` at (r,c), or null if it is allowed.
function forbiddenBy(
  grid: Grid,
  r: number,
  c: number,
  val: Sym,
  edges: readonly Edge[],
  size: number,
): Technique | null {
  if (edgeForbids(grid, r, c, val, edges)) return 'edge';
  if (adjacencyForbids(grid, r, c, val, size)) return 'adjacency';
  if (balanceForbids(grid, r, c, val, size)) return 'balance';
  return null;
}

/**
 * Human-style, deduction-only solver. Repeatedly forces every cell that has
 * exactly one legal value (no guessing) until the grid stabilises.
 * `solved` is true only if propagation alone fully and consistently fills the grid.
 */
export function solve(givens: Grid, edges: readonly Edge[] = []): SolveResult {
  const size = givens.length;
  const grid = cloneGrid(givens);
  const stats: SolveStats = { adjacency: 0, balance: 0, edge: 0, passes: 0 };
  let contradiction = false;

  for (;;) {
    let changed = false;
    stats.passes++;
    for (let r = 0; r < size && !contradiction; r++) {
      for (let c = 0; c < size && !contradiction; c++) {
        if (grid[r]![c] !== null) continue;
        const forbids0 = forbiddenBy(grid, r, c, 0, edges, size);
        const forbids1 = forbiddenBy(grid, r, c, 1, edges, size);
        if (forbids0 && forbids1) {
          contradiction = true;
          break;
        }
        if (forbids0 || forbids1) {
          const val: Sym = forbids0 ? 1 : 0;
          const reason = (forbids0 ?? forbids1)!; // the technique that ruled out the other value
          grid[r]![c] = val;
          stats[reason]++;
          changed = true;
        }
      }
    }
    if (contradiction || !changed) break;
  }

  const solved = !contradiction && isComplete(grid) && isValid(grid, edges);
  return { grid, solved, contradiction, stats };
}

/** Convenience: does deduction alone solve this puzzle (no guessing)? */
export function isDeductionSolvable(givens: Grid, edges: readonly Edge[] = []): boolean {
  return solve(givens, edges).solved;
}
