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

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      isSignedIn = true;
      const today = new Date().toISOString().slice(0, 10);

      const [{ data }, { data: todayPuzzle }] = await Promise.all([
        supabase
          .from("solves")
          .select("*")
          .eq("user_id", user.id)
          .order("solved_at", { ascending: false }),
        supabase
          .from("puzzles")
          .select("id")
          .eq("date", today)
          .maybeSingle(),
      ]);

      if (data) {
        const days = [...new Set(data.map((r) => r.solved_at.slice(0, 10)))];
        streak = computeStreak(days, today);
        if (todayPuzzle) {
          solvedToday = data.some((r) => r.puzzle_id === todayPuzzle.id);
        }
      }
    }
  } catch {
    // Supabase unavailable — render guest state
  }

  return <HomeScreen streak={streak} isSignedIn={isSignedIn} solvedToday={solvedToday} />;
}
