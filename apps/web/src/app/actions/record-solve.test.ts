import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { recordSolve } from "./record-solve";

// next/headers is imported at module level by local-date.ts; stub it so the
// pure resolveLocalToday export can still be exercised without a Next runtime.
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

// revalidatePath needs Next's request store (absent in unit tests); stub it so
// recordSolve's cache-invalidation on a fresh solve doesn't throw.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

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
      // "solves" — insert tracks call count so duplicate-submission tests can
      // simulate the 23505 unique-constraint on the second identical insert;
      // select serves the post-insert streak-window query.
      return {
        insert: async () => {
          insertCallCount++;
          if (insertCallCount > 1) return { error: { code: "23505", message: "duplicate key" } };
          return { error: mockInsertError };
        },
        select: () => ({
          eq: () => ({
            gte: async () => ({ data: [] }),
          }),
        }),
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

afterEach(() => {
  vi.useRealTimers();
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

  it("accepts a puzzle on the validated local date when UTC is still the previous day", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T11:00:00.000Z"));
    mockPuzzleData = { ...VALID_PUZZLE, date: "2026-10-02" };

    const result = await recordSolve({ ...BASE_INPUT, localDate: "2026-10-02" });

    expect(result).toMatchObject({ ok: true, alreadySolved: false });
    expect(insertCallCount).toBe(1);
  });

  it("returns ok:false when puzzle is later than the validated local date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T11:00:00.000Z"));
    mockPuzzleData = { ...VALID_PUZZLE, date: "2026-10-03" };

    expect(await recordSolve({ ...BASE_INPUT, localDate: "2026-10-02" })).toEqual({ ok: false });
    expect(insertCallCount).toBe(0);
  });

  it("does not let an out-of-range client date extend the future puzzle boundary", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T11:00:00.000Z"));
    mockPuzzleData = { ...VALID_PUZZLE, date: "2026-10-03" };

    expect(await recordSolve({ ...BASE_INPUT, localDate: "2026-10-03" })).toEqual({ ok: false });
    expect(insertCallCount).toBe(0);
  });

  it("returns ok:false when grid has a wrong cell", async () => {
    const wrongGrid = SOLUTION.map((row, r) =>
      row.map((v, c) => (r === 0 && c === 0 ? ((1 - v) as 0 | 1) : v))
    );
    expect(await recordSolve({ ...BASE_INPUT, grid: wrongGrid })).toEqual({ ok: false });
  });

  it("returns ok:true for a correct grid and valid inputs", async () => {
    expect(await recordSolve(BASE_INPUT)).toMatchObject({ ok: true, alreadySolved: false });
  });

  it("returns ok:true with alreadySolved:true on unique_violation", async () => {
    mockInsertError = { code: "23505", message: "duplicate key" };
    expect(await recordSolve(BASE_INPUT)).toMatchObject({ ok: true, alreadySolved: true });
  });

  it("returns ok:true with alreadySolved:true when called twice with identical arguments", async () => {
    expect(await recordSolve(BASE_INPUT)).toMatchObject({ ok: true, alreadySolved: false });
    expect(await recordSolve(BASE_INPUT)).toMatchObject({ ok: true, alreadySolved: true });
  });
});
