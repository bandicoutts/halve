/**
 * Seed the PRACTICE puzzle pool into the Supabase `puzzles` table.
 *
 * The practice pool is every row WHERE `date IS NULL` (the `date` column is set
 * only for daily puzzles). Both the web app and the future Flutter mobile app
 * read from this same shared pool via the `get_practice_puzzle(p_difficulty,
 * p_seq)` RPC — given a stable (difficulty, seq) slot, both platforms receive the
 * SAME puzzle, which is what enables future cross-platform head-to-head play. The
 * RPC orders the pool by (created_at, id) and is append-only, so this seeder only
 * ever ADDS rows; it never rewrites existing slots (unless you pass --reset).
 *
 * Usage:
 *   pnpm seed-practice-pool                 # 50 per difficulty (default)
 *   pnpm seed-practice-pool 20              # 20 per difficulty
 *   PRACTICE_POOL_N=100 pnpm seed-practice-pool
 *   pnpm seed-practice-pool --reset         # delete the whole practice pool first, then seed
 *   pnpm seed-practice-pool 30 --reset
 *
 * Idempotent-ish (default, no --reset):
 *   For each difficulty we count the existing practice rows of that band and only
 *   generate enough NEW puzzles to top the pool up to N. If a band already has >= N
 *   it is skipped. Re-running with the same N is therefore a no-op. Because slots
 *   are derived from (created_at, id) and we only append, existing slot mappings
 *   stay stable across runs. NOTE: there is no DB-level uniqueness on practice rows,
 *   so two top-ups racing concurrently could overshoot N — run this serially.
 *
 * --reset:
 *   Deletes ALL practice rows (date IS NULL) and reseeds exactly N per difficulty.
 *   This RESHUFFLES every practice slot (new created_at/id), so any client that has
 *   cached a (difficulty, seq) -> puzzle mapping will see different puzzles. Use only
 *   when you intend to rebuild the pool from scratch.
 *
 * Requires env vars (reads apps/web/.env.local automatically, same as seed-puzzles):
 *   NEXT_PUBLIC_SUPABASE_URL   (a.k.a. SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Difficulty is stored from the engine's *classified* result (`puzzle.difficulty`),
 * which is authoritative — `generatePuzzle` does not guarantee the produced band
 * equals the requested target. We retry on mismatch with a fresh seed so each band
 * ends up with N puzzles that actually classify into that band; the stored `seed`
 * is the integer that reproduces the puzzle exactly.
 */

import { generatePuzzle, type Difficulty } from "@parity/engine";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ─── Load .env.local ──────────────────────────────────────────────────────────

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../apps/web/.env.local");
try {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (m) process.env[m[1]!.trim()] ??= m[2]!.trim();
  }
} catch {
  // rely on actual env vars if .env.local not present
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// ─── Config ──────────────────────────────────────────────────────────────────

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const SIZE = 6;

// Bound the per-band retry budget so a stubborn target can't loop forever.
const MAX_ATTEMPTS_PER_PUZZLE = 200;

function parseN(): number {
  const positional = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const raw = positional ?? process.env.PRACTICE_POOL_N;
  const n = raw ? Number(raw) : 50;
  if (!Number.isInteger(n) || n <= 0) {
    console.error(`Invalid N: ${raw}. Pass a positive integer (default 50).`);
    process.exit(1);
  }
  return n;
}

const N = parseN();
const RESET = process.argv.slice(2).includes("--reset");

// ─── REST helpers (no realtime / WebSocket needed; mirrors seed-puzzles.ts) ───

const REST_HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

interface PuzzleRow {
  date: null;
  difficulty: Difficulty;
  grid_spec: { solution: number[][]; givens: (number | null)[][]; edges: unknown[] };
  seed: number;
}

/** Count existing practice-pool rows for a difficulty (date IS NULL). */
async function countPractice(difficulty: Difficulty): Promise<number> {
  const url =
    `${SUPABASE_URL}/rest/v1/puzzles` +
    `?select=id&date=is.null&difficulty=eq.${difficulty}`;
  const res = await fetch(url, {
    method: "HEAD",
    headers: { ...REST_HEADERS, Prefer: "count=exact" },
  });
  if (!res.ok) {
    throw new Error(`count HTTP ${res.status}: ${await res.text()}`);
  }
  // PostgREST returns the exact count in Content-Range as e.g. "*/123".
  const range = res.headers.get("content-range");
  const total = range ? Number(range.split("/")[1]) : NaN;
  if (!Number.isFinite(total)) {
    throw new Error(`could not parse count from Content-Range: ${range}`);
  }
  return total;
}

/** Delete the entire practice pool (date IS NULL). Used by --reset. */
async function deletePracticePool(): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/puzzles?date=is.null`, {
    method: "DELETE",
    headers: { ...REST_HEADERS, Prefer: "return=minimal" },
  });
  if (!res.ok) {
    throw new Error(`delete HTTP ${res.status}: ${await res.text()}`);
  }
}

/** Insert a batch of practice rows. Plain INSERT — no conflict target (date is null). */
async function insertPuzzles(rows: PuzzleRow[]): Promise<void> {
  if (rows.length === 0) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/puzzles`, {
    method: "POST",
    headers: { ...REST_HEADERS, Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`insert HTTP ${res.status}: ${await res.text()}`);
  }
}

// ─── Generation ───────────────────────────────────────────────────────────────

/**
 * Generate `want` puzzles that actually classify as `difficulty`.
 *
 * `generatePuzzle` returns the *classified* band of what it produced, which may
 * differ from the requested target — so we assert `puzzle.difficulty === target`
 * and retry on mismatch with a fresh, distinct seed. The seed we store is the
 * exact integer passed in, so the row can be regenerated deterministically.
 *
 * `seedBase` namespaces seeds per band so easy/medium/hard never collide, and
 * `seedOffset` lets a top-up run start past the seeds a previous run already used
 * (purely cosmetic — seeds need not be globally unique, but it avoids re-testing
 * the same seeds).
 */
function generateBand(difficulty: Difficulty, want: number, seedBase: number, seedOffset: number): PuzzleRow[] {
  const rows: PuzzleRow[] = [];
  let attempt = 0;
  while (rows.length < want) {
    if (attempt >= want * MAX_ATTEMPTS_PER_PUZZLE) {
      throw new Error(
        `Gave up generating '${difficulty}': only ${rows.length}/${want} after ${attempt} attempts. ` +
          `The generator may rarely classify into this band.`
      );
    }
    const seed = seedBase + seedOffset + attempt;
    attempt++;
    const puzzle = generatePuzzle({ size: SIZE, difficulty, seed });
    if (puzzle.difficulty !== difficulty) continue; // classified into a different band; retry
    rows.push({
      date: null,
      difficulty: puzzle.difficulty, // authoritative classified band (== difficulty here)
      grid_spec: {
        solution: puzzle.solution,
        givens: puzzle.givens,
        edges: puzzle.edges,
      },
      seed, // the integer passed to generatePuzzle; reproduces this exact puzzle
    });
  }
  return rows;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(
    `Seeding practice pool: target ${N} per difficulty (${DIFFICULTIES.join(", ")})` +
      (RESET ? "  [--reset: wiping existing pool first]" : "  [top-up mode]") +
      "\n"
  );

  if (RESET) {
    console.log("Deleting all practice puzzles (date IS NULL)…");
    await deletePracticePool();
    console.log("  ✓  practice pool cleared\n");
  }

  let totalInserted = 0;

  // Per-band seed namespace so seeds never collide across difficulties.
  const seedBaseFor = (d: Difficulty) => (DIFFICULTIES.indexOf(d) + 1) * 1_000_000;

  for (const difficulty of DIFFICULTIES) {
    const existing = RESET ? 0 : await countPractice(difficulty);
    const want = Math.max(0, N - existing);

    if (want === 0) {
      console.log(`  •  ${difficulty}: already ${existing} >= ${N}, skipping`);
      continue;
    }

    console.log(`  …  ${difficulty}: have ${existing}, generating ${want} more`);
    // Offset new seeds past whatever a prior run likely consumed.
    const rows = generateBand(difficulty, want, seedBaseFor(difficulty), existing);

    await insertPuzzles(rows);
    totalInserted += rows.length;
    console.log(`  ✓  ${difficulty}: inserted ${rows.length} (pool now ${existing + rows.length})`);
  }

  console.log(`\nDone. Inserted ${totalInserted} practice puzzle${totalInserted !== 1 ? "s" : ""}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
