/**
 * Generates daily puzzles for a date range and upserts them into Supabase.
 *
 * Usage:
 *   SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> npx tsx scripts/seed-puzzles.mts [start-date] [end-date]
 *
 * start-date / end-date: YYYY-MM-DD. Defaults to today if omitted.
 */
import { createClient } from "@supabase/supabase-js";
import { generatePuzzle, hashSeed } from "@parity/engine";

// Load .env.local / .env automatically (Node 20.12+ built-in; silently skipped if absent)
for (const f of [".env.local", ".env"]) {
  try { (process as any).loadEnvFile(f); } catch {} // eslint-disable-line @typescript-eslint/no-explicit-any
}

const args = process.argv.slice(2);
const today = new Date().toISOString().slice(0, 10);
const startDate = args[0] ?? today;
const endDate = args[1] ?? startDate;

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !serviceKey) {
  console.error(
    "Error: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start + "T00:00:00Z");
  const last = new Date(end + "T00:00:00Z");
  while (current <= last) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

async function main() {
  const dates = dateRange(startDate, endDate);
  if (dates.length === 0) {
    console.error("No dates in range (is end-date before start-date?)");
    process.exit(1);
  }

  console.log(`Seeding ${dates.length} puzzle(s): ${startDate} → ${endDate}`);

  for (const date of dates) {
    const seed = hashSeed(date);
    const puzzle = generatePuzzle({ size: 6, difficulty: "medium", seed });

    const grid_spec = {
      solution: puzzle.solution,
      givens: puzzle.givens,
      edges: puzzle.edges,
    };

    const { error } = await supabase
      .from("puzzles")
      .upsert({ date, difficulty: puzzle.difficulty, grid_spec, seed }, { onConflict: "date" });

    if (error) {
      console.error(`  ✗ ${date}  ${error.message}`);
    } else {
      console.log(`  ✓ ${date}  (difficulty: ${puzzle.difficulty})`);
    }
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
