import { filledCount } from './board.js';
import { solve } from './solver.js';
import type { Difficulty, Edge, Grid } from './types.js';

export interface PuzzleMetrics {
  /** Cells the player must deduce (empties in the givens). */
  empties: number;
  /** Propagation rounds the human solver needed — a proxy for deduction depth. */
  passes: number;
  /** Whether the balance rule was required. */
  usedBalance: boolean;
  /** Whether edge propagation was required. */
  usedEdge: boolean;
  /** Combined difficulty score (higher = harder). */
  score: number;
  /** Whether the human solver fully solved it (should always be true for a valid puzzle). */
  solvable: boolean;
}

/**
 * Score a puzzle by the effort the human-style solver expends.
 * Breadth (how many cells must be deduced) plus depth (how many propagation
 * rounds), with a small premium when balance/edge reasoning is required.
 */
export function measure(givens: Grid, edges: readonly Edge[] = []): PuzzleMetrics {
  const size = givens.length;
  const empties = size * size - filledCount(givens);
  const { solved, stats } = solve(givens, edges);
  const usedBalance = stats.balance > 0;
  const usedEdge = stats.edge > 0;
  const score = empties + 2.5 * (stats.passes - 1) + (usedBalance ? 2 : 0) + (usedEdge ? 1 : 0);
  return { empties, passes: stats.passes, usedBalance, usedEdge, score, solvable: solved };
}

/**
 * Score thresholds for a 6×6, tuned against the generator's distribution.
 * Minimal (hardest) puzzles score ~35+; easier bands are reached by revealing
 * extra givens down to the difficulty setpoints in the generator.
 */
export const THRESHOLDS = { easyMax: 18, mediumMax: 30 } as const;

export function classify(score: number): Difficulty {
  if (score <= THRESHOLDS.easyMax) return 'easy';
  if (score <= THRESHOLDS.mediumMax) return 'medium';
  return 'hard';
}

export function difficultyOf(givens: Grid, edges: readonly Edge[] = []): Difficulty {
  return classify(measure(givens, edges).score);
}
