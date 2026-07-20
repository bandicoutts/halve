import { createClient } from "@/lib/supabase/server";
import { solveDay } from "@/lib/local-date";
import { computeStreak, computeLastDays, offsetDay } from "@/lib/streak";

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

function StreakBand({
  streak,
  last7,
  solvedToday,
}: {
  streak: number;
  last7: boolean[];
  solvedToday?: boolean | undefined;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: "var(--surface)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-lg)",
        padding: "14px 16px",
        maxWidth: 420,
        width: "100%",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: "var(--radius-full)",
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
          <span className="tnum" style={{ color: "var(--accent-text)" }}>
            {streak}
          </span>{" "}
          day streak
        </div>
        <div style={{ fontSize: "var(--text-label)", color: "var(--fg-3)", marginTop: 1 }}>
          {solvedToday ? "Solved today. Streak kept." : "Solve today to keep it going"}
        </div>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {last7.map((on, i) => (
          <span
            key={`dot-${i}`}
            style={{
              width: 7,
              height: 7,
              borderRadius: "var(--radius-full)",
              background: on ? "var(--accent)" : "var(--hairline-2)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface Props {
  /** Authenticated user id, resolved once by the parent (page.tsx) — avoids a
   *  redundant getUser() round-trip inside this streamed Suspense child (NXT-2). */
  userId: string;
  /** The user's local calendar day, already resolved by the parent (NXT-2). */
  today: string;
  solvedToday?: boolean | undefined;
}

export async function HomeUserContent({ userId, today, solvedToday }: Props) {
  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from("solves")
      .select("solved_at, local_date")
      .eq("user_id", userId)
      .gte("local_date", offsetDay(today, -60))
      .order("solved_at", { ascending: false });

    const rows = data ?? [];
    const days = [...new Set(rows.map(solveDay))];
    const streak = computeStreak(days, today);
    if (streak <= 0) return null;

    const last7 = computeLastDays(days, today, 7);
    return <StreakBand streak={streak} last7={last7} solvedToday={solvedToday} />;
  } catch {
    return null;
  }
}
