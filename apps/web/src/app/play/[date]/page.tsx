import { notFound, redirect } from "next/navigation";
import type { Difficulty } from "@parity/engine";
import { createClient } from "@/lib/supabase/server";
import { getLocalToday } from "@/lib/local-date.server";
import { isValidDate } from "@/lib/local-date";
import { parseGridSpec } from "@/lib/grid-spec";
import { getPublicPuzzleByDate, getPublicPuzzleDayNumber } from "@/lib/puzzle-data.server";
import { BoardScreen } from "@/components/board/BoardScreen";

// revalidate is omitted: cookies()/getUser() in createClient() force dynamic
// rendering anyway, so an ISR directive here would be silently ignored.

interface Props {
  params: Promise<{ date: string }>;
}

export default async function PlayDatePage({ params }: Props) {
  const { date } = await params;

  if (!isValidDate(date)) redirect("/archive");

  // Gate the "future date" guard by the user's local day so a UTC+ user near
  // midnight can still open their local-today archive entry (EPIC-B).
  const today = await getLocalToday();
  if (date > today) redirect("/archive");

  // Fetch puzzle + day number; DB errors redirect to archive via the catch.
  // redirects are kept OUTSIDE the try so NEXT_REDIRECT is never swallowed.
  let puzzleRow: { id: string; difficulty: string; grid_spec: unknown } | null = null;
  let dayNo: number | undefined;
  let initialSolveDurationMs: number | undefined;

  try {
    const supabase = await createClient();

    const [data, count, { data: { user } }] = await Promise.all([
      getPublicPuzzleByDate(date),
      getPublicPuzzleDayNumber(date),
      supabase.auth.getUser(),
    ]);

    puzzleRow = data;
    if (data) dayNo = count;

    // Already solved this day? Tell BoardScreen so it mounts in review mode
    // instead of a fresh playable board (was always fresh, regardless of
    // solve history — see DECISIONS.md WEB-BOARD-REVIEW-1).
    if (data && user) {
      const { data: solve } = await supabase
        .from("solves")
        .select("duration_ms")
        .eq("user_id", user.id)
        .eq("puzzle_id", data.id)
        .maybeSingle();
      if (solve) initialSolveDurationMs = solve.duration_ms ?? 0;
    }
  } catch {
    redirect("/archive");
  }

  // No puzzle exists for this (valid, non-future) date → genuine 404, render the
  // branded not-found boundary rather than silently bouncing to /archive.
  if (!puzzleRow) notFound();

  const spec = parseGridSpec(puzzleRow.grid_spec);
  if (!spec) notFound();

  const VALID_DIFFICULTIES = ["easy", "medium", "hard"] as const;
  const rawDifficulty = puzzleRow.difficulty;
  if (!VALID_DIFFICULTIES.includes(rawDifficulty as Difficulty)) notFound();

  return (
    // key by date so navigating between archive days remounts the board.
    <BoardScreen
      key={date}
      puzzle={{ size: 6, ...spec, difficulty: rawDifficulty as Difficulty }}
      puzzleId={puzzleRow.id}
      dayNo={dayNo}
      date={date}
      kind="archive"
      backHref="/archive"
      initialSolveDurationMs={initialSolveDurationMs}
    />
  );
}
