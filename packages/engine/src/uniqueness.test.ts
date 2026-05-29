import { describe, expect, it } from 'vitest';
import { emptyGrid } from './board.js';
import { countSolutions, findAnySolution, hasUniqueSolution } from './uniqueness.js';
import { isSolved } from './validators.js';
import type { Grid, Sym } from './types.js';

const SOLUTION: Sym[][] = [
  [0, 1, 1, 0, 1, 0],
  [1, 0, 0, 1, 0, 1],
  [0, 1, 0, 1, 1, 0],
  [1, 0, 1, 0, 0, 1],
  [1, 1, 0, 0, 1, 0],
  [0, 0, 1, 1, 0, 1],
];

describe('countSolutions / hasUniqueSolution', () => {
  it('counts a complete valid grid as exactly one solution', () => {
    expect(countSolutions(SOLUTION, [])).toBe(1);
    expect(hasUniqueSolution(SOLUTION, [])).toBe(true);
  });

  it('caps the count at 2 for a wide-open grid', () => {
    expect(countSolutions(emptyGrid(6), [])).toBe(2);
    expect(hasUniqueSolution(emptyGrid(6), [])).toBe(false);
  });

  it('caps higher when asked', () => {
    expect(countSolutions(emptyGrid(6), [], 5)).toBe(5);
  });
});

describe('findAnySolution', () => {
  it('completes an empty grid into a valid solution', () => {
    const sol = findAnySolution(emptyGrid(6), []) as Grid;
    expect(sol).not.toBeNull();
    expect(isSolved(sol, [])).toBe(true);
  });

  it('returns null when the start state is unsolvable', () => {
    // A row pre-filled with four 0s cannot be completed under balance.
    const g = emptyGrid(6);
    g[0] = [0, 1, 0, 0, 0, 1] as Sym[]; // four 0s in a row → no valid completion
    expect(findAnySolution(g, [])).toBeNull();
  });
});
