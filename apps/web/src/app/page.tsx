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

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);

    const [
      { data: { user } },
      { data: todayPuzzle },
      { count },
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("puzzles").select("id, difficulty").eq("date", today).maybeSingle(),
      supabase.from("puzzles").select("*", { count: "exact", head: true }).lte("date", today),
    ]);

    isAuthenticated = !!user;
    if (todayPuzzle) {
      difficulty = todayPuzzle.difficulty;
      todayPuzzleId = todayPuzzle.id;
    }
    if (count !== null && count > 0) puzzleNumber = count;
  } catch {
    fetchError = true;
  }

  return (
    <HomeScreen
      difficulty={difficulty}
      puzzleNumber={puzzleNumber}
      fetchError={fetchError}
      isAuthenticated={isAuthenticated}
      streakBand={
        isAuthenticated ? (
          <Suspense fallback={<div style={{ height: 66 }} />}>
            <HomeUserContent puzzleId={todayPuzzleId} />
          </Suspense>
        ) : null
      }
    />
  );
}
