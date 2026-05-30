import { generatePuzzle } from "@parity/engine";
import type { Grid, Edge, Solution } from "@parity/engine";
import { createClient } from "@/lib/supabase/server";
import { BoardScreen } from "@/components/board/BoardScreen";

export const revalidate = 3600;

interface StoredGridSpec {
  solution: number[][];
  givens: (number | null)[][];
  edges: { orientation: "h" | "v"; r: number; c: number; kind: "eq" | "ne" }[];
}

export default async function PlayPage() {
  const today = new Date().toISOString().slice(0, 10);

  let puzzleId: string | undefined;
  let puzzle = generatePuzzle({ size: 6, difficulty: "medium" });

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("puzzles")
      .select("*")
      .eq("date", today)
      .maybeSingle();

    if (data) {
      const spec = data.grid_spec as unknown as StoredGridSpec;
      puzzle = {
        size: 6,
        givens: spec.givens as Grid,
        edges: spec.edges as Edge[],
        solution: spec.solution as Solution,
        difficulty: data.difficulty,
      };
      puzzleId = data.id;
    }
  } catch {
    // DB unavailable — fall back to generated puzzle
  }

  return <BoardScreen puzzle={puzzle} puzzleId={puzzleId} backHref="/" />;
}
