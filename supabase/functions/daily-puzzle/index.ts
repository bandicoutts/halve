import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generatePuzzle } from "https://esm.sh/@parity/engine@workspace:*";

// Scheduled via Supabase cron: "0 0 * * *" (midnight UTC every day)
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

  const puzzle = generatePuzzle({ size: 6, difficulty: "medium" });
  const seed = Date.now();

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
