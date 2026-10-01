"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseGridSpec } from "@/lib/grid-spec";
import { resolveLocalToday, isValidDate } from "@/lib/local-date";
import { computeStreak, computeLongestStreak, offsetDay } from "@/lib/streak";

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
  currentStreak?: number;
  longestStreak?: number;
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
  if (!isValidDate(localDate)) return { ok: false };

  // Load puzzle server-side — the solution never needs to leave the server
  const { data: puzzle } = await supabase
    .from("puzzles")
    .select("id, date, grid_spec")
    .eq("id", puzzleId)
    .maybeSingle();

  if (!puzzle) return { ok: false };

  const todayUtc = new Date().toISOString().slice(0, 10);
  const validatedLocalDate = resolveLocalToday(localDate, todayUtc);

  // The daily puzzle follows the player's validated local calendar day, which
  // can be one day ahead of UTC. Reject only puzzles beyond that day; comparing
  // directly to UTC incorrectly blocks players east of UTC after local midnight.
  // resolveLocalToday clamps the client date to ±1 day, so an arbitrary date
  // cannot move this boundary further ahead or backfill an older streak day.
  if (!puzzle.date || puzzle.date > validatedLocalDate) return { ok: false };

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

  const alreadySolved = error?.code === "23505";
  if (error && !alreadySolved) {
    console.error("recordSolve: insert failed:", error.message);
    return { ok: false };
  }

  // A fresh solve changes the home / archive / stats listings, and this exact
  // puzzle's own play page (which now needs to render in review mode instead
  // of a fresh board — see DECISIONS.md WEB-BOARD-REVIEW-1). Invalidate their
  // caches so navigating (back) to those pages reflects the solve immediately.
  if (!alreadySolved) {
    revalidatePath("/");
    revalidatePath("/archive");
    revalidatePath("/stats");
    revalidatePath("/play");
    // puzzle.date (not validatedLocalDate) — it's the exact [date] URL segment
    // this puzzle is served at; the two usually match but validatedLocalDate is
    // clamped for streak-day attribution and can diverge near a midnight edge.
    revalidatePath(`/play/${puzzle.date}`);
  }

  const { data: solveDays } = await supabase
    .from("solves")
    .select("local_date, solved_at")
    .eq("user_id", user.id)
    .gte("local_date", offsetDay(validatedLocalDate, -60));
  const days = [
    ...new Set(
      (solveDays ?? []).map(
        (r: { local_date: string | null; solved_at: string }) =>
          r.local_date ?? r.solved_at.slice(0, 10)
      )
    ),
  ] as string[];

  return {
    ok: true,
    alreadySolved,
    currentStreak: computeStreak(days, validatedLocalDate),
    longestStreak: computeLongestStreak(days),
  };
}
