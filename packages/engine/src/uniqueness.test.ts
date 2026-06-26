import { describe, expect, it } from 'vitest';
import { emptyGrid } from './board.js';
import { countSolutions, hasUniqueSolution } from './uniqueness.js';
import type { Sym } from './types.js';

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
