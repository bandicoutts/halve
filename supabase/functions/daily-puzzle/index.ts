import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Engine is vendored (Deno can't resolve the pnpm `workspace:*` protocol).
// Regenerate with ./scripts/sync-engine.sh after changing packages/engine.
import { generateDaily } from "../_shared/engine/index.js";

// Scheduled via Supabase cron (see migrations) — runs daily at 00:05 UTC.
Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || req.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

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

  // Derive seed + difficulty from the date via the single canonical policy
  // (shared with the CLI seeder and the /play fallback). generateDaily retries
  // on a fresh deterministic seed before giving up, so a transient generator
  // edge case doesn't leave the day without a puzzle.
  let result;
  try {
    result = generateDaily(today);
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, date: today, error: `generation failed: ${String(err)}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { puzzle, usedSeed, difficulty } = result;
  const { error } = await supabase.from("puzzles").insert({
    date: today,
    difficulty,
    grid_spec: {
      solution: puzzle.solution,
      givens: puzzle.givens,
      edges: puzzle.edges,
    },
    seed: usedSeed,
  });

  if (error) {
    return new Response(JSON.stringify({ ok: false, date: today, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, date: today, difficulty }), {
    headers: { "Content-Type": "application/json" },
  });
});
