import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
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

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);

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
      fetchError={fetchError}
      isAuthenticated={isAuthenticated}
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
