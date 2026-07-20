import { describe, it, expect } from "vitest";
import type { Grid, Edge } from "@parity/engine";
import { computeErrors, initialGameState, reducer, type GameState } from "./useGame";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGrid(rows: (0 | 1 | null)[][]): Grid {
  return rows.map((r) => r.slice());
}

/** 6×6 all-null grid */
function emptyGrid(): Grid {
  return Array.from({ length: 6 }, () => Array(6).fill(null));
}

function makeState(cells: Grid): GameState {
  return { cells, history: [], usedHint: false };
}

// ---------------------------------------------------------------------------
// computeErrors — adjacency (3-in-a-row)
// ---------------------------------------------------------------------------

describe("computeErrors — horizontal 3-in-a-row", () => {
  it("flags columns 0-2 when cols 0,1,2 are the same symbol", () => {
    const g = emptyGrid();
    g[0]![0] = 0; g[0]![1] = 0; g[0]![2] = 0;
    const errs = computeErrors(g, []);
    expect(errs.has("0-0")).toBe(true);
    expect(errs.has("0-1")).toBe(true);
    expect(errs.has("0-2")).toBe(true);
  });

  it("flags columns 1-3 when cols 1,2,3 are the same symbol", () => {
    const g = emptyGrid();
    g[2]![1] = 1; g[2]![2] = 1; g[2]![3] = 1;
    const errs = computeErrors(g, []);
    expect(errs.has("2-1")).toBe(true);
    expect(errs.has("2-2")).toBe(true);
    expect(errs.has("2-3")).toBe(true);
  });

  it("flags columns 2-4 when cols 2,3,4 are the same symbol", () => {
    const g = emptyGrid();
    g[4]![2] = 0; g[4]![3] = 0; g[4]![4] = 0;
    const errs = computeErrors(g, []);
    expect(errs.has("4-2")).toBe(true);
    expect(errs.has("4-3")).toBe(true);
    expect(errs.has("4-4")).toBe(true);
  });

  it("flags columns 3-5 when cols 3,4,5 are the same symbol", () => {
    const g = emptyGrid();
    g[5]![3] = 1; g[5]![4] = 1; g[5]![5] = 1;
    const errs = computeErrors(g, []);
    expect(errs.has("5-3")).toBe(true);
    expect(errs.has("5-4")).toBe(true);
    expect(errs.has("5-5")).toBe(true);
  });

  it("does not flag two-in-a-row", () => {
    const g = emptyGrid();
    g[0]![0] = 0; g[0]![1] = 0;
    const errs = computeErrors(g, []);
    expect(errs.size).toBe(0);
  });
});

describe("computeErrors — vertical 3-in-a-row", () => {
  it("flags rows 0-2 for the same symbol in a column", () => {
    const g = emptyGrid();
    g[0]![3] = 1; g[1]![3] = 1; g[2]![3] = 1;
    const errs = computeErrors(g, []);
    expect(errs.has("0-3")).toBe(true);
    expect(errs.has("1-3")).toBe(true);
    expect(errs.has("2-3")).toBe(true);
  });

  it("flags rows 3-5 for the same symbol in a column", () => {
    const g = emptyGrid();
    g[3]![0] = 0; g[4]![0] = 0; g[5]![0] = 0;
    const errs = computeErrors(g, []);
    expect(errs.has("3-0")).toBe(true);
    expect(errs.has("4-0")).toBe(true);
    expect(errs.has("5-0")).toBe(true);
  });

  it("does not flag two vertical without a third", () => {
    const g = emptyGrid();
    g[0]![1] = 0; g[1]![1] = 0;
    const errs = computeErrors(g, []);
    expect(errs.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeErrors — balance
// ---------------------------------------------------------------------------

describe("computeErrors — row imbalance", () => {
  it("flags all cells of the over-represented symbol in a row", () => {
    const g = emptyGrid();
    // Row 1: four 0s (exceeds N/2 = 3)
    g[1] = [0, 0, 0, 0, 1, 1];
    const errs = computeErrors(g, []);
    // All four 0-cells should be flagged
    expect(errs.has("1-0")).toBe(true);
    expect(errs.has("1-1")).toBe(true);
    expect(errs.has("1-2")).toBe(true);
    expect(errs.has("1-3")).toBe(true);
    // The two 1-cells should not be flagged for balance
    expect(errs.has("1-4")).toBe(false);
    expect(errs.has("1-5")).toBe(false);
  });

  it("does not flag a perfectly balanced row", () => {
    const g = emptyGrid();
    g[0] = [0, 1, 0, 1, 0, 1];
    const errs = computeErrors(g, []);
    expect(errs.size).toBe(0);
  });
});

describe("computeErrors — column imbalance", () => {
  it("flags all cells of the over-represented symbol in a column", () => {
    const g = emptyGrid();
    // Col 2: four 1s
    for (let r = 0; r < 4; r++) g[r]![2] = 1;
    g[4]![2] = 0; g[5]![2] = 0;
    const errs = computeErrors(g, []);
    expect(errs.has("0-2")).toBe(true);
    expect(errs.has("1-2")).toBe(true);
    expect(errs.has("2-2")).toBe(true);
    expect(errs.has("3-2")).toBe(true);
    expect(errs.has("4-2")).toBe(false);
    expect(errs.has("5-2")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeErrors — edge constraints
// ---------------------------------------------------------------------------

describe("computeErrors — = edge constraint", () => {
  it("flags both cells when an eq edge connects two different symbols (horizontal)", () => {
    const g = emptyGrid();
    g[0]![0] = 0; g[0]![1] = 1;
    const edges: Edge[] = [{ orientation: "h", r: 0, c: 0, kind: "eq" }];
    const errs = computeErrors(g, edges);
    expect(errs.has("0-0")).toBe(true);
    expect(errs.has("0-1")).toBe(true);
  });

  it("flags both cells when an eq edge connects two different symbols (vertical)", () => {
    const g = emptyGrid();
    g[1]![3] = 1; g[2]![3] = 0;
    const edges: Edge[] = [{ orientation: "v", r: 1, c: 3, kind: "eq" }];
    const errs = computeErrors(g, edges);
    expect(errs.has("1-3")).toBe(true);
    expect(errs.has("2-3")).toBe(true);
  });

  it("does not flag an eq edge where both cells are the same symbol", () => {
    const g = emptyGrid();
    g[0]![0] = 1; g[0]![1] = 1;
    const edges: Edge[] = [{ orientation: "h", r: 0, c: 0, kind: "eq" }];
    const errs = computeErrors(g, edges);
    expect(errs.size).toBe(0);
  });
});

describe("computeErrors — ≠ edge constraint", () => {
  it("flags both cells when a ne edge connects two identical symbols (horizontal)", () => {
    const g = emptyGrid();
    g[0]![4] = 0; g[0]![5] = 0;
    const edges: Edge[] = [{ orientation: "h", r: 0, c: 4, kind: "ne" }];
    const errs = computeErrors(g, edges);
    expect(errs.has("0-4")).toBe(true);
    expect(errs.has("0-5")).toBe(true);
  });

  it("flags both cells when a ne edge connects two identical symbols (vertical)", () => {
    const g = emptyGrid();
    g[3]![1] = 1; g[4]![1] = 1;
    const edges: Edge[] = [{ orientation: "v", r: 3, c: 1, kind: "ne" }];
    const errs = computeErrors(g, edges);
    expect(errs.has("3-1")).toBe(true);
    expect(errs.has("4-1")).toBe(true);
  });

  it("does not flag a ne edge where cells are different symbols", () => {
    const g = emptyGrid();
    g[0]![0] = 0; g[0]![1] = 1;
    const edges: Edge[] = [{ orientation: "h", r: 0, c: 0, kind: "ne" }];
    const errs = computeErrors(g, edges);
    expect(errs.size).toBe(0);
  });

  it("does not flag a ne edge where a cell is null", () => {
    const g = emptyGrid();
    g[0]![0] = 0; // g[0]![1] stays null
    const edges: Edge[] = [{ orientation: "h", r: 0, c: 0, kind: "ne" }];
    const errs = computeErrors(g, edges);
    expect(errs.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeErrors — fully valid solved board
// ---------------------------------------------------------------------------

describe("computeErrors — valid solved board", () => {
  it("returns an empty error set for a valid 6×6 board", () => {
    // A valid 6×6 binary Latin square (each row/col: 3 zeros, 3 ones, no 3-in-a-row)
    const g = makeGrid([
      [0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0],
      [0, 1, 1, 0, 0, 1],
      [1, 0, 0, 1, 1, 0],
      [0, 1, 0, 1, 1, 0],
      [1, 0, 1, 0, 0, 1],
    ]);
    const errs = computeErrors(g, []);
    expect(errs.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// reducer — tap
// ---------------------------------------------------------------------------

describe("reducer — tap", () => {
  it("fills a null cell with 0 on first tap", () => {
    const state = makeState(emptyGrid());
    const next = reducer(state, { type: "tap", r: 0, c: 0 });
    expect(next.cells[0]![0]).toBe(0);
  });

  it("cycles 0 → 1 on second tap", () => {
    const g = emptyGrid();
    g[0]![0] = 0;
    const next = reducer(makeState(g), { type: "tap", r: 0, c: 0 });
    expect(next.cells[0]![0]).toBe(1);
  });

  it("cycles 1 → null on third tap", () => {
    const g = emptyGrid();
    g[0]![0] = 1;
    const next = reducer(makeState(g), { type: "tap", r: 0, c: 0 });
    expect(next.cells[0]![0]).toBeNull();
  });

  it("records current cells in history", () => {
    const state = makeState(emptyGrid());
    const next = reducer(state, { type: "tap", r: 1, c: 2 });
    expect(next.history).toHaveLength(1);
    expect(next.history[0]![1]![2]).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// reducer — undo
// ---------------------------------------------------------------------------

describe("reducer — undo", () => {
  it("reverts to the previous grid", () => {
    const g = emptyGrid();
    const after = reducer(makeState(g), { type: "tap", r: 0, c: 0 });
    expect(after.cells[0]![0]).toBe(0);
    const reverted = reducer(after, { type: "undo" });
    expect(reverted.cells[0]![0]).toBeNull();
  });

  it("trims history after undo", () => {
    const after = reducer(makeState(emptyGrid()), { type: "tap", r: 0, c: 0 });
    const reverted = reducer(after, { type: "undo" });
    expect(reverted.history).toHaveLength(0);
  });

  it("is a no-op when history is empty", () => {
    const state = makeState(emptyGrid());
    const next = reducer(state, { type: "undo" });
    expect(next).toBe(state); // same reference
  });
});

// ---------------------------------------------------------------------------
// reducer — hint
// ---------------------------------------------------------------------------

describe("reducer — hint", () => {
  it("fills the target cell with the given symbol", () => {
    const state = makeState(emptyGrid());
    const next = reducer(state, { type: "hint", r: 3, c: 4, sym: 1 });
    expect(next.cells[3]![4]).toBe(1);
  });

  it("sets usedHint to true", () => {
    const state = makeState(emptyGrid());
    const next = reducer(state, { type: "hint", r: 0, c: 0, sym: 0 });
    expect(next.usedHint).toBe(true);
  });

  it("keeps usedHint true once set", () => {
    const state: GameState = { cells: emptyGrid(), history: [], usedHint: true };
    const next = reducer(state, { type: "hint", r: 0, c: 0, sym: 0 });
    expect(next.usedHint).toBe(true);
  });

  it("records current cells in history", () => {
    const state = makeState(emptyGrid());
    const next = reducer(state, { type: "hint", r: 2, c: 2, sym: 1 });
    expect(next.history).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// initialGameState — seeds a puzzle already solved by the player (review mode)
// ---------------------------------------------------------------------------

describe("initialGameState", () => {
  it("seeds cells from givens when no initialCells is provided", () => {
    const givens = makeGrid([[0, null], [null, 1]]);
    expect(initialGameState(givens).cells).toEqual(givens);
  });

  it("seeds cells from initialCells when provided, e.g. an already-solved puzzle", () => {
    const givens = makeGrid([[0, null], [null, 1]]);
    const solution = makeGrid([[0, 1], [0, 1]]);
    const state = initialGameState(givens, solution);
    expect(state.cells).toEqual(solution);
    expect(state.history).toEqual([]);
    expect(state.usedHint).toBe(false);
  });

  it("does not mutate the source grid", () => {
    const givens = makeGrid([[0, null]]);
    const state = initialGameState(givens);
    state.cells[0]![1] = 1;
    expect(givens[0]![1]).toBe(null);
  });
});
