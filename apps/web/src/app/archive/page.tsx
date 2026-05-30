import { createClient } from "@/lib/supabase/server";
import { ArchiveScreen } from "@/components/screens/ArchiveScreen";
import type { ArchiveDayEntry, ArchiveMonth } from "@/components/screens/ArchiveScreen";

export const revalidate = 3600;

export default async function ArchivePage() {
  const today = new Date().toISOString().slice(0, 10);

  const months: ArchiveMonth[] = [];
  let initialId: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch all puzzles up to today, ascending by date
    const { data: puzzles } = await supabase
      .from("puzzles")
      .select("id, date, difficulty")
      .not("date", "is", null)
      .lte("date", today)
      .order("date", { ascending: true });

    const rows = puzzles ?? [];

    // Fetch solve data (puzzle_id + best duration) for the current user
    const solvedIds = new Set<string>();
    const solveTimeMap = new Map<string, number>();

    if (user && rows.length > 0) {
      const ids = rows.map((r) => r.id);
      const { data: solves } = await supabase
        .from("solves")
        .select("puzzle_id, duration_ms")
        .eq("user_id", user.id)
        .in("puzzle_id", ids);

      for (const s of solves ?? []) {
        solvedIds.add(s.puzzle_id);
        const existing = solveTimeMap.get(s.puzzle_id);
        if (existing === undefined || s.duration_ms < existing) {
          solveTimeMap.set(s.puzzle_id, s.duration_ms);
        }
      }
    }

    // Build flat list with day numbers (1-indexed ascending)
    const allDays: ArchiveDayEntry[] = rows.map((r, i) => ({
      id: r.id,
      date: r.date as string,
      day: parseInt((r.date as string).split("-")[2]!, 10),
      dayNo: i + 1,
      difficulty: r.difficulty as ArchiveDayEntry["difficulty"],
      isToday: r.date === today,
      solved: solvedIds.has(r.id),
      timeMs: solveTimeMap.get(r.id),
    }));

    // Group by month, build ArchiveMonth[]
    const monthMap = new Map<string, ArchiveMonth>();
    for (const entry of allDays) {
      const [y, m] = entry.date.split("-").map(Number);
      const key = `${y}-${m}`;
      if (!monthMap.has(key)) {
        const label = new Date(y!, m! - 1, 1).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
        monthMap.set(key, { label, year: y!, monthIdx: m! - 1, days: [] });
      }
      monthMap.get(key)!.days.push(entry);
    }

    // newest-first
    months.push(...Array.from(monthMap.values()).reverse());

    // initialId = today's puzzle, or most recent puzzle
    const todayEntry = allDays.find((d) => d.isToday);
    initialId = todayEntry?.id ?? allDays[allDays.length - 1]?.id;
  } catch {
    // DB unavailable — render empty state
  }

  return <ArchiveScreen months={months} initialId={initialId} />;
}
