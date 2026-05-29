# Game rules & engine spec

## The puzzle (player-facing rules)
Fill every cell of a 6×6 grid with one of two symbols — **fire** or **water**:
1. **Adjacency:** no more than two of the same symbol may sit next to each other, vertically or horizontally (`●●` ok, `●●●` not).
2. **Balance:** each row and each column must contain an equal number of fire and water (3 + 3 in a 6×6).
3. **Equals edge (`=`):** two cells separated by `=` must be the **same** symbol.
4. **Opposite edge (`≠`/`×`):** two cells separated by `≠` must be **opposite** symbols.
5. Every puzzle has **one** solution, reachable by pure deduction — the player should never need to guess.

Generalises to any even grid size n×n (n/2 of each per line); v1 ships **6×6 only**. A 4×4 variant is used for the first-run tutorial.

## Engine spec (`packages/engine`, pure TS, no deps)

### 1. Solver — human-style, deduction-only
Constraint propagation applied repeatedly until the grid stabilises. Each pass applies:
- **Triple rule:** two equal adjacent cells force both flanking cells to the opposite symbol; a same-valued pair with a one-cell gap forces the middle cell opposite.
- **Balance rule:** once a row/column reaches n/2 of a symbol, fill its remaining cells with the other.
- **Edge rule:** `=` forces equal, `≠` forces opposite; propagate through chains of edges.
A puzzle is **deduction-solvable** iff propagation alone fully fills the grid with no contradiction. If it stalls with empty cells → reject.

### 2. Uniqueness checker — backtracking
A separate exhaustive solver that counts solutions. A valid puzzle has **exactly one**. (Independent from the human solver so we verify uniqueness even for puzzles the human solver couldn't crack.)

### 3. Generator
1. Build a random complete valid solution via randomized backtracking under all constraints.
2. Add some `=`/`≠` edge clues and reveal a set of cells.
3. Greedily remove clues while **both** hold: uniqueness checker == 1 solution **and** human solver still solves. → guarantees unique + deduction-only.

### Difficulty
Scored by which deduction techniques are required and how many propagation passes / lookahead the human solver needs. Bucketed into **Easy / Medium / Hard**. The daily puzzle uses a fixed difficulty (recommend Medium).

## Engine encoding & API (`packages/engine`, implemented)
- **Symbols** are `0 = fire`, `1 = water` (matches `@parity/design` `SYMBOL`). A `Cell` is `0 | 1 | null`; a `Grid` is `Cell[][]`; a `Solution` is `Sym[][]`.
- **Edges**: `{ orientation: 'h' | 'v', r, c, kind: 'eq' | 'ne' }`. `h` links `(r,c)`+`(r,c+1)`; `v` links `(r,c)`+`(r+1,c)`.
- **Public API**: `findViolations` / `isValid` / `isSolved` / `wouldViolate` (validators), `solve` / `isDeductionSolvable` (human solver, returns per-technique stats + passes), `countSolutions` / `hasUniqueSolution` / `findAnySolution` (backtracking), `generatePuzzle` / `generateSolution` (seedable via mulberry32), `measure` / `classify` / `difficultyOf` (scoring).
- **Difficulty** is scored from solver effort: `empties + 2.5·(passes−1) + balance/edge premiums`. Minimal puzzles classify *hard*; *easy*/*medium* are produced by revealing extra givens down to a per-difficulty score setpoint. Thresholds for 6×6: easy ≤ 18, medium ≤ 30, else hard.

## Testing invariants
Fuzz-generate thousands of puzzles and assert every one is (a) uniquely solvable (checker) and (b) solvable by the human solver with zero guessing. Implemented in `generator.test.ts` (600-puzzle fuzz across all difficulties; all invariants hold).
