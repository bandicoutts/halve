import { createClient } from "@/lib/supabase/server";
import { StatsScreen } from "@/components/screens/StatsScreen";

export interface UserStats {
  displayName: string;
  streak: number;
  longestStreak: number;
  totalSolved: number;
  avgTimeSecs: number | null;
  bestTimeSecs: number | null;
  last14Days: boolean[];
  /** Counts per bucket: <2m, 2–3m, 3–4m, 4–5m, 5–6m, 6+m */
  timeDist: number[];
}

function computeStreak(days: string[], today: string): number {
  const set = new Set(days);
  let n = 0;
  const d = new Date(today);
  while (set.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

function computeLongestStreak(days: string[]): number {
  if (!days.length) return 0;
  const sorted = [...days].sort();
  let longest = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round(
      (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000
    );
    if (diff === 1) { cur++; if (cur > longest) longest = cur; }
    else if (diff > 1) cur = 1;
  }
  return longest;
}

function computeLast14(days: string[], today: string): boolean[] {
  const set = new Set(days);
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    return set.has(d.toISOString().slice(0, 10));
  });
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
      const today = new Date().toISOString().slice(0, 10);

      const [{ data: solves }, { data: profile }] = await Promise.all([
        supabase.from("solves").select("*").eq("user_id", user.id).order("solved_at"),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);

      const rows = solves ?? [];
      const days = [...new Set(rows.map((r) => r.solved_at.slice(0, 10)))];
      const durations = rows.map((r) => r.duration_ms);
      const avg = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 1000) : null;
      const best = durations.length ? Math.round(Math.min(...durations) / 1000) : null;

      stats = {
        displayName: profile?.display_name ?? user.email?.split("@")[0] ?? "You",
        streak: computeStreak(days, today),
        longestStreak: computeLongestStreak(days),
        totalSolved: rows.length,
        avgTimeSecs: avg,
        bestTimeSecs: best,
        last14Days: computeLast14(days, today),
        timeDist: computeTimeDist(durations),
      };
    }
  } catch {
    // DB unavailable — render guest state
  }

  return <StatsScreen stats={stats} />;
}
