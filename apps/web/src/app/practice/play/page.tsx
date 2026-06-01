import type { Difficulty } from "@parity/engine";
import { createClient } from "@/lib/supabase/server";
import { parseGridSpec } from "@/lib/grid-spec";
import { BoardScreen } from "@/components/board/BoardScreen";
import { PracticeUnavailable } from "@/components/screens/PracticeUnavailable";

const VALID: Difficulty[] = ["easy", "medium", "hard"];

interface Props {
  searchParams: Promise<{ difficulty?: string }>;
}

export default async function PracticePlayPage({ searchParams }: Props) {
  const { difficulty: rawDifficulty } = await searchParams;
  const raw = rawDifficulty ?? "medium";
  const difficulty = (VALID.includes(raw as Difficulty) ? raw : "medium") as Difficulty;

  // Practice puzzles come from the shared dateless pool via the get_practice_puzzle
  // RPC so web and mobile show the SAME puzzles (web==mobile parity). No more
  // client-side generatePuzzle(), which produced a different puzzle per device.
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .rpc("get_practice_puzzle", { p_difficulty: difficulty })
      .maybeSingle();

    if (error) {
      console.error(`[practice-puzzle] get_practice_puzzle(${difficulty}) failed:`, error);
      return <PracticeUnavailable difficulty={difficulty} />;
    }

    // Pool not populated yet (seed script runs later) — no row is expected.
    if (!data) {
      console.error(
        `[practice-puzzle] empty practice pool for difficulty=${difficulty} — pool not seeded yet`,
      );
      return <PracticeUnavailable difficulty={difficulty} />;
    }

    const spec = parseGridSpec(data.grid_spec);
    if (!spec) {
      console.error(`[practice-puzzle] malformed grid_spec for puzzle ${data.id}`);
      return <PracticeUnavailable difficulty={difficulty} />;
    }

    // NOTE: intentionally no `puzzleId` for practice. Recording a solve requires a
    // puzzleId, and record_solve rejects dateless (practice) puzzles; even if it
    // didn't, a practice solve would write a `solves` row whose local_date falsely
    // credits the daily streak (streaks derive from solves.local_date with no
    // practice filter). So practice does not record — matching prior behavior.
    // Future head-to-head competition on practice puzzles will need its own
    // results path (and would key off data.id), not the daily `solves` table.
    return (
      <BoardScreen
        puzzle={{ size: 6, ...spec, difficulty: data.difficulty as Difficulty }}
        kind="practice"
        backHref="/practice"
      />
    );
  } catch (err) {
    console.error(`[practice-puzzle] DB unavailable for difficulty=${difficulty}:`, err);
    return <PracticeUnavailable difficulty={difficulty} />;
  }
}
