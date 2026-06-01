/**
 * Independent brute-force solution-counter — zero engine rule-logic imports.
 *
 * ENG-2: the generator and its existing tests share `wouldViolate`, making
 * the uniqueness guarantee self-referential.  This file implements the three
 * Halve rules from scratch and counts solutions independently, then verifies
 * that every puzzle the engine generates has exactly one.
 */

import { describe, expect, it } from 'vitest';
import { generatePuzzle } from './generator.js';
import { generateDaily } from './daily.js';
import type { Edge, Puzzle } from './types.js';

// ─── Independent rule checker (no engine validator/uniqueness imports) ─────────

type V = 0 | 1 | null;

function countSolutionsBF(givens: V[][], edges: readonly Edge[], cap = 2): number {
  const N = givens.length;
  const half = N / 2;
  const board: V[] = givens.flat();

  function canPlace(idx: number, val: 0 | 1): boolean {
    const r = Math.floor(idx / N);
    const c = idx % N;
    const at = (row: number, col: number): V => board[row * N + col] ?? null;

    // Adjacency — no three identical in a row, horizontally
    if (c >= 2 && at(r, c - 1) === val && at(r, c - 2) === val) return false;
    if (c >= 1 && c + 1 < N && at(r, c - 1) === val && at(r, c + 1) === val) return false;
    if (c + 2 < N && at(r, c + 1) === val && at(r, c + 2) === val) return false;
    // Adjacency — vertically
    if (r >= 2 && at(r - 1, c) === val && at(r - 2, c) === val) return false;
    if (r >= 1 && r + 1 < N && at(r - 1, c) === val && at(r + 1, c) === val) return false;
    if (r + 2 < N && at(r + 1, c) === val && at(r + 2, c) === val) return false;

    // Balance — placing val must not push any row/col past half
    let rowCnt = 0;
    for (let cc = 0; cc < N; cc++) if (at(r, cc) === val) rowCnt++;
    if (rowCnt + 1 > half) return false;
    let colCnt = 0;
    for (let rr = 0; rr < N; rr++) if (at(rr, c) === val) colCnt++;
    if (colCnt + 1 > half) return false;

    // Edge constraints involving this cell
    for (const e of edges) {
      const [r1, c1, r2, c2] =
        e.orientation === 'h'
          ? [e.r, e.c, e.r, e.c + 1]
          : [e.r, e.c, e.r + 1, e.c];
      let neighbour: V = null;
      if (r1 === r && c1 === c) neighbour = at(r2, c2);
      else if (r2 === r && c2 === c) neighbour = at(r1, c1);
      else continue;
      if (neighbour === null) continue;
      if (e.kind === 'eq' ? val !== neighbour : val === neighbour) return false;
    }

    return true;
  }

  let count = 0;

  function search(pos: number): void {
    if (count >= cap) return;
    if (pos === N * N) {
      count++;
      return;
    }
    if (board[pos] !== null) {
      search(pos + 1);
      return;
    }
    for (const v of [0, 1] as (0 | 1)[]) {
      if (!canPlace(pos, v)) continue;
      board[pos] = v;
      search(pos + 1);
      board[pos] = null;
      if (count >= cap) return;
    }
  }

  search(0);
  return count;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

const KNOWN_SOLUTION: V[][] = [
  [0, 1, 1, 0, 1, 0],
  [1, 0, 0, 1, 0, 1],
  [0, 1, 0, 1, 1, 0],
  [1, 0, 1, 0, 0, 1],
  [1, 1, 0, 0, 1, 0],
  [0, 0, 1, 1, 0, 1],
];

describe('independent brute-force solution counter', () => {
  it('counts a complete valid 6×6 solution as exactly 1', () => {
    expect(countSolutionsBF(KNOWN_SOLUTION, [])).toBe(1);
  });

  it('finds > 1 solution on an empty 6×6 grid', () => {
    const empty: V[][] = Array.from({ length: 6 }, () => Array(6).fill(null));
    expect(countSolutionsBF(empty, [], 2)).toBe(2);
  });

  it('returns 0 for an unsolvable partial grid', () => {
    // Row 0 has four 0s — balance rule prevents completion.
    const bad: V[][] = [
      [0, 1, 0, 0, 0, null],
      ...Array.from({ length: 5 }, () => Array(6).fill(null) as V[]),
    ];
    expect(countSolutionsBF(bad, [])).toBe(0);
  });
});

describe('brute-force uniqueness — generated puzzles', () => {
  it('every easy puzzle (20 seeds) has exactly 1 solution', () => {
    for (let i = 0; i < 20; i++) {
      const p: Puzzle = generatePuzzle({ size: 6, difficulty: 'easy', seed: `bf-easy-${i}` });
      expect(
        countSolutionsBF(p.givens as V[][], p.edges),
        `seed bf-easy-${i}`,
      ).toBe(1);
    }
  });

  it('every medium puzzle (20 seeds) has exactly 1 solution', () => {
    for (let i = 0; i < 20; i++) {
      const p: Puzzle = generatePuzzle({ size: 6, difficulty: 'medium', seed: `bf-medium-${i}` });
      expect(
        countSolutionsBF(p.givens as V[][], p.edges),
        `seed bf-medium-${i}`,
      ).toBe(1);
    }
  });

  it('every hard puzzle (20 seeds) has exactly 1 solution', () => {
    for (let i = 0; i < 20; i++) {
      const p: Puzzle = generatePuzzle({ size: 6, difficulty: 'hard', seed: `bf-hard-${i}` });
      expect(
        countSolutionsBF(p.givens as V[][], p.edges),
        `seed bf-hard-${i}`,
      ).toBe(1);
    }
  });

  it('every daily puzzle (30 consecutive dates from 2026-01-01) has exactly 1 solution', () => {
    const epoch = new Date('2026-01-01T00:00:00Z');
    for (let d = 0; d < 30; d++) {
      const date = new Date(epoch.getTime() + d * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const { puzzle } = generateDaily(date);
      expect(
        countSolutionsBF(puzzle.givens as V[][], puzzle.edges),
        `date ${date}`,
      ).toBe(1);
    }
  });
});
