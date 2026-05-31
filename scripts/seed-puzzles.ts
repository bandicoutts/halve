/**
 * Seed daily puzzles into the Supabase puzzles table.
 *
 * Usage:
 *   pnpm seed-puzzles <start-date> <end-date>
 *   pnpm seed-puzzles 2026-01-01 2026-12-31
 *
 * Requires env vars (reads apps/web/.env.local automatically):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Seed + difficulty for each date come from the engine's canonical `generateDaily`
 * policy (the SAME one the edge function and the /play fallback use), so every
 * producer agrees on the day's puzzle. Re-running is idempotent.
 */

import { generateDaily } from "@parity/engine";
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// ─── REST helpers (no realtime / WebSocket needed) ───────────────────────────

const REST_HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates",
};

async function upsertPuzzle(row: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/puzzles?on_conflict=date`, {
    method: "POST",
    headers: REST_HEADERS,
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function datesInRange(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = start;
  while (cur <= end) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const [startArg, endArg] = process.argv.slice(2);
  if (!startArg || !endArg) {
    console.error("Usage: pnpm seed-puzzles <start-date> <end-date>  e.g. 2026-01-01 2026-12-31");
    process.exit(1);
  }

  const dates = datesInRange(startArg, endArg);
  console.log(`Seeding ${dates.length} puzzle${dates.length !== 1 ? "s" : ""} (${startArg} → ${endArg})…\n`);

  let ok = 0, fail = 0;

  for (const date of dates) {
    const { puzzle, usedSeed, difficulty } = generateDaily(date);

    try {
      await upsertPuzzle({
        date,
        difficulty,
        grid_spec: {
          solution: puzzle.solution,
          givens: puzzle.givens,
          edges: puzzle.edges,
        },
        seed: usedSeed,
      });
      console.log(`  ✓  ${date}  ${difficulty}`);
      ok++;
    } catch (err) {
      console.error(`  ✗  ${date}  ${(err as Error).message}`);
      fail++;
    }
  }

  console.log(`\n${ok} upserted, ${fail} failed.`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
