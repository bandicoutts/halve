import { createClient } from "@/lib/supabase/server";
import { HomeScreen } from "@/components/screens/HomeScreen";

function computeStreak(days: string[], today: string): number {
  const set = new Set(days);
  let streak = 0;
  const d = new Date(today);
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default async function Home() {
  let streak: number | undefined;
  let isSignedIn = false;
  let solvedToday = false;
  let difficulty: string | undefined;
  let puzzleNumber: number | undefined;
  let fetchError = false;

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);

    // Fire auth + both puzzle queries simultaneously
    const [authResult, { data: todayPuzzle }, { count }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("puzzles").select("id, difficulty").eq("date", today).maybeSingle(),
      supabase.from("puzzles").select("*", { count: "exact", head: true }).lte("date", today),
    ]);

    const user = authResult.data.user;

    if (todayPuzzle) difficulty = todayPuzzle.difficulty;
    if (count !== null && count > 0) puzzleNumber = count;

    if (user) {
      isSignedIn = true;

      const { data } = await supabase
        .from("solves")
        .select("*")
        .eq("user_id", user.id)
        .order("solved_at", { ascending: false });

      if (data) {
        const days = [...new Set(data.map((r) => r.solved_at.slice(0, 10)))];
        streak = computeStreak(days, today);
        if (todayPuzzle) {
          solvedToday = data.some((r) => r.puzzle_id === todayPuzzle.id);
        }
      }
    }
  } catch {
    fetchError = true;
  }

  return <HomeScreen streak={streak} isSignedIn={isSignedIn} solvedToday={solvedToday} difficulty={difficulty} puzzleNumber={puzzleNumber} fetchError={fetchError} />;
}
