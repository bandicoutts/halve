import { generatePuzzle } from './generator.js';
import { hashSeed } from './rng.js';
import type { Difficulty, Puzzle } from './types.js';

/**
 * THE single source of truth for "what puzzle is today's puzzle".
 *
 * Every producer of the daily puzzle — the CLI seeder, the daily-puzzle edge
 * function, and the `/play` offline fallback — MUST derive its seed and
 * difficulty from here. Previously each computed them independently (different
 * seeds, one using `Math.random`, some always `medium`), so the same date could
 * yield three different puzzles depending on which producer ran. (EPIC-A)
 */

/** Day 1 of Halve — anchors the difficulty cadence. */
export const DAILY_EPOCH = '2026-01-01';

/** The daily grid size. */
export const DAILY_SIZE = 6;

/** Difficulty cadence, repeating from the epoch (day 1 = easy). */
export const DAILY_DIFFICULTY_CYCLE: readonly Difficulty[] = [
  'easy',
  'medium',
  'hard',
  'medium',
];

/** Whole-day index of a YYYY-MM-DD date relative to the epoch (epoch day = 1). */
export function dailyDayIndex(date: string): number {
  const ms =
    Date.parse(`${date}T00:00:00Z`) - Date.parse(`${DAILY_EPOCH}T00:00:00Z`);
  return Math.round(ms / 86_400_000) + 1;
}

export interface DailyPolicy {
  date: string;
  /** Canonical integer seed for this date (FNV-1a of the date string). */
  seed: number;
  difficulty: Difficulty;
}

/**
 * The canonical seed + difficulty for a calendar date. Deterministic: the same
 * date always maps to the same seed and difficulty, so any producer reproduces
 * the identical puzzle.
 */
export function dailyPolicy(date: string): DailyPolicy {
  const idx = dailyDayIndex(date);
  const len = DAILY_DIFFICULTY_CYCLE.length;
  // Euclidean modulo so pre-epoch dates (negative index) still index in-range.
  const difficulty = DAILY_DIFFICULTY_CYCLE[(((idx - 1) % len) + len) % len]!;
  return { date, seed: hashSeed(date), difficulty };
}

export interface DailyResult extends DailyPolicy {
  /** The seed that actually produced `puzzle` (== `seed` unless a retry fired). */
  usedSeed: number;
  puzzle: Puzzle;
}

/**
 * Generate the canonical daily puzzle for a date.
 *
 * Generation is essentially always successful for a 6×6, but on the rare throw
 * we retry on a *fresh but still deterministic* seed (derived from the date plus
 * the attempt number) rather than failing outright — so a transient generator
 * edge case never leaves the day without a puzzle. `usedSeed` reports the seed
 * that succeeded; persist it so the stored row reproduces exactly.
 */
export function generateDaily(date: string, maxAttempts = 4): DailyResult {
  const { seed, difficulty } = dailyPolicy(date);
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const usedSeed = attempt === 0 ? seed : hashSeed(`${date}#${attempt}`);
    try {
      const puzzle = generatePuzzle({ size: DAILY_SIZE, difficulty, seed: usedSeed });
      return { date, seed, difficulty, usedSeed, puzzle };
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(
    `generateDaily(${date}): generation failed after ${maxAttempts} attempts: ${String(lastErr)}`,
  );
}
