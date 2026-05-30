import { createClient } from "@/lib/supabase/server";

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

interface Props {
  puzzleId?: string;
}

export async function HomeUserContent({ puzzleId }: Props) {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("solves")
      .select("solved_at, puzzle_id")
      .eq("user_id", user.id)
      .order("solved_at", { ascending: false });

    const rows = data ?? [];
    const days = [...new Set(rows.map((r) => r.solved_at.slice(0, 10)))];
    const streak = computeStreak(days, today);

    if (streak <= 0) return null;

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
        </svg>
        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-1)" }}>
          <span className="tnum" style={{ color: "var(--accent)" }}>{streak}</span>
          {" day streak"}
        </span>
      </div>
    );
  } catch {
    return null;
  }
}
