"use server";
import { createClient } from "@/lib/supabase/server";
import { parseGridSpec } from "@/lib/grid-spec";
import { resolveLocalToday } from "@/lib/local-date";

interface RecordSolveInput {
  puzzleId: string;
  /** The player's final grid — validated server-side against the stored solution. */
  grid: (0 | 1 | null)[][];
  durationMs: number;
  usedHint: boolean;
  localDate: string;
}

interface RecordSolveResult {
  ok: boolean;
  /** True when the unique-violation constraint fired (already solved). */
  alreadySolved?: boolean;
}

/**
 * Records a solve after verifying the submitted grid matches the server-side
 * solution. Clients never need to prove they know the answer — they submit
 * their grid and this action checks it, preventing fabricated inserts.
 */
export async function recordSolve(input: RecordSolveInput): Promise<RecordSolveResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { puzzleId, grid, durationMs, usedHint, localDate } = input;

  // Basic input sanity
  if (typeof puzzleId !== "string" || !puzzleId) return { ok: false };
  if (!Number.isInteger(durationMs) || durationMs < 1) return { ok: false };
  if (typeof usedHint !== "boolean") return { ok: false };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) return { ok: false };

  // Load puzzle server-side — the solution never needs to leave the server
  const { data: puzzle } = await supabase
    .from("puzzles")
    .select("id, date, grid_spec")
    .eq("id", puzzleId)
    .maybeSingle();

  if (!puzzle) return { ok: false };

  // Reject solves for puzzles dated in the future. Future puzzles are readable
  // (RLS allows select), so without this a client could pull tomorrow's solution
  // from grid_spec and pre-record a solve to inflate streaks.
  const todayUtc = new Date().toISOString().slice(0, 10);
  if (!puzzle.date || puzzle.date > todayUtc) return { ok: false };

  // Clamp localDate to ±1 day of server UTC — same window resolveLocalToday uses
  // for the tz_date cookie. Prevents a client from shaping its streak day by
  // submitting an arbitrary date (e.g. backdating to fill a streak gap).
  const validatedLocalDate = resolveLocalToday(localDate, todayUtc);

  const spec = parseGridSpec(puzzle.grid_spec);
  if (!spec) return { ok: false };

  // Validate submitted grid against the server-side solution
  const N = spec.solution.length;
  if (!Array.isArray(grid) || grid.length !== N) return { ok: false };
  for (let r = 0; r < N; r++) {
    if (!Array.isArray(grid[r]!) || grid[r]!.length !== N) return { ok: false };
    for (let c = 0; c < N; c++) {
      if (grid[r]![c] !== spec.solution[r]![c]) return { ok: false };
    }
  }

  const { error } = await supabase.from("solves").insert({
    user_id: user.id,
    puzzle_id: puzzleId,
    duration_ms: durationMs,
    used_hint: usedHint,
    local_date: validatedLocalDate,
  });

  if (error?.code === "23505") return { ok: true, alreadySolved: true };
  if (error) {
    console.error("recordSolve: insert failed:", error.message);
    return { ok: false };
  }

  return { ok: true };
}
