import { vi, describe, it, expect, beforeEach } from "vitest";
import { recordSolve } from "./record-solve";

// next/headers is imported at module level by local-date.ts; stub it so the
// pure resolveLocalToday export can still be exercised without a Next runtime.
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

// ── Mutable mock state ──────────────────────────────────────────────────────

let mockUser: { id: string } | null = { id: "user-1" };
let mockPuzzleData: unknown = null;
let mockInsertError: { code?: string; message: string } | null = null;
let insertCallCount = 0;

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: mockUser } }),
    },
    from: (table: string) => {
      if (table === "puzzles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockPuzzleData }),
            }),
          }),
        };
      }
      // "solves" — tracks call count so duplicate-submission tests can simulate
      // the 23505 unique-constraint on the second identical insert.
      return {
        insert: async () => {
          insertCallCount++;
          if (insertCallCount > 1) return { error: { code: "23505", message: "duplicate key" } };
          return { error: mockInsertError };
        },
      };
    },
  }),
}));

// ── Fixtures ────────────────────────────────────────────────────────────────

const SOLUTION: (0 | 1)[][] = [
  [0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0],
];

const MOCK_GRID_SPEC = {
  solution: SOLUTION,
  givens: Array.from({ length: 6 }, () => Array(6).fill(null)),
  edges: [],
};

const VALID_PUZZLE = { id: "p1", date: "2020-01-01", grid_spec: MOCK_GRID_SPEC };

const BASE_INPUT = {
  puzzleId: "p1",
  grid: SOLUTION,
  durationMs: 12345,
  usedHint: false,
  localDate: "2020-01-01",
};

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockUser = { id: "user-1" };
  mockPuzzleData = VALID_PUZZLE;
  mockInsertError = null;
  insertCallCount = 0;
});

describe("recordSolve", () => {
  it("returns ok:false when user is unauthenticated", async () => {
    mockUser = null;
    expect(await recordSolve(BASE_INPUT)).toEqual({ ok: false });
  });

  it("returns ok:false when puzzleId is empty", async () => {
    expect(await recordSolve({ ...BASE_INPUT, puzzleId: "" })).toEqual({ ok: false });
  });

  it("returns ok:false when durationMs is 0", async () => {
    expect(await recordSolve({ ...BASE_INPUT, durationMs: 0 })).toEqual({ ok: false });
  });

  it("returns ok:false when durationMs is negative", async () => {
    expect(await recordSolve({ ...BASE_INPUT, durationMs: -1 })).toEqual({ ok: false });
  });

  it("returns ok:false when localDate has wrong format", async () => {
    expect(await recordSolve({ ...BASE_INPUT, localDate: "2020/01/01" })).toEqual({ ok: false });
  });

  it("returns ok:false when puzzle is not found", async () => {
    mockPuzzleData = null;
    expect(await recordSolve(BASE_INPUT)).toEqual({ ok: false });
  });

  it("returns ok:false when puzzle date is in the future", async () => {
    mockPuzzleData = { ...VALID_PUZZLE, date: "2099-12-31" };
    expect(await recordSolve(BASE_INPUT)).toEqual({ ok: false });
  });

  it("returns ok:false when grid has a wrong cell", async () => {
    const wrongGrid = SOLUTION.map((row, r) =>
      row.map((v, c) => (r === 0 && c === 0 ? ((1 - v) as 0 | 1) : v))
    );
    expect(await recordSolve({ ...BASE_INPUT, grid: wrongGrid })).toEqual({ ok: false });
  });

  it("returns ok:true for a correct grid and valid inputs", async () => {
    expect(await recordSolve(BASE_INPUT)).toEqual({ ok: true });
  });

  it("returns ok:true with alreadySolved:true on unique_violation", async () => {
    mockInsertError = { code: "23505", message: "duplicate key" };
    expect(await recordSolve(BASE_INPUT)).toEqual({ ok: true, alreadySolved: true });
  });

  it("returns ok:true with alreadySolved:true when called twice with identical arguments", async () => {
    expect(await recordSolve(BASE_INPUT)).toEqual({ ok: true });
    expect(await recordSolve(BASE_INPUT)).toEqual({ ok: true, alreadySolved: true });
  });
});
