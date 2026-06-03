"use client";
import { useCallback, useState } from "react";
import type { MutableRefObject } from "react";
import type { Grid } from "@parity/engine";
import { createClient } from "@/lib/supabase/client";
import { recordSolve } from "@/app/actions/record-solve";
import { computeStreak, offsetDay } from "@/lib/streak";
import { computeNextIn } from "@/lib/puzzle-clock";

export function useRecordSolve({
  puzzleId,
  usedHint,
  kind,
  cellsRef,
  secsRef,
}: {
  puzzleId: string | undefined;
  usedHint: boolean;
  kind: "daily" | "archive" | "practice";
  cellsRef: MutableRefObject<Grid>;
  secsRef: MutableRefObject<number>;
}) {
  const [saveError, setSaveError] = useState(false);
  const [streakData, setStreakData] = useState<{
    streak: number;
    nextIn: string;
  } | null>(null);

  const recordAndFetch = useCallback(async () => {
    if (!puzzleId) return;
    setSaveError(false);
    // Guests get a silent no-op — no solve to record, no streak to show.
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const result = await recordSolve({
      puzzleId,
      grid: cellsRef.current,
      durationMs: Math.max(1, secsRef.current * 1000),
      usedHint,
      localDate: new Date().toLocaleDateString("en-CA"),
    });

    if (!result.ok && !result.alreadySolved) {
      setSaveError(true);
      return;
    }

    if (kind === "daily") {
      const today = new Date().toLocaleDateString("en-CA");
      const { data: solveDays } = await supabase
        .from("solves")
        .select("solved_at, local_date")
        .eq("user_id", user.id)
        .gte("local_date", offsetDay(today, -60));
      const days = [
        ...new Set(
          (solveDays ?? []).map(
            (r: { solved_at: string; local_date: string | null }) =>
              r.local_date ?? r.solved_at.slice(0, 10)
          )
        ),
      ] as string[];
      setStreakData({
        streak: computeStreak(days, today),
        nextIn: computeNextIn(),
      });
    }
  }, [puzzleId, usedHint, kind, cellsRef, secsRef]);

  return { recordAndFetch, saveError, streakData };
}
