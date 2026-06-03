import { createClient } from "@/lib/supabase/server";
import { ArchiveScreen } from "@/components/screens/ArchiveScreen";
import type { ArchiveDayEntry, ArchiveMonth } from "@/components/screens/ArchiveScreen";
import { getLocalToday } from "@/lib/local-date";

// revalidate is omitted: cookies()/getUser() force dynamic rendering anyway.

export default async function ArchivePage() {
  const today = await getLocalToday();

  const months: ArchiveMonth[] = [];
  let initialId: string | undefined;

  try {
    const supabase = await createClient();
    const [
      {
        data: { user },
      },
      { data: puzzles },
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("puzzles")
        .select("id, date, difficulty")
        .not("date", "is", null)
        .lte("date", today)
        .order("date", { ascending: true }),
    ]);

    const rows = puzzles ?? [];

    // Fetch solve data (puzzle_id + best duration) for the current user
    const solvedIds = new Set<string>();
    const solveTimeMap = new Map<string, number>();

    if (user && rows.length > 0) {
      // Fetch all the user's solves rather than filtering by puzzle id. A
      // `.in("puzzle_id", ids)` filter encodes every UUID into the request URL,
      // which silently breaks past ~200 puzzles (PostgREST/proxy URL limits).
      // RLS already restricts rows to this user; we intersect in memory below.
      const { data: solves } = await supabase
        .from("solves")
        .select("puzzle_id, duration_ms")
        .eq("user_id", user.id);

      for (const s of solves ?? []) {
        solvedIds.add(s.puzzle_id);
        const existing = solveTimeMap.get(s.puzzle_id);
        if (existing === undefined || s.duration_ms < existing) {
          solveTimeMap.set(s.puzzle_id, s.duration_ms);
        }
      }
    }

    // Build flat list with day numbers (1-indexed ascending)
    const allDays: ArchiveDayEntry[] = rows.map((r, i) => {
      const timeMs = solveTimeMap.get(r.id);
      return {
        id: r.id,
        date: r.date as string,
        day: parseInt((r.date as string).split("-")[2]!, 10),
        dayNo: i + 1,
        difficulty: r.difficulty as ArchiveDayEntry["difficulty"],
        isToday: r.date === today,
        solved: solvedIds.has(r.id),
        ...(timeMs !== undefined ? { timeMs } : {}),
      };
    });

    // Group by month, build ArchiveMonth[]
    const monthMap = new Map<string, ArchiveMonth>();
    for (const entry of allDays) {
      const [y, m] = entry.date.split("-").map(Number);
      const key = `${y}-${m}`;
      if (!monthMap.has(key)) {
        const label = new Date(Date.UTC(y!, m! - 1, 1)).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
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
