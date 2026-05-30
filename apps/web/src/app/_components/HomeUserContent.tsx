import { createClient } from "@/lib/supabase/server";
import { getLocalToday, solveDay } from "@/lib/local-date";

/** Offset a YYYY-MM-DD string by `delta` days without timezone conversion. */
function offsetDay(date: string, delta: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toLocaleDateString("en-CA");
}

function computeStreak(days: string[], today: string): number {
  const set = new Set(days);
  let streak = 0;
  let cur = today;
  while (set.has(cur)) {
    streak++;
    cur = offsetDay(cur, -1);
  }
  return streak;
}

function computeLast7(days: string[], today: string): boolean[] {
  const set = new Set(days);
  return Array.from({ length: 7 }, (_, i) => set.has(offsetDay(today, -(6 - i))));
}

function FlameIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent)"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
    </svg>
  );
}

function StreakBand({ streak, last7 }: { streak: number; last7: boolean[] }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "var(--surface)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-lg)",
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 999,
          background: "var(--accent-tint)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <FlameIcon />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg-1)" }}>
          <span className="tnum" style={{ color: "var(--accent)" }}>
            {streak}
          </span>{" "}
          day streak
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 1 }}>
          Solve today to keep it going
        </div>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {last7.map((on, i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: on ? "var(--accent)" : "var(--hairline-2)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface Props {
  puzzleId?: string;
}

export async function HomeUserContent({ puzzleId: _puzzleId }: Props) {
  try {
    const supabase = await createClient();
    const today = await getLocalToday();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("solves")
      .select("solved_at, local_date")
      .eq("user_id", user.id)
      .order("solved_at", { ascending: false });

    const rows = data ?? [];
    const days = [...new Set(rows.map(solveDay))];
    const streak = computeStreak(days, today);
    if (streak <= 0) return null;

    const last7 = computeLast7(days, today);
    return <StreakBand streak={streak} last7={last7} />;
  } catch {
    return null;
  }
}
