import type { Cell, Grid, Solution, Sym } from './types.js';

/** A fresh size×size grid filled with `null`. */
export function emptyGrid(size: number): Grid {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null as Cell));
}

/** Deep-copy a grid. */
export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice());
}

/** True when the grid has no empty cells. */
export function isComplete(grid: Grid): boolean {
  return grid.every((row) => row.every((cell) => cell !== null));
}

/** Number of filled cells. */
export function filledCount(grid: Grid): number {
  let n = 0;
  for (const row of grid) for (const cell of row) if (cell !== null) n++;
  return n;
}

/** Build a givens grid from a solution + a boolean mask of which cells are revealed. */
export function gridFromMask(solution: Solution, mask: boolean[][]): Grid {
  return solution.map((row, r) => row.map((v, c) => (mask[r]![c] ? v : null)));
}

/** True when the grid matches the solution on every filled cell (empties ignored). */
export function matchesSolution(grid: Grid, solution: Solution): boolean {
  for (let r = 0; r < solution.length; r++) {
    for (let c = 0; c < solution[r]!.length; c++) {
      const v = grid[r]![c];
      if (v !== null && v !== solution[r]![c]) return false;
    }
  }
  return true;
}

/** Narrowing helper: assert a grid is a complete Solution. */
export function asSolution(grid: Grid): Solution {
  return grid.map((row) =>
    row.map((cell) => {
      if (cell === null) throw new Error('asSolution: grid is incomplete');
      return cell;
    }),
  ) as Sym[][];
}
