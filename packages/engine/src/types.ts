/**
 * Core puzzle types for Parity — a binary Latin-square puzzle.
 * Two symbols are encoded as 0 = fire, 1 = water (matches @parity/design SYMBOL).
 */

/** A placed symbol. 0 = fire, 1 = water. */
export type Sym = 0 | 1;

/** A board cell: a placed symbol, or null when empty. */
export type Cell = Sym | null;

/** A working board (may contain empties). Indexed [row][col]. */
export type Grid = Cell[][];

/** A complete solution grid (no empties). Indexed [row][col]. */
export type Solution = Sym[][];

/** Edge constraint kind: cells must be equal (`=`) or opposite (`≠`). */
export type EdgeKind = 'eq' | 'ne';

/** Edge orientation: `h` links (r,c)+(r,c+1); `v` links (r,c)+(r+1,c). */
export type EdgeOrientation = 'h' | 'v';

/** A constraint sign sitting on the edge between two adjacent cells. */
export interface Edge {
  orientation: EdgeOrientation;
  r: number;
  c: number;
  kind: EdgeKind;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

/** A fully specified puzzle ready to play and to persist. */
export interface Puzzle {
  /** Grid edge length (6 for v1; 4 for the tutorial). Always even. */
  size: number;
  /** Starting grid: given cells filled, the rest null. */
  givens: Grid;
  /** Edge `=`/`≠` clues. */
  edges: Edge[];
  /** The unique solution. */
  solution: Solution;
  difficulty: Difficulty;
}

export const otherSym = (s: Sym): Sym => (s === 0 ? 1 : 0);
