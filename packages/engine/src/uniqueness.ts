import { cloneGrid } from './board.js';
import { isValid, wouldViolate } from './validators.js';
import type { Edge, Grid, Sym } from './types.js';

function firstEmpty(grid: Grid, size: number): [number, number] | null {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) if (grid[r]![c] === null) return [r, c];
  }
  return null;
}

/**
 * Exhaustive backtracking solution counter, independent of the human solver.
 * Stops early once `cap` solutions are found (default 2 — enough to test uniqueness).
 */
export function countSolutions(givens: Grid, edges: readonly Edge[] = [], cap = 2): number {
  const size = givens.length;
  if (!isValid(givens, edges)) return 0;
  const grid = cloneGrid(givens);
  let count = 0;

  const search = (): void => {
    if (count >= cap) return;
    const next = firstEmpty(grid, size);
    if (next === null) {
      count++;
      return;
    }
    const [r, c] = next;
    for (const val of [0, 1] as Sym[]) {
      if (wouldViolate(grid, r, c, val, edges, size)) continue;
      grid[r]![c] = val;
      search();
      grid[r]![c] = null;
      if (count >= cap) return;
    }
  };

  search();
  return count;
}

/** True when the puzzle has exactly one solution. */
export function hasUniqueSolution(givens: Grid, edges: readonly Edge[] = []): boolean {
  return countSolutions(givens, edges, 2) === 1;
}

/** Return one solution (any), or null if unsolvable. Does not assert uniqueness. */
export function findAnySolution(givens: Grid, edges: readonly Edge[] = []): Grid | null {
  const size = givens.length;
  if (!isValid(givens, edges)) return null;
  const grid = cloneGrid(givens);

  const search = (): boolean => {
    const next = firstEmpty(grid, size);
    if (next === null) return true;
    const [r, c] = next;
    for (const val of [0, 1] as Sym[]) {
      if (wouldViolate(grid, r, c, val, edges, size)) continue;
      grid[r]![c] = val;
      if (search()) return true;
      grid[r]![c] = null;
    }
    return false;
  };

  return search() ? grid : null;
}
