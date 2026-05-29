import { describe, expect, it } from 'vitest';
import { isDeductionSolvable, solve } from './solver.js';
import type { Edge, Grid, Sym } from './types.js';

const N: Cell = null;
type Cell = Sym | null;

function row(...cells: Cell[]): Cell[] {
  return cells;
}

describe('solve — deduction rules', () => {
  it('solves a complete grid trivially', () => {
    const g: Grid = [
      [0, 1, 1, 0, 1, 0],
      [1, 0, 0, 1, 0, 1],
      [0, 1, 0, 1, 1, 0],
      [1, 0, 1, 0, 0, 1],
      [1, 1, 0, 0, 1, 0],
      [0, 0, 1, 1, 0, 1],
    ];
    const res = solve(g, []);
    expect(res.solved).toBe(true);
    expect(res.contradiction).toBe(false);
  });

  it('fills a cell forced by row balance', () => {
    // Row 0 has three 1s placed and two 0s; the last empty must be 0.
    const g: Grid = [
      row(1, 0, 1, 0, 1, N),
      row(0, 1, 0, 1, 0, 1),
      row(1, 0, 1, 0, 1, 0),
      row(0, 1, 0, 1, 0, 1),
      row(1, 0, 1, 0, 1, 0),
      row(0, 1, 0, 1, 0, 1),
    ];
    const res = solve(g, []);
    expect(res.grid[0]![5]).toBe(0);
    expect(res.stats.balance).toBeGreaterThan(0);
    expect(res.solved).toBe(true);
  });

  it('fills a cell forced by the no-three adjacency rule', () => {
    // (0,2) sits between two 1s vertically/horizontally so it must be 0.
    const g: Grid = [
      row(N, 1, 1, N, N, N),
      row(N, N, N, N, N, N),
      row(N, N, N, N, N, N),
      row(N, N, N, N, N, N),
      row(N, N, N, N, N, N),
      row(N, N, N, N, N, N),
    ];
    // (0,0): left of the pair 1,1 → forced 0 by adjacency? pair is at c1,c2; c0 flanks → 0.
    const res = solve(g, []);
    expect(res.grid[0]![0]).toBe(0);
    expect(res.grid[0]![3]).toBe(0); // right flank of the pair
    expect(res.stats.adjacency).toBeGreaterThan(0);
  });

  it('propagates an eq edge', () => {
    const g: Grid = [
      row(0, N, N, N, N, N),
      row(N, N, N, N, N, N),
      row(N, N, N, N, N, N),
      row(N, N, N, N, N, N),
      row(N, N, N, N, N, N),
      row(N, N, N, N, N, N),
    ];
    const eq: Edge = { orientation: 'h', r: 0, c: 0, kind: 'eq' };
    const res = solve(g, [eq]);
    expect(res.grid[0]![1]).toBe(0);
    expect(res.stats.edge).toBeGreaterThan(0);
  });

  it('detects a contradiction when a cell has no legal value', () => {
    const g: Grid = [
      row(0, N, 0, N, N, N),
      row(N, N, N, N, N, N),
      row(N, N, N, N, N, N),
      row(N, N, N, N, N, N),
      row(N, N, N, N, N, N),
      row(N, N, N, N, N, N),
    ];
    // (0,1): eq to (0,0)=0 forbids 1; ne to (0,2)=0 forbids 0 → no legal value.
    const edges: Edge[] = [
      { orientation: 'h', r: 0, c: 0, kind: 'eq' },
      { orientation: 'h', r: 0, c: 1, kind: 'ne' },
    ];
    const res = solve(g, edges);
    expect(res.contradiction).toBe(true);
    expect(res.solved).toBe(false);
  });

  it('isDeductionSolvable mirrors solve().solved', () => {
    const g: Grid = [
      [0, 1, 1, 0, 1, 0],
      [1, 0, 0, 1, 0, 1],
      [0, 1, 0, 1, 1, 0],
      [1, 0, 1, 0, 0, 1],
      [1, 1, 0, 0, 1, 0],
      [0, 0, 1, 1, 0, 1],
    ];
    expect(isDeductionSolvable(g, [])).toBe(true);
  });
});
