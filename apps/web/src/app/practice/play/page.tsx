import type { Difficulty } from "@parity/engine";
import { createClient } from "@/lib/supabase/server";
import { parseGridSpec } from "@/lib/grid-spec";
import { BoardScreen } from "@/components/board/BoardScreen";
import { PracticeUnavailable } from "@/components/screens/PracticeUnavailable";

const VALID: Difficulty[] = ["easy", "medium", "hard"];

interface Props {
  searchParams: Promise<{ difficulty?: string; r?: string }>;
}

export default async function PracticePlayPage({ searchParams }: Props) {
  const { difficulty: rawDifficulty, r } = await searchParams;
  const raw = rawDifficulty ?? "medium";
  const difficulty = (VALID.includes(raw as Difficulty) ? raw : "medium") as Difficulty;

  // `r` is a per-navigation random slot index. The RPC maps any integer into the
  // pool via mod(total), so a fresh `r` yields a different practice puzzle each
  // time (unlimited practice). When absent (e.g. a shared link), p_seq stays null
  // and the RPC falls back to its stable day-rotation pick.
  const seq = r !== undefined && /^\d+$/.test(r) ? Number(r) % 1_000_000_007 : null;

  // Practice puzzles come from the shared dateless pool via the get_practice_puzzle
  // RPC so web and mobile can share the SAME pool. No client-side generatePuzzle().
  // Resolve the puzzle inside the try; construct JSX after it (JSX in a try/catch
  // can have render-time throws swallowed by the catch — same pattern as
  // play/[date]).
  let spec: ReturnType<typeof parseGridSpec> = null;
  let resolvedDifficulty: Difficulty = difficulty;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .rpc("get_practice_puzzle", { p_difficulty: difficulty, p_seq: seq })
      .maybeSingle();

    if (error) {
      console.error(`[practice-puzzle] get_practice_puzzle(${difficulty}) failed:`, error);
    } else if (!data) {
      // Pool not populated yet (seed script runs later) — no row is expected.
      console.error(
        `[practice-puzzle] empty practice pool for difficulty=${difficulty} — pool not seeded yet`,
      );
    } else {
      const parsed = parseGridSpec(data.grid_spec);
      if (!parsed) {
        console.error(`[practice-puzzle] malformed grid_spec for puzzle ${data.id}`);
      } else {
        spec = parsed;
        resolvedDifficulty = data.difficulty as Difficulty;
      }
    }
  } catch (err) {
    console.error(`[practice-puzzle] DB unavailable for difficulty=${difficulty}:`, err);
  }

  if (!spec) return <PracticeUnavailable difficulty={difficulty} />;

  // NOTE: intentionally no `puzzleId` for practice. Recording a solve requires a
  // puzzleId, and record_solve rejects dateless (practice) puzzles; even if it
  // didn't, a practice solve would write a `solves` row whose local_date falsely
  // credits the daily streak (streaks derive from solves.local_date with no
  // practice filter). So practice does not record — matching prior behavior.
  return (
    // key by the navigation slot so "Another puzzle" (a new `r`) remounts the
    // board and resets game state — same route + new searchParams alone would
    // otherwise reuse the mounted BoardScreen (stale, already-solved) instance.
    <BoardScreen
      key={r ?? "practice"}
      puzzle={{ size: 6, ...spec, difficulty: resolvedDifficulty }}
      kind="practice"
      backHref="/practice"
    />
  );
}
