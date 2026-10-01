import { generateDaily } from "@parity/engine";
import type { Difficulty } from "@parity/engine";
import { createClient } from "@/lib/supabase/server";
import { getPublicPuzzleByDate } from "@/lib/puzzle-data.server";
import { getLocalToday } from "@/lib/local-date.server";
import { parseGridSpec } from "@/lib/grid-spec";
import { BoardScreen } from "@/components/board/BoardScreen";
import { DailyUnavailable } from "@/components/screens/DailyUnavailable";
import { measureServer, startServerTimer } from "@/lib/perf.server";

// revalidate is omitted: cookies()/getUser() force dynamic rendering anyway,
// so the value had no effect.

export default async function PlayPage() {
  const elapsedRouteMs = startServerTimer();
  // Gate by the user's local day (same source as streaks) so the served puzzle's
  // date matches the streak's "today" near the UTC midnight boundary (EPIC-B).
  const today = await measureServer("/play", "local-date", () => getLocalToday());

  let puzzleId: string | undefined;
  let puzzle: ReturnType<typeof generateDaily>["puzzle"] | undefined;
  let initialSolveDurationMs: number | undefined;
  let initialSolveUsedHint = false;

  try {
    const supabase = await measureServer("/play", "create-supabase-client", () => createClient());
    const [data, { data: { user } }] = await Promise.all([
      measureServer("/play", "public-puzzle-cache", () => getPublicPuzzleByDate(today)),
      measureServer("/play", "auth.getUser", () => supabase.auth.getUser()),
    ]);

    if (data) {
      const spec = parseGridSpec(data.grid_spec);
      if (spec) {
        puzzle = { size: 6, ...spec, difficulty: data.difficulty as Difficulty };
        puzzleId = data.id;
      }
    } else {
      // Row genuinely missing (not a DB outage). The cron/seeder failed to mint
      // today's puzzle — solves can't be recorded (no puzzleId) so streaks would
      // silently break. Surface loudly for the operator/monitoring (BE-2).
      console.error(
        `[daily-puzzle] no puzzles row for ${today} — serving deterministic offline fallback; solves will NOT record`,
      );
    }

    // Already solved today? Tell BoardScreen so it mounts in review mode
    // instead of a fresh playable board (was always fresh, regardless of
    // solve history — see DECISIONS.md WEB-BOARD-REVIEW-1).
    if (puzzleId && user) {
      const currentPuzzleId = puzzleId;
      const { data: solve } = await measureServer("/play", "today-solve-query", () => supabase
        .from("solves")
        .select("duration_ms, used_hint")
        .eq("user_id", user.id)
        .eq("puzzle_id", currentPuzzleId)
        .maybeSingle());
      if (solve) {
        initialSolveDurationMs = solve.duration_ms ?? 0;
        initialSolveUsedHint = solve.used_hint;
      }
    }
  } catch (err) {
    // DB unavailable — serve the deterministic fallback below.
    console.error(`[daily-puzzle] DB unavailable serving ${today}:`, err);
  }

  console.info("[perf]", JSON.stringify({ route: "/play", operation: "server-page-work", durationMs: elapsedRouteMs(), outcome: "ok" }));

  if (!puzzle) {
    // Deterministic offline fallback: the SAME seed+difficulty policy every other
    // producer uses (CLI seeder, edge function), so an offline player gets the
    // canonical puzzle for the date — not a random one — even with no DB row (CQ-3).
    try {
      puzzle = generateDaily(today).puzzle;
    } catch (err) {
      console.error(`[daily-puzzle] offline fallback generator threw for ${today}:`, err);
      return <DailyUnavailable />;
    }
  }

  return (
    // key by the day so a date rollover remounts with the new puzzle.
    <BoardScreen
      key={today}
      puzzle={puzzle}
      puzzleId={puzzleId}
      kind="daily"
      date={today}
      backHref="/"
      isOffline={!puzzleId}
      initialSolveDurationMs={initialSolveDurationMs}
      initialSolveUsedHint={initialSolveUsedHint}
    />
  );
}
