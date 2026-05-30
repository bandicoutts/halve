"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { generatePuzzle } from "@parity/engine";
import type { Difficulty, Puzzle } from "@parity/engine";
import { BoardScreen } from "@/components/board/BoardScreen";
import { BoardSkeleton } from "@/components/board/BoardSkeleton";

const VALID: Difficulty[] = ["easy", "medium", "hard"];

export function PracticePlayClient() {
  const params = useSearchParams();
  const raw = params.get("difficulty") ?? "medium";
  const difficulty = (VALID.includes(raw as Difficulty) ? raw : "medium") as Difficulty;

  /* Generate only on client to avoid SSR/client mismatch with Math.random */
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  useEffect(() => {
    setPuzzle(generatePuzzle({ size: 6, difficulty }));
  }, [difficulty]);

  if (!puzzle) return <BoardSkeleton />;

  return <BoardScreen puzzle={puzzle} backHref="/practice" />;
}
