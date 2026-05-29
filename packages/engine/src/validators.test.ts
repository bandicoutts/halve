import { describe, expect, it } from 'vitest';
import { asSolution } from './board.js';
import { findViolations, isSolved, isValid, wouldViolate } from './validators.js';
import type { Edge, Grid, Sym } from './types.js';

// A valid, balanced, no-three 6×6 solution (from the design handoff fixture).
const SOLUTION: Sym[][] = [
  [0, 1, 1, 0, 1, 0],
  [1, 0, 0, 1, 0, 1],
  [0, 1, 0, 1, 1, 0],
  [1, 0, 1, 0, 0, 1],
  [1, 1, 0, 0, 1, 0],
  [0, 0, 1, 1, 0, 1],
];

const clone = (g: Sym[][]): Grid => g.map((r) => r.slice());

describe('findViolations / isValid', () => {
  it('passes a valid complete solution', () => {
    expect(findViolations(SOLUTION, []).size).toBe(0);
    expect(isValid(SOLUTION, [])).toBe(true);
    expect(isSolved(SOLUTION, [])).toBe(true);
  });

  it('flags three-in-a-row horizontally', () => {
    const g = clone(SOLUTION);
    g[0]![1] = 0; // row 0 becomes 0,0,... wait make a triple
    g[0] = [0, 0, 0, 1, 1, 0];
    const bad = findViolations(g, []);
    expect(bad.has('0-0')).toBe(true);
    expect(bad.has('0-1')).toBe(true);
    expect(bad.has('0-2')).toBe(true);
    expect(isValid(g, [])).toBe(false);
  });

  it('flags an unbalanced row (4 of one symbol)', () => {
    const g = clone(SOLUTION);
    g[0] = [0, 1, 0, 0, 1, 0]; // four 0s — but check no accidental triple: 0,1,0,0,1,0 ok
    const bad = findViolations(g, []);
    // every 0 in the row is marked
    expect(bad.has('0-0')).toBe(true);
    expect(bad.has('0-2')).toBe(true);
    expect(bad.has('0-3')).toBe(true);
    expect(bad.has('0-5')).toBe(true);
  });

  it('respects eq / ne edges', () => {
    // cells (0,0)=0 and (0,1)=1 in the solution → opposite.
    const eqEdge: Edge = { orientation: 'h', r: 0, c: 0, kind: 'eq' };
    const neEdge: Edge = { orientation: 'h', r: 0, c: 0, kind: 'ne' };
    expect(isValid(SOLUTION, [neEdge])).toBe(true); // they differ → ne ok
    const bad = findViolations(SOLUTION, [eqEdge]); // they differ → eq violated
    expect(bad.has('0-0')).toBe(true);
    expect(bad.has('0-1')).toBe(true);
  });

  it('ignores edges where a cell is still empty', () => {
    const g = clone(SOLUTION);
    g[0]![1] = null as unknown as Sym;
    const eqEdge: Edge = { orientation: 'h', r: 0, c: 0, kind: 'eq' };
    expect(findViolations(g, [eqEdge]).size).toBe(0);
  });
});

describe('wouldViolate', () => {
  it('rejects a value that completes a triple', () => {
    const g: Grid = [
      [0, 0, null, null, null, null],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null],
    ];
    expect(wouldViolate(g, 0, 2, 0, [], 6)).toBe(true); // third 0 in a row
    expect(wouldViolate(g, 0, 2, 1, [], 6)).toBe(false);
  });

  it('rejects a value that overflows line balance', () => {
    const g: Grid = [
      [0, null, 0, null, 0, null],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null],
    ];
    // row already has three 0s (half=3); another 0 overflows.
    expect(wouldViolate(g, 0, 1, 0, [], 6)).toBe(true);
    expect(wouldViolate(g, 0, 1, 1, [], 6)).toBe(false);
  });

  it('rejects a value that breaks an edge with a known neighbour', () => {
    const g: Grid = [
      [0, null, null, null, null, null],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null],
    ];
    const eq: Edge = { orientation: 'h', r: 0, c: 0, kind: 'eq' };
    expect(wouldViolate(g, 0, 1, 1, [eq], 6)).toBe(true); // must equal 0
    expect(wouldViolate(g, 0, 1, 0, [eq], 6)).toBe(false);
  });
});

describe('asSolution', () => {
  it('throws on an incomplete grid', () => {
    const g = clone(SOLUTION);
    g[0]![0] = null as unknown as Sym;
    expect(() => asSolution(g)).toThrow();
  });
  it('returns the grid when complete', () => {
    expect(asSolution(SOLUTION)).toEqual(SOLUTION);
  });
});
