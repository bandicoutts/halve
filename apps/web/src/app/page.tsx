import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getLocalToday, formatDateLabel } from "@/lib/local-date";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { HomeUserContent } from "./_components/HomeUserContent";

export default async function Home() {
  let fetchError = false;
  let difficulty: string | undefined;
  let puzzleNumber: number | undefined;
  let todayPuzzleId: string | undefined;
  let isAuthenticated = false;
  let archiveCount: number | undefined;
  let lastDifficulty: string | undefined;
  let solvedToday = false;
  let solveDurationMs: number | undefined;
  let displayName: string | undefined;

  // Gate "today" by the user's local calendar day — the SAME source streaks use
  // (getLocalToday reads the tz_date cookie). Computed on the server and the hero
  // label is derived from it + passed as a prop, so the client never calls
  // `new Date()` at render (avoids the SSR/CSR hydration mismatch — NXT-1).
  const today = await getLocalToday();
  const todayLabel = formatDateLabel(today);

  try {
    const supabase = await createClient();

    const [
      { data: { user } },
      { data: todayPuzzle },
      { count: totalCount },
      { data: lastPast },
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("puzzles").select("id, difficulty").eq("date", today).maybeSingle(),
      supabase.from("puzzles").select("*", { count: "exact", head: true }).lte("date", today),
      supabase.from("puzzles").select("difficulty").lt("date", today).order("date", { ascending: false }).limit(1).maybeSingle(),
    ]);

    isAuthenticated = !!user;
    if (user) {
      // Initial for the account avatar in the TopBar; falls back to the email.
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      displayName = profile?.display_name ?? user.email ?? undefined;
    }
    if (todayPuzzle) {
      difficulty = todayPuzzle.difficulty;
      todayPuzzleId = todayPuzzle.id;
    }
    if (totalCount !== null && totalCount > 0) puzzleNumber = totalCount;
    const pastCount = (totalCount ?? 0) - (todayPuzzle ? 1 : 0);
    if (pastCount > 0) {
      archiveCount = pastCount;
      lastDifficulty = lastPast?.difficulty ?? undefined;
    }

    // Has the user already solved today's puzzle? Checked by puzzle_id so it's
    // timezone-agnostic. Drives the home hero's solved-confirmation state.
    if (user && todayPuzzleId) {
      const { data: solveRow } = await supabase
        .from("solves")
        .select("duration_ms")
        .eq("user_id", user.id)
        .eq("puzzle_id", todayPuzzleId)
        .maybeSingle();
      if (solveRow) {
        solvedToday = true;
        solveDurationMs = solveRow.duration_ms ?? undefined;
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
      archiveCount={archiveCount}
      lastDifficulty={lastDifficulty}
      solvedToday={solvedToday}
      solveDurationMs={solveDurationMs}
      streakBand={
        isAuthenticated ? (
          <Suspense fallback={<div style={{ height: 66 }} />}>
            <HomeUserContent puzzleId={todayPuzzleId} solvedToday={solvedToday} />
          </Suspense>
        ) : null
      }
    />
  );
}
