import { filledCount } from './board.js';
import { solve } from './solver.js';
/**
 * Score a puzzle by the effort the human-style solver expends.
 * Breadth (how many cells must be deduced) plus depth (how many propagation
 * rounds), with a small premium when balance/edge reasoning is required.
 */
export function measure(givens, edges = []) {
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
export const THRESHOLDS = { easyMax: 18, mediumMax: 30 };
export function classify(score) {
    if (score <= THRESHOLDS.easyMax)
        return 'easy';
    if (score <= THRESHOLDS.mediumMax)
        return 'medium';
    return 'hard';
}
export function difficultyOf(givens, edges = []) {
    return classify(measure(givens, edges).score);
}
//# sourceMappingURL=difficulty.js.map