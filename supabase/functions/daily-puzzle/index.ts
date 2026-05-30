import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Engine is vendored (Deno can't resolve the pnpm `workspace:*` protocol).
// Regenerate with ./scripts/sync-engine.sh after changing packages/engine.
import { generatePuzzle } from "../_shared/engine/index.js";

// Scheduled via Supabase cron (see migrations) — runs daily at 00:05 UTC.
Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Idempotent — skip if today's puzzle already exists
  const { data: existing } = await supabase
    .from("puzzles")
    .select("id")
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ ok: true, skipped: true, date: today }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Generate from an explicit seed so the stored `seed` reproduces the puzzle.
  const seed = (Math.random() * 2 ** 32) >>> 0;
  let puzzle;
  try {
    puzzle = generatePuzzle({ size: 6, difficulty: "medium", seed });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: `generation failed: ${String(err)}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { error } = await supabase.from("puzzles").insert({
    date: today,
    difficulty: puzzle.difficulty,
    grid_spec: {
      solution: puzzle.solution,
      givens: puzzle.givens,
      edges: puzzle.edges,
    },
    seed,
  });

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, date: today, difficulty: puzzle.difficulty }), {
    headers: { "Content-Type": "application/json" },
  });
});
