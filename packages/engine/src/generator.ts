import { asSolution, emptyGrid, gridFromMask, matchesSolution } from './board.js';
import { classify, difficultyOf, measure } from './difficulty.js';
import { hashSeed, mulberry32, randInt, shuffle, type Rng } from './rng.js';
import { solve } from './solver.js';
import { hasUniqueSolution } from './uniqueness.js';
import { wouldViolate } from './validators.js';
import type { Difficulty, Edge, Grid, Puzzle, Solution, Sym } from './types.js';

/** Target solver-effort score per difficulty; reveal givens until at/below it. */
const SETPOINT: Record<Difficulty, number> = { easy: 12, medium: 24, hard: Infinity };

/** Build a random complete, rule-valid solution via randomized backtracking. */
export function generateSolution(size: number, rng: Rng): Solution {
  const grid = emptyGrid(size);
  const fill = (pos: number): boolean => {
    if (pos === size * size) return true;
    const r = Math.floor(pos / size);
    const c = pos % size;
    for (const val of shuffle([0, 1] as Sym[], rng)) {
      if (wouldViolate(grid, r, c, val, [], size)) continue;
      grid[r]![c] = val;
      if (fill(pos + 1)) return true;
      grid[r]![c] = null;
    }
    return false;
  };
  if (!fill(0)) throw new Error('generateSolution: failed to build a solution');
  return asSolution(grid);
}

/** All adjacent cell pairs as candidate edges, with kinds derived from the solution. */
function allCandidateEdges(solution: Solution, size: number): Edge[] {
  const edges: Edge[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (c + 1 < size) {
        edges.push({
          orientation: 'h',
          r,
          c,
          kind: solution[r]![c] === solution[r]![c + 1] ? 'eq' : 'ne',
        });
      }
      if (r + 1 < size) {
        edges.push({
          orientation: 'v',
          r,
          c,
          kind: solution[r]![c] === solution[r + 1]![c] ? 'eq' : 'ne',
        });
      }
    }
  }
  return edges;
}

/** Pick `count` random edges consistent with the solution. */
export function randomEdges(solution: Solution, rng: Rng, count: number): Edge[] {
  const all = shuffle(allCandidateEdges(solution, solution.length), rng);
  return all.slice(0, Math.max(0, Math.min(count, all.length)));
}

function allCoords(size: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) out.push([r, c]);
  return out;
}

// A givens set is acceptable iff it has a unique solution AND the human solver
// reaches that solution by pure deduction.
function isAcceptable(givens: Grid, edges: readonly Edge[], solution: Solution): boolean {
  if (!hasUniqueSolution(givens, edges)) return false;
  const res = solve(givens, edges);
  return res.solved && matchesSolution(res.grid, solution);
}

export interface GenerateOptions {
  size?: number;
  difficulty?: Difficulty;
  /** Seed for reproducible generation. */
  seed?: string | number;
  /** Number of `=`/`≠` edge clues. Defaults to a small random count. */
  edgeCount?: number;
}

function buildCandidate(size: number, rng: Rng, target: Difficulty, edgeCount: number): Puzzle {
  const solution = generateSolution(size, rng);
  const edges = randomEdges(solution, rng, edgeCount);

  // Start fully given, then greedily remove cells while the puzzle stays
  // uniquely + deduction-solvable. The result is the hardest (minimal) form.
  const mask = solution.map((row) => row.map(() => true));
  for (const [r, c] of shuffle(allCoords(size), rng)) {
    mask[r]![c] = false;
    const givens = gridFromMask(solution, mask);
    if (!isAcceptable(givens, edges, solution)) mask[r]![c] = true;
  }

  let givens = gridFromMask(solution, mask);

  // For easier targets, reveal extra cells until solver effort drops to the setpoint.
  if (target !== 'hard') {
    const hidden = shuffle(
      allCoords(size).filter(([r, c]) => !mask[r]![c]),
      rng,
    );
    while (hidden.length > 0 && measure(givens, edges).score > SETPOINT[target]) {
      const [r, c] = hidden.pop()!;
      mask[r]![c] = true;
      givens = gridFromMask(solution, mask);
    }
  }

  const difficulty = difficultyOf(givens, edges);
  return { size, givens, edges, solution, difficulty };
}

/**
 * Generate a puzzle guaranteed to be uniquely solvable and solvable by pure
 * deduction. `difficulty` targets a band; for `hard` several candidates are
 * tried and the hardest kept (the minimal form is not always hard enough).
 */
export function generatePuzzle(opts: GenerateOptions = {}): Puzzle {
  const size = opts.size ?? 6;
  if (size % 2 !== 0) throw new Error('generatePuzzle: size must be even');
  const seedInt = opts.seed != null ? hashSeed(opts.seed) : (Math.random() * 2 ** 32) >>> 0;
  const rng = mulberry32(seedInt);
  const target = opts.difficulty ?? 'medium';
  const edgeCount = opts.edgeCount ?? 2 + randInt(rng, 3); // 2..4 by default

  const attempts = target === 'hard' ? 10 : 1;
  let best: Puzzle | null = null;
  let bestScore = -Infinity;
  for (let a = 0; a < attempts; a++) {
    const cand = buildCandidate(size, rng, target, edgeCount);
    if (cand.difficulty === target) return cand;
    const score = measure(cand.givens, cand.edges).score;
    if (score > bestScore) {
      bestScore = score;
      best = cand;
    }
  }
  return best!; // safe: the loop runs at least once (attempts >= 1), so best is always set.
}

export { classify, measure };
