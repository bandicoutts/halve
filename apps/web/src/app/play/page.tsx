import { generatePuzzle } from "@parity/engine";
import type { Difficulty } from "@parity/engine";
import { createClient } from "@/lib/supabase/server";
import { getLocalToday } from "@/lib/local-date";
import { parseGridSpec } from "@/lib/grid-spec";
import { BoardScreen } from "@/components/board/BoardScreen";

// revalidate is omitted: cookies()/getUser() force dynamic rendering anyway,
// so the value had no effect.

export default async function PlayPage() {
  // Gate by the user's local day (same source as streaks) so the served puzzle's
  // date matches the streak's "today" near the UTC midnight boundary (EPIC-B).
  const today = await getLocalToday();

  let puzzleId: string | undefined;
  let puzzle = generatePuzzle({ size: 6, difficulty: "medium" });

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
    }
  } catch {
    // DB unavailable — serve generated fallback
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
