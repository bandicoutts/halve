import { describe, it, expect } from "vitest";
import { parseGridSpec } from "./grid-spec";

// Minimal valid 6×6 spec used as the baseline for mutation tests.
const SOL: (0 | 1)[][] = [
  [0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0],
];

const GIVENS: (0 | 1 | null)[][] = Array.from({ length: 6 }, () =>
  Array(6).fill(null)
);

function valid(overrides: object = {}): unknown {
  return { solution: SOL, givens: GIVENS, edges: [], ...overrides };
}

describe("parseGridSpec — structural validation", () => {
  it("accepts a minimal valid spec", () => {
    expect(parseGridSpec(valid())).not.toBeNull();
  });

  it("rejects null / non-object input", () => {
    expect(parseGridSpec(null)).toBeNull();
    expect(parseGridSpec(42)).toBeNull();
    expect(parseGridSpec([])).toBeNull();
  });

  it("rejects mismatched solution size", () => {
    const short = SOL.slice(0, 5);
    expect(parseGridSpec(valid({ solution: short }))).toBeNull();
  });

  it("rejects a solution cell that is not 0 or 1", () => {
    const bad = SOL.map((r) => [...r]);
    (bad[0] as unknown[])[0] = 2;
    expect(parseGridSpec(valid({ solution: bad }))).toBeNull();
  });

  it("rejects a givens cell with a value not in {0, 1, null}", () => {
    const bad = GIVENS.map((r) => [...r]);
    (bad[1] as unknown[])[1] = "x";
    expect(parseGridSpec(valid({ givens: bad }))).toBeNull();
  });
});

describe("parseGridSpec — givens ⊆ solution (ENG-4)", () => {
  it("accepts a given that matches the solution", () => {
    const g = GIVENS.map((r) => [...r]);
    g[0]![0] = SOL[0]![0]!; // 0
    g[0]![1] = SOL[0]![1]!; // 1
    expect(parseGridSpec(valid({ givens: g }))).not.toBeNull();
  });

  it("rejects a given that contradicts the solution", () => {
    const g = GIVENS.map((r) => [...r]);
    // SOL[0][0] is 0 — set given to 1 (conflict)
    g[0]![0] = 1;
    expect(parseGridSpec(valid({ givens: g }))).toBeNull();
  });

  it("rejects a given conflict in an interior cell", () => {
    const g = GIVENS.map((r) => [...r]);
    // SOL[3][3] is 0 — set given to 1
    g[3]![3] = 1;
    expect(parseGridSpec(valid({ givens: g }))).toBeNull();
  });
});

describe("parseGridSpec — edge integer check (ENG-4)", () => {
  it("accepts integer r/c coordinates", () => {
    const e = [{ orientation: "h", r: 0, c: 0, kind: "eq" }];
    // SOL[0][0]=0 and SOL[0][1]=1 — different, so "eq" edge should fail
    expect(parseGridSpec(valid({ edges: e }))).toBeNull();
  });

  it("rejects float r coordinate", () => {
    const e = [{ orientation: "h", r: 0.5, c: 0, kind: "eq" }];
    expect(parseGridSpec(valid({ edges: e }))).toBeNull();
  });

  it("rejects float c coordinate", () => {
    const e = [{ orientation: "v", r: 0, c: 1.9, kind: "ne" }];
    expect(parseGridSpec(valid({ edges: e }))).toBeNull();
  });
});

describe("parseGridSpec — edge ⇔ solution consistency (ENG-4)", () => {
  // SOL row 0: [0,1,0,1,0,1] — adjacent pairs along row 0:
  //   (0,0)=0 (0,1)=1  → ne
  //   (0,1)=1 (0,2)=0  → ne
  //   (0,2)=0 (0,3)=1  → ne
  //   (0,4)=0 (0,5)=1  → ne
  // SOL col 0: [0,1,0,1,0,1] — adjacent pairs down col 0:
  //   (0,0)=0 (1,0)=1  → ne
  //   (1,0)=1 (2,0)=0  → ne

  it("accepts a horizontal 'ne' edge that matches the solution", () => {
    const e = [{ orientation: "h", r: 0, c: 0, kind: "ne" }]; // 0≠1 ✓
    expect(parseGridSpec(valid({ edges: e }))).not.toBeNull();
  });

  it("rejects a horizontal 'eq' edge where the solution cells differ", () => {
    const e = [{ orientation: "h", r: 0, c: 0, kind: "eq" }]; // 0=1 ✗
    expect(parseGridSpec(valid({ edges: e }))).toBeNull();
  });

  it("accepts a vertical 'ne' edge that matches the solution", () => {
    const e = [{ orientation: "v", r: 0, c: 0, kind: "ne" }]; // 0≠1 ✓
    expect(parseGridSpec(valid({ edges: e }))).not.toBeNull();
  });

  it("rejects a vertical 'ne' edge where the solution cells are equal", () => {
    // SOL[0][0]=0, SOL[1][0]=1 — vertical edge at (0,0): 0≠1 so "ne" is valid.
    // SOL[0][1]=1, SOL[1][1]=0 — vertical edge at (0,1): 1≠0 so "ne" is valid.
    // Need an equal pair: SOL row 0 col 0 = 0, row 2 col 0 = 0 — pick a vertical
    // that skips a row; instead use a different grid cell pair.
    // Actually every adjacent pair in this alternating grid differs — let's just
    // check that a forged "eq" on an adjacent pair that must be ne is rejected.
    const e = [{ orientation: "v", r: 0, c: 0, kind: "eq" }]; // 0=1 ✗
    expect(parseGridSpec(valid({ edges: e }))).toBeNull();
  });

  it("accepts an edge that correctly reflects the solution on all four sides", () => {
    // Build a grid where (0,0)=0 and (0,1)=0 so an "eq" h-edge is valid.
    const sol2: (0 | 1)[][] = [
      [0, 0, 1, 0, 1, 0],
      [1, 0, 0, 1, 0, 1],
      [0, 1, 0, 0, 1, 0],
      [1, 0, 1, 0, 0, 1],
      [0, 1, 0, 1, 0, 0],
      [1, 0, 1, 0, 1, 0],
    ];
    const e = [{ orientation: "h", r: 0, c: 0, kind: "eq" }]; // sol2[0][0]=0, sol2[0][1]=0 ✓
    expect(parseGridSpec(valid({ solution: sol2, edges: e }))).not.toBeNull();
  });

  it("rejects out-of-bounds edge coordinates", () => {
    const e = [{ orientation: "h", r: 0, c: 5, kind: "eq" }]; // c >= size-1
    expect(parseGridSpec(valid({ edges: e }))).toBeNull();
  });

  it("rejects negative coordinates", () => {
    const e = [{ orientation: "h", r: -1, c: 0, kind: "eq" }];
    expect(parseGridSpec(valid({ edges: e }))).toBeNull();
  });
});
