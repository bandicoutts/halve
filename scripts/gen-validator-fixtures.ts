/**
 * Generates validator parity fixtures for the cross-platform engine test.
 * Runs the TS engine's findViolations against a suite of hand-crafted grids
 * and writes the results to packages/engine/test-fixtures/validator.json.
 *
 * Usage: pnpm tsx --tsconfig scripts/tsconfig.json scripts/gen-validator-fixtures.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findViolations } from '../packages/engine/src/index.js';
import type { Edge, Grid } from '../packages/engine/src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// null = empty cell, 0 = A (solid), 1 = B (ring).
function g(rows: (number | null)[][]): Grid {
  return rows as Grid;
}

const N = 6; // standard grid size

/** Build a 6×6 all-null grid. */
function empty(): Grid {
  return Array.from({ length: N }, () => Array(N).fill(null) as (number | null)[]) as Grid;
}

/** Clone a grid and place a value at (r,c). */
function set(grid: Grid, r: number, c: number, v: number | null): Grid {
  const next = grid.map((row) => row.slice()) as Grid;
  next[r]![c] = v as Grid[number][number];
  return next;
}

interface Fixture {
  description: string;
  grid: Grid;
  edges: Edge[];
  violations: string[];
}

function fixture(description: string, grid: Grid, edges: Edge[]): Fixture {
  const viol = findViolations(grid, edges);
  return {
    description,
    grid,
    edges,
    violations: [...viol].sort(),
  };
}

const fixtures: Fixture[] = [
  // 1. All empty — no violations.
  fixture('empty grid', empty(), []),

  // 2. Horizontal triple at row 0, cols 0-1-2 (all A).
  fixture('horizontal triple (row 0)', (() => {
    let grid = empty();
    grid = set(grid, 0, 0, 0);
    grid = set(grid, 0, 1, 0);
    grid = set(grid, 0, 2, 0);
    return grid;
  })(), []),

  // 3. Vertical triple at col 1, rows 3-4-5 (all B).
  fixture('vertical triple (col 1)', (() => {
    let grid = empty();
    grid = set(grid, 3, 1, 1);
    grid = set(grid, 4, 1, 1);
    grid = set(grid, 5, 1, 1);
    return grid;
  })(), []),

  // 4. Row balance violation: row 2 has four A's (half = 3, so 4 > 3).
  fixture('row balance violation (row 2, four A)', (() => {
    let grid = empty();
    for (let c = 0; c < 4; c++) grid = set(grid, 2, c, 0);
    return grid;
  })(), []),

  // 5. Column balance violation: col 4 has four B's.
  fixture('column balance violation (col 4, four B)', (() => {
    let grid = empty();
    for (let r = 0; r < 4; r++) grid = set(grid, r, 4, 1);
    return grid;
  })(), []),

  // 6. Edge eq violated: (0,0)=A, (0,1)=B, h-edge eq.
  fixture('eq edge violated', (() => {
    let grid = empty();
    grid = set(grid, 0, 0, 0);
    grid = set(grid, 0, 1, 1);
    return grid;
  })(), [{ orientation: 'h', r: 0, c: 0, kind: 'eq' }]),

  // 7. Edge ne violated: (0,2)=A, (0,3)=A, h-edge ne.
  fixture('ne edge violated', (() => {
    let grid = empty();
    grid = set(grid, 0, 2, 0);
    grid = set(grid, 0, 3, 0);
    return grid;
  })(), [{ orientation: 'h', r: 0, c: 2, kind: 'ne' }]),

  // 8. Edge eq satisfied: same symbol — no violation.
  fixture('eq edge satisfied', (() => {
    let grid = empty();
    grid = set(grid, 1, 0, 1);
    grid = set(grid, 1, 1, 1);
    return grid;
  })(), [{ orientation: 'h', r: 1, c: 0, kind: 'eq' }]),

  // 9. Vertical eq edge violated.
  fixture('vertical eq edge violated', (() => {
    let grid = empty();
    grid = set(grid, 2, 3, 0);
    grid = set(grid, 3, 3, 1);
    return grid;
  })(), [{ orientation: 'v', r: 2, c: 3, kind: 'eq' }]),

  // 10. Edge with one side empty — no violation.
  fixture('eq edge with one cell empty (no violation)', (() => {
    let grid = empty();
    grid = set(grid, 0, 0, 0);
    return grid;
  })(), [{ orientation: 'h', r: 0, c: 0, kind: 'eq' }]),

  // 11. Multiple violations: horizontal triple + eq edge breach.
  fixture('horizontal triple + eq edge violation', (() => {
    let grid = empty();
    grid = set(grid, 0, 0, 0);
    grid = set(grid, 0, 1, 0);
    grid = set(grid, 0, 2, 0);
    grid = set(grid, 4, 2, 0);
    grid = set(grid, 4, 3, 1);
    return grid;
  })(), [{ orientation: 'h', r: 4, c: 2, kind: 'eq' }]),

  // 12. Fully valid complete grid (checker-pattern partial).
  fixture('valid partial grid (no violations)', (() => {
    let grid = empty();
    // Alternating pattern in first two rows, balanced.
    const rows = [
      [0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0],
    ];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < N; c++) {
        grid = set(grid, r, c, rows[r]![c]!);
      }
    }
    return grid;
  })(), []),

  // 13. Both row and column balance violation.
  fixture('row + column balance violation', (() => {
    let grid = empty();
    // Row 0: four A's (cols 0-3).
    for (let c = 0; c < 4; c++) grid = set(grid, 0, c, 0);
    // Col 0: four B's (rows 1-4) — also causes col 0 to have 4 B's > half.
    for (let r = 1; r < 5; r++) grid = set(grid, r, 0, 1);
    return grid;
  })(), []),

  // 14. ne edge satisfied: different symbols.
  fixture('ne edge satisfied (no violation)', (() => {
    let grid = empty();
    grid = set(grid, 5, 4, 0);
    grid = set(grid, 5, 5, 1);
    return grid;
  })(), [{ orientation: 'h', r: 5, c: 4, kind: 'ne' }]),

  // 15. Multiple edges, some violated some not.
  fixture('multiple edges mixed validity', (() => {
    let grid = empty();
    grid = set(grid, 1, 0, 0);
    grid = set(grid, 1, 1, 1);
    grid = set(grid, 1, 2, 1);
    grid = set(grid, 1, 3, 0);
    return grid;
  })(), [
    { orientation: 'h', r: 1, c: 0, kind: 'eq' },  // 0≠1 → violated
    { orientation: 'h', r: 1, c: 1, kind: 'ne' },  // 1≠1 → both same → violated
    { orientation: 'h', r: 1, c: 2, kind: 'ne' },  // 1≠0 → different → ok
  ]),
];

const outDir = join(__dirname, '..', 'packages', 'engine', 'test-fixtures');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'validator.json');
writeFileSync(outPath, JSON.stringify(fixtures, null, 2) + '\n');
console.log(`Wrote ${fixtures.length} fixtures → ${outPath}`);
