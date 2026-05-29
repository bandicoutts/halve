import { describe, expect, it } from 'vitest';
import { filledCount, isComplete, matchesSolution } from './board.js';
import { classify, measure } from './difficulty.js';
import { generatePuzzle, generateSolution, randomEdges } from './generator.js';
import { mulberry32 } from './rng.js';
import { solve } from './solver.js';
import { hasUniqueSolution } from './uniqueness.js';
import { edgeCells, isSolved } from './validators.js';
import type { Difficulty } from './types.js';

const RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

describe('generateSolution', () => {
  it('produces a valid, complete, balanced grid', () => {
    const rng = mulberry32(123);
    const sol = generateSolution(6, rng);
    expect(isComplete(sol)).toBe(true);
    expect(isSolved(sol, [])).toBe(true);
    // each row and column balanced 3/3
    for (let r = 0; r < 6; r++) {
      expect(sol[r]!.filter((v) => v === 0).length).toBe(3);
    }
    for (let c = 0; c < 6; c++) {
      let ones = 0;
      for (let r = 0; r < 6; r++) if (sol[r]![c] === 1) ones++;
      expect(ones).toBe(3);
    }
  });

  it('is deterministic for a given seed', () => {
    expect(generateSolution(6, mulberry32(42))).toEqual(generateSolution(6, mulberry32(42)));
  });
});

describe('randomEdges', () => {
  it('only emits edges consistent with the solution', () => {
    const rng = mulberry32(7);
    const sol = generateSolution(6, rng);
    const edges = randomEdges(sol, rng, 6);
    for (const e of edges) {
      const [r1, c1, r2, c2] = edgeCells(e);
      const same = sol[r1]![c1] === sol[r2]![c2];
      expect(e.kind).toBe(same ? 'eq' : 'ne');
    }
  });
});

describe('generatePuzzle', () => {
  it('is reproducible from a seed', () => {
    const a = generatePuzzle({ seed: 'parity-1', difficulty: 'medium' });
    const b = generatePuzzle({ seed: 'parity-1', difficulty: 'medium' });
    expect(a).toEqual(b);
  });

  it('always returns a unique, deduction-only puzzle matching its solution', () => {
    const p = generatePuzzle({ seed: 'parity-2' });
    expect(isSolved(p.solution, p.edges)).toBe(true);
    expect(hasUniqueSolution(p.givens, p.edges)).toBe(true);
    const res = solve(p.givens, p.edges);
    expect(res.solved).toBe(true);
    expect(matchesSolution(res.grid, p.solution)).toBe(true);
  });

  it('rejects odd sizes', () => {
    expect(() => generatePuzzle({ size: 5 })).toThrow();
  });

  it("stored difficulty matches the score classifier", () => {
    for (const d of ['easy', 'medium', 'hard'] as Difficulty[]) {
      const p = generatePuzzle({ seed: `cls-${d}`, difficulty: d });
      expect(p.difficulty).toBe(classify(measure(p.givens, p.edges).score));
    }
  });

  it('honours difficulty: easy reveals more givens than hard', () => {
    const easy = generatePuzzle({ seed: 'diff', difficulty: 'easy' });
    const hard = generatePuzzle({ seed: 'diff', difficulty: 'hard' });
    expect(filledCount(easy.givens)).toBeGreaterThan(filledCount(hard.givens));
    expect(RANK[easy.difficulty]).toBeLessThanOrEqual(RANK[hard.difficulty]);
  });
});

// ── Fuzz: the core engine invariants over many generated puzzles ──
describe('fuzz invariants', () => {
  const COUNT = 600;

  it(`every generated puzzle (n=${COUNT}) is unique + deduction-only`, () => {
    for (let i = 0; i < COUNT; i++) {
      const difficulty = (['easy', 'medium', 'hard'] as Difficulty[])[i % 3]!;
      const p = generatePuzzle({ seed: `fuzz-${i}`, difficulty });

      // (a) the solution itself is a legal, complete grid under its edges
      expect(isSolved(p.solution, p.edges), `seed ${i}: solution invalid`).toBe(true);

      // (b) exactly one solution
      expect(hasUniqueSolution(p.givens, p.edges), `seed ${i}: not unique`).toBe(true);

      // (c) the human solver cracks it with zero guessing, to the same solution
      const res = solve(p.givens, p.edges);
      expect(res.solved, `seed ${i}: not deduction-solvable`).toBe(true);
      expect(res.contradiction).toBe(false);
      expect(matchesSolution(res.grid, p.solution), `seed ${i}: solver diverged`).toBe(true);

      // (d) givens are a subset of the solution
      expect(matchesSolution(p.givens, p.solution), `seed ${i}: given conflicts solution`).toBe(true);

      // (e) requested difficulty is never exceeded
      expect(RANK[p.difficulty], `seed ${i}: harder than requested`).toBeLessThanOrEqual(
        RANK[difficulty],
      );
    }
  });

  it('hard requests reliably yield hard puzzles', () => {
    let hard = 0;
    const N = 60;
    for (let i = 0; i < N; i++) {
      if (generatePuzzle({ seed: `hard-${i}`, difficulty: 'hard' }).difficulty === 'hard') hard++;
    }
    expect(hard).toBe(N);
  });
});
