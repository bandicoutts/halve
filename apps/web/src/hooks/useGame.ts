"use client";
import { useCallback, useMemo, useReducer } from "react";
import { findViolations, type Cell, type Edge, type Grid, type Solution, type Sym } from "@parity/engine";

export interface GameState {
  cells: Grid;
  history: Grid[];
  usedHint: boolean;
}

type Action =
  | { type: "tap"; r: number; c: number }
  | { type: "undo" }
  | { type: "hint"; r: number; c: number; sym: Sym }
  | { type: "restart"; givens: Grid };

function cycle(v: Cell): Cell {
  if (v === null) return 0;
  if (v === 0) return 1;
  return null;
}

function cloneGrid(g: Grid): Grid {
  return g.map((row) => row.slice());
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "tap": {
      const next = cloneGrid(state.cells);
      next[action.r]![action.c] = cycle(next[action.r]![action.c]!);
      return { cells: next, history: [...state.history, state.cells], usedHint: state.usedHint };
    }
    case "undo": {
      if (!state.history.length) return state;
      const prev = state.history[state.history.length - 1]!;
      return { cells: prev, history: state.history.slice(0, -1), usedHint: state.usedHint };
    }
    case "hint": {
      const next = cloneGrid(state.cells);
      next[action.r]![action.c] = action.sym;
      return { cells: next, history: [...state.history, state.cells], usedHint: true };
    }
    case "restart": {
      // Back to the starting position: givens only, empty history, no hint used.
      return { cells: cloneGrid(action.givens), history: [], usedHint: false };
    }
    default:
      return state;
  }
}

export function computeErrors(cells: Grid, edges: Edge[]): Set<string> {
  return findViolations(cells, edges);
}

/** Starting state — `initialCells` (e.g. the solution) seeds an already-solved
 *  board for review; otherwise play starts from `givens`. */
export function initialGameState(givens: Grid, initialCells?: Grid): GameState {
  return { cells: (initialCells ?? givens).map((row) => row.slice()), history: [], usedHint: false };
}

// Intentionally different from the engine's isSolved: this checks that the
// board matches the stored solution cell-for-cell, so it works on a partial
// grid without needing edge constraints at call-time. The engine's isSolved
// requires isComplete + isValid — semantically richer but not needed here.
function isSolved(cells: Grid, solution: Solution): boolean {
  return cells.every((row, r) => row.every((v, c) => v === solution[r]![c]));
}

interface UseGameOptions {
  givens: Grid;
  solution: Solution;
  edges: Edge[];
  /** Seeds the board already solved (e.g. reviewing a puzzle solved earlier). */
  initialCells?: Grid | undefined;
}

export function useGame({ givens, solution, edges, initialCells }: UseGameOptions) {
  const [state, dispatch] = useReducer(reducer, initialGameState(givens, initialCells));

  const errors = useMemo(() => computeErrors(state.cells, edges), [state.cells, edges]);
  const solved = useMemo(() => isSolved(state.cells, solution), [state.cells, solution]);

  // Stable reference (dispatch never changes) so a memoized Cell only
  // re-renders when its own value/error actually changes, not on every tap.
  const tap = useCallback((r: number, c: number) => {
    dispatch({ type: "tap", r, c });
  }, []);

  function undo() {
    dispatch({ type: "undo" });
  }

  const restart = useCallback(() => {
    dispatch({ type: "restart", givens });
  }, [givens]);

  function hint() {
    const empties: [number, number][] = [];
    state.cells.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v === null) empties.push([r, c]);
      })
    );
    if (!empties.length) return;
    const [r, c] = empties[Math.floor(Math.random() * empties.length)]!;
    dispatch({ type: "hint", r, c, sym: solution[r]![c]! });
  }

  return {
    cells: state.cells,
    errors,
    solved,
    canUndo: state.history.length > 0,
    usedHint: state.usedHint,
    tap,
    undo,
    hint,
    restart,
  };
}
