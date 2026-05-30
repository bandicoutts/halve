import { redirect } from "next/navigation";
import type { Grid, Edge, Solution } from "@parity/engine";
import { createClient } from "@/lib/supabase/server";
import { BoardScreen } from "@/components/board/BoardScreen";

export const revalidate = 86400;

interface StoredGridSpec {
  solution: number[][];
  givens: (number | null)[][];
  edges: { orientation: "h" | "v"; r: number; c: number; kind: "eq" | "ne" }[];
}

interface Props {
  params: Promise<{ date: string }>;
}

export default async function PlayDatePage({ params }: Props) {
  const { date } = await params;

  // Reject obviously malformed segments before any DB call.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    redirect("/archive");
  }

  const today = new Date().toISOString().slice(0, 10);

  // Future dates are not playable yet.
  if (date > today) {
    redirect("/archive");
  }

  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from("puzzles")
      .select("*")
      .eq("date", date)
      .maybeSingle();

    if (!data) {
      redirect("/archive");
    }

    // Compute day number: count of puzzles with a date on or before this one.
    const { count } = await supabase
      .from("puzzles")
      .select("id", { count: "exact", head: true })
      .not("date", "is", null)
      .lte("date", date);

    const dayNo = count ?? undefined;

    const spec = data.grid_spec as unknown as StoredGridSpec;
    const puzzle = {
      size: 6,
      givens: spec.givens as Grid,
      edges: spec.edges as Edge[],
      solution: spec.solution as Solution,
      difficulty: data.difficulty,
    };

    return (
      <BoardScreen
        puzzle={puzzle}
        puzzleId={data.id}
        dayNo={dayNo}
        backHref="/archive"
      />
    );
  } catch {
    redirect("/archive");
  }
}
