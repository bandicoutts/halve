import { generateDaily } from "@parity/engine";
import type { Difficulty } from "@parity/engine";
import { createClient } from "@/lib/supabase/server";
import { getLocalToday } from "@/lib/local-date";
import { parseGridSpec } from "@/lib/grid-spec";
import { BoardScreen } from "@/components/board/BoardScreen";
import { DailyUnavailable } from "@/components/screens/DailyUnavailable";

// revalidate is omitted: cookies()/getUser() force dynamic rendering anyway,
// so the value had no effect.

export default async function PlayPage() {
  // Gate by the user's local day (same source as streaks) so the served puzzle's
  // date matches the streak's "today" near the UTC midnight boundary (EPIC-B).
  const today = await getLocalToday();

  let puzzleId: string | undefined;
  let puzzle: ReturnType<typeof generateDaily>["puzzle"] | undefined;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("puzzles")
      .select("id, difficulty, grid_spec")
      .eq("date", today)
      .maybeSingle();

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
  } catch (err) {
    // DB unavailable — serve the deterministic fallback below.
    console.error(`[daily-puzzle] DB unavailable serving ${today}:`, err);
  }

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
    <BoardScreen
      puzzle={puzzle}
      puzzleId={puzzleId}
      kind="daily"
      date={today}
      backHref="/"
      isOffline={!puzzleId}
    />
  );
}
