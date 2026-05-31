import { createClient } from "@/lib/supabase/server";
import { getLocalToday, solveDay } from "@/lib/local-date";
import { computeStreak, computeLongestStreak, computeLastDays } from "@/lib/streak";
import { StatsScreen } from "@/components/screens/StatsScreen";

export interface UserStats {
  displayName: string;
  /** e.g. "January 2026" */
  since: string;
  streak: number;
  longestStreak: number;
  totalSolved: number;
  avgTimeSecs: number | null;
  bestTimeSecs: number | null;
  last14Days: boolean[];
  /** Counts per bucket: <2m, 2–3m, 3–4m, 4–5m, 5–6m, 6+m */
  timeDist: number[];
}

function computeTimeDist(durations: number[]): number[] {
  const b = [0, 0, 0, 0, 0, 0];
  for (const ms of durations) {
    const m = ms / 60000;
    if (m < 2) b[0]++;
    else if (m < 3) b[1]++;
    else if (m < 4) b[2]++;
    else if (m < 5) b[3]++;
    else if (m < 6) b[4]++;
    else b[5]++;
  }
  return b;
}

export default async function StatsPage() {
  let stats: UserStats | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const today = await getLocalToday();

      const [{ data: solves }, { data: profile }] = await Promise.all([
        supabase.from("solves").select("solved_at, duration_ms, local_date").eq("user_id", user.id).order("solved_at"),
        supabase.from("profiles").select("display_name, created_at").eq("id", user.id).maybeSingle(),
      ]);

      const rows = solves ?? [];
      const days = [...new Set(rows.map(solveDay))];
      const durations = rows.map((r) => r.duration_ms);
      const avg = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 1000) : null;
      const best = durations.length ? Math.round(Math.min(...durations) / 1000) : null;

      const firstSolveDate = rows[0]?.solved_at
        ? new Date(rows[0].solved_at)
        : new Date(user.created_at);
      const since = firstSolveDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      stats = {
        displayName: profile?.display_name ?? user.email?.split("@")[0] ?? "You",
        since,
        streak: computeStreak(days, today),
        longestStreak: computeLongestStreak(days),
        totalSolved: rows.length,
        avgTimeSecs: avg,
        bestTimeSecs: best,
        last14Days: computeLastDays(days, today, 14),
        timeDist: computeTimeDist(durations),
      };
    }
  } catch {
    // DB unavailable — render guest state
  }

  return <StatsScreen stats={stats} />;
}
