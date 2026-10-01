import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getLocalToday } from "@/lib/local-date.server";
import { formatDateLabel } from "@/lib/local-date";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { HomeUserContent } from "./_components/HomeUserContent";

export default async function Home() {
  let fetchError = false;
  let difficulty: string | undefined;
  let puzzleNumber: number | undefined;
  let todayPuzzleId: string | undefined;
  let isAuthenticated = false;
  let solvedToday = false;
  let solveDurationMs: number | undefined;
  let displayName: string | undefined;
  let userId: string | undefined;

  // Gate "today" by the user's local calendar day — the SAME source streaks use
  // (getLocalToday reads the tz_date cookie). Computed on the server and the hero
  // label is derived from it + passed as a prop, so the client never calls
  // `new Date()` at render (avoids the SSR/CSR hydration mismatch — NXT-1).
  const today = await getLocalToday();
  const todayLabel = formatDateLabel(today);

  try {
    const supabase = await createClient();

    const [{ data: { user } }, { data: todayPuzzle }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("puzzles").select("id, difficulty").eq("date", today).maybeSingle(),
    ]);

    isAuthenticated = !!user;
    userId = user?.id;
    if (todayPuzzle) {
      difficulty = todayPuzzle.difficulty;
      todayPuzzleId = todayPuzzle.id;
    }
    // Round 2: the profile (account avatar initial) and today's solve check both
    // depend only on `user` (+ the puzzle id we now have), so run them in one
    // parallel batch instead of serially (NXT-3). The solve is keyed by puzzle_id
    // so it's timezone-agnostic; it drives the hero's solved-confirmation state.
    if (user) {
      const [{ data: profile }, solve] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        todayPuzzleId
          ? supabase
              .from("solves")
              .select("duration_ms")
              .eq("user_id", user.id)
              .eq("puzzle_id", todayPuzzleId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      displayName = profile?.display_name ?? user.email ?? undefined;
      if (solve.data) {
        solvedToday = true;
        solveDurationMs = solve.data.duration_ms ?? undefined;
      }
    }
  } catch {
    fetchError = true;
  }

  return (
    <HomeScreen
      difficulty={difficulty}
      puzzleNumber={puzzleNumber}
      todayLabel={todayLabel}
      fetchError={fetchError}
      isAuthenticated={isAuthenticated}
      displayName={displayName}
      solvedToday={solvedToday}
      solveDurationMs={solveDurationMs}
      streakBand={
        isAuthenticated && userId ? (
          <Suspense fallback={<div style={{ height: 66 }} />}>
            <HomeUserContent userId={userId} today={today} solvedToday={solvedToday} />
          </Suspense>
        ) : null
      }
    />
  );
}
