import { notFound, redirect } from "next/navigation";
import type { Difficulty } from "@parity/engine";
import { createClient } from "@/lib/supabase/server";
import { getLocalToday } from "@/lib/local-date";
import { parseGridSpec } from "@/lib/grid-spec";
import { BoardScreen } from "@/components/board/BoardScreen";

// revalidate is omitted: cookies()/getUser() in createClient() force dynamic
// rendering anyway, so an ISR directive here would be silently ignored.

interface Props {
  params: Promise<{ date: string }>;
}

export default async function PlayDatePage({ params }: Props) {
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect("/archive");

  // Gate the "future date" guard by the user's local day so a UTC+ user near
  // midnight can still open their local-today archive entry (EPIC-B).
  const today = await getLocalToday();
  if (date > today) redirect("/archive");

  // Fetch puzzle + day number; DB errors redirect to archive via the catch.
  // redirects are kept OUTSIDE the try so NEXT_REDIRECT is never swallowed.
  let puzzleRow: { id: string; difficulty: string; grid_spec: unknown } | null = null;
  let dayNo: number | undefined;

  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from("puzzles")
      .select("id, difficulty, grid_spec")
      .eq("date", date)
      .maybeSingle();

    puzzleRow = data;

    if (data) {
      const { count } = await supabase
        .from("puzzles")
        .select("id", { count: "exact", head: true })
        .not("date", "is", null)
        .lte("date", date);
      dayNo = count ?? undefined;
    }
  } catch {
    redirect("/archive");
  }

  // No puzzle exists for this (valid, non-future) date → genuine 404, render the
  // branded not-found boundary rather than silently bouncing to /archive.
  if (!puzzleRow) notFound();

  const spec = parseGridSpec(puzzleRow.grid_spec);
  if (!spec) notFound();

  return (
    <BoardScreen
      puzzle={{ size: 6, ...spec, difficulty: puzzleRow.difficulty as Difficulty }}
      puzzleId={puzzleRow.id}
      dayNo={dayNo}
      date={date}
      kind="archive"
      backHref="/archive"
    />
  );
}
