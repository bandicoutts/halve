import { describe, expect, it } from 'vitest';
import {
  DAILY_DIFFICULTY_CYCLE,
  DAILY_EPOCH,
  dailyDayIndex,
  dailyPolicy,
  generateDaily,
} from './daily.js';
import { hashSeed } from './rng.js';
import { wouldViolate } from './validators.js';
import { solve } from './solver.js';
import { hasUniqueSolution } from './uniqueness.js';

describe('dailyDayIndex', () => {
  it('maps the epoch to day 1', () => {
    expect(dailyDayIndex(DAILY_EPOCH)).toBe(1);
  });

  it('counts whole days forward', () => {
    expect(dailyDayIndex('2026-01-02')).toBe(2);
    expect(dailyDayIndex('2026-01-08')).toBe(8);
  });

  it('is unaffected by DST / month boundaries (UTC-anchored)', () => {
    // 2026-03-08 is a US DST transition; index must still be exact.
    expect(dailyDayIndex('2026-03-08') - dailyDayIndex('2026-03-07')).toBe(1);
    expect(dailyDayIndex('2026-02-01') - dailyDayIndex('2026-01-31')).toBe(1);
  });

  it('goes negative-relative for pre-epoch dates', () => {
    expect(dailyDayIndex('2025-12-31')).toBe(0);
  });
});

describe('dailyPolicy', () => {
  it('is deterministic for a date', () => {
    expect(dailyPolicy('2026-06-15')).toEqual(dailyPolicy('2026-06-15'));
  });

  it('derives the seed from the date via hashSeed', () => {
    expect(dailyPolicy('2026-06-15').seed).toBe(hashSeed('2026-06-15'));
  });

  it('cycles difficulty easy → medium → hard → medium from the epoch', () => {
    expect(dailyPolicy('2026-01-01').difficulty).toBe('easy');
    expect(dailyPolicy('2026-01-02').difficulty).toBe('medium');
    expect(dailyPolicy('2026-01-03').difficulty).toBe('hard');
    expect(dailyPolicy('2026-01-04').difficulty).toBe('medium');
    expect(dailyPolicy('2026-01-05').difficulty).toBe('easy');
  });

  it('keeps the difficulty in-range for pre-epoch dates', () => {
    expect(DAILY_DIFFICULTY_CYCLE).toContain(dailyPolicy('2025-12-30').difficulty);
  });

  it('gives different dates different seeds', () => {
    expect(dailyPolicy('2026-06-15').seed).not.toBe(dailyPolicy('2026-06-16').seed);
  });
});

describe('generateDaily', () => {
  it('reproduces the same puzzle for the same date', () => {
    const a = generateDaily('2026-07-01');
    const b = generateDaily('2026-07-01');
    expect(b.puzzle).toEqual(a.puzzle);
    expect(b.usedSeed).toBe(a.usedSeed);
  });

  it('uses the policy difficulty and records the canonical seed', () => {
    const r = generateDaily('2026-01-03'); // hard in the cycle
    expect(r.difficulty).toBe('hard');
    expect(r.puzzle.difficulty).toBe('hard');
    expect(r.seed).toBe(hashSeed('2026-01-03'));
    expect(r.usedSeed).toBe(r.seed); // no retry on the happy path
  });

  it('produces a uniquely-solvable, rule-valid, deduction-solvable puzzle', () => {
    const { puzzle } = generateDaily('2026-08-20');
    // Givens are rule-valid.
    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        const v = puzzle.givens[r]![c];
        if (v == null) continue;
        puzzle.givens[r]![c] = null;
        expect(wouldViolate(puzzle.givens, r, c, v, puzzle.edges, puzzle.size)).toBe(false);
        puzzle.givens[r]![c] = v;
      }
    }
    expect(hasUniqueSolution(puzzle.givens, puzzle.edges)).toBe(true);
    expect(solve(puzzle.givens, puzzle.edges).solved).toBe(true);
  });
});
