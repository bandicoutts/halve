"use client";
import { useMemo, useReducer } from "react";
import type { Cell, Edge, Grid, Solution, Sym } from "@parity/engine";

export interface GameState {
  cells: Grid;
  history: Grid[];
  usedHint: boolean;
}

type Action =
  | { type: "tap"; r: number; c: number }
  | { type: "undo" }
  | { type: "hint"; r: number; c: number; sym: Sym };

function cycle(v: Cell): Cell {
  if (v === null) return 0;
  if (v === 0) return 1;
  return null;
}

function cloneGrid(g: Grid): Grid {
  return g.map((row) => row.slice());
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "tap": {
      const next = cloneGrid(state.cells);
      next[action.r][action.c] = cycle(next[action.r][action.c]);
      return { cells: next, history: [...state.history, state.cells], usedHint: state.usedHint };
    }
    case "undo": {
      if (!state.history.length) return state;
      const prev = state.history[state.history.length - 1];
      return { cells: prev, history: state.history.slice(0, -1), usedHint: state.usedHint };
    }
    case "hint": {
      const next = cloneGrid(state.cells);
      next[action.r][action.c] = action.sym;
      return { cells: next, history: [...state.history, state.cells], usedHint: true };
    }
    default:
      return state;
  }
}

function computeErrors(cells: Grid, edges: Edge[]): Set<string> {
  const N = cells.length;
  const errs = new Set<string>();
  const mark = (r: number, c: number) => errs.add(`${r}-${c}`);

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const v = cells[r][c];
      if (v === null) continue;
      if (c <= N - 3 && cells[r][c + 1] === v && cells[r][c + 2] === v) {
        mark(r, c); mark(r, c + 1); mark(r, c + 2);
      }
      if (r <= N - 3 && cells[r + 1]?.[c] === v && cells[r + 2]?.[c] === v) {
        mark(r, c); mark(r + 1, c); mark(r + 2, c);
      }
    }
  }
  for (let r = 0; r < N; r++) {
    for (const sym of [0, 1] as const) {
      const idx: number[] = [];
      for (let c = 0; c < N; c++) if (cells[r][c] === sym) idx.push(c);
      if (idx.length > N / 2) idx.forEach((c) => mark(r, c));
    }
  }
  for (let c = 0; c < N; c++) {
    for (const sym of [0, 1] as const) {
      const idx: number[] = [];
      for (let r = 0; r < N; r++) if (cells[r][c] === sym) idx.push(r);
      if (idx.length > N / 2) idx.forEach((r) => mark(r, c));
    }
  }

  for (const edge of edges) {
    const { orientation: o, r, c, kind } = edge;
    const a = cells[r][c];
    const b = o === "h" ? cells[r][c + 1] : cells[r + 1]?.[c];
    if (a === null || b === null) continue;
    if (kind === "eq" && a !== b) { mark(r, c); o === "h" ? mark(r, c + 1) : mark(r + 1, c); }
    if (kind === "ne" && a === b) { mark(r, c); o === "h" ? mark(r, c + 1) : mark(r + 1, c); }
  }

  return errs;
}

function isSolved(cells: Grid, solution: Solution): boolean {
  return cells.every((row, r) => row.every((v, c) => v === solution[r][c]));
}

interface UseGameOptions {
  givens: Grid;
  solution: Solution;
  edges: Edge[];
}

export function useGame({ givens, solution, edges }: UseGameOptions) {
  const [state, dispatch] = useReducer(reducer, {
    cells: givens.map((row) => row.slice()),
    history: [],
    usedHint: false,
  });

  const errors = useMemo(() => computeErrors(state.cells, edges), [state.cells, edges]);
  const solved = useMemo(() => isSolved(state.cells, solution), [state.cells, solution]);

  function tap(r: number, c: number) {
    dispatch({ type: "tap", r, c });
  }

  function undo() {
    dispatch({ type: "undo" });
  }

  function hint() {
    const empties: [number, number][] = [];
    state.cells.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v === null) empties.push([r, c]);
      })
    );
    if (!empties.length) return;
    const [r, c] = empties[Math.floor(Math.random() * empties.length)];
    dispatch({ type: "hint", r, c, sym: solution[r][c] });
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
  };
}
