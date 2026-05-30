import { createClient } from "@/lib/supabase/server";
import { ArchiveScreen } from "@/components/screens/ArchiveScreen";
import type { ArchivePuzzle } from "@/components/screens/ArchiveScreen";

export const revalidate = 3600;

export default async function ArchivePage() {
  const today = new Date().toISOString().slice(0, 10);

  let todayPuzzle: ArchivePuzzle | null = null;
  let pastPuzzles: ArchivePuzzle[] = [];

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch all puzzles up to and including today, ordered by date asc so we
    // can assign day numbers as rank.
    const { data: puzzles } = await supabase
      .from("puzzles")
      .select("id, date, difficulty")
      .not("date", "is", null)
      .lte("date", today)
      .order("date", { ascending: true });

    const rows = puzzles ?? [];

    // Fetch solved puzzle IDs for the current user.
    let solvedIds = new Set<string>();
    if (user && rows.length > 0) {
      const ids = rows.map((r) => r.id);
      const { data: solves } = await supabase
        .from("solves")
        .select("puzzle_id")
        .eq("user_id", user.id)
        .in("puzzle_id", ids);
      solvedIds = new Set((solves ?? []).map((s) => s.puzzle_id));
    }

    // Assign day numbers (1-indexed, ascending by date).
    const all: ArchivePuzzle[] = rows.map((r, i) => ({
      id: r.id,
      date: r.date as string,
      difficulty: r.difficulty as ArchivePuzzle["difficulty"],
      dayNo: i + 1,
      solved: solvedIds.has(r.id),
    }));

    // Split today vs past, display past newest-first.
    const todayRow = all.find((p) => p.date === today) ?? null;
    const past = all.filter((p) => p.date !== today).reverse();

    todayPuzzle = todayRow;
    pastPuzzles = past;
  } catch {
    // DB unavailable — render empty state
  }

  return <ArchiveScreen today={todayPuzzle} past={pastPuzzles} />;
}
