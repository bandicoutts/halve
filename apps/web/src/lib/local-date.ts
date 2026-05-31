import { cookies } from "next/headers";

/**
 * Pure resolution of "today" from a candidate tz_date cookie and the server's
 * UTC date. Extracted from getLocalToday() so it can be unit-tested without the
 * Next.js cookies() runtime.
 *
 * Accepts the cookie only when it's a well-formed YYYY-MM-DD within ±1 day of
 * the server's UTC date. No real timezone differs from UTC by more than ~14h, so
 * a spread of one calendar day covers every offset while rejecting a forged
 * future date (e.g. tz_date=2099-01-01 set via devtools) that would derail
 * streak logic. Anything else falls back to the UTC date.
 */
export function resolveLocalToday(
  tzDate: string | undefined,
  utcToday: string
): string {
  if (tzDate && /^\d{4}-\d{2}-\d{2}$/.test(tzDate)) {
    const diffDays = Math.abs(
      (new Date(`${tzDate}T00:00:00Z`).getTime() -
        new Date(`${utcToday}T00:00:00Z`).getTime()) /
        86_400_000
    );
    if (diffDays <= 1) return tzDate;
  }
  return utcToday;
}

/**
 * Returns "today" as the user's local YYYY-MM-DD date.
 *
 * A client component (LocalDateSetter in layout.tsx) writes a `tz_date` cookie
 * on every page load. Server components read it here so BOTH the served daily
 * puzzle and streak/"today" logic use the user's calendar day, not UTC midnight
 * — keeping the served puzzle's date == the streak's "today" (EPIC-B).
 *
 * Falls back to UTC on first SSR before JS has run, or if the cookie is absent.
 */
export async function getLocalToday(): Promise<string> {
  const cookieStore = await cookies();
  const tzDate = cookieStore.get("tz_date")?.value;
  const utcToday = new Date().toISOString().slice(0, 10);
  return resolveLocalToday(tzDate, utcToday);
}

/**
 * Format a YYYY-MM-DD date string as a human label ("Monday, June 1").
 *
 * Parses at UTC midnight and formats in UTC so the rendered day never shifts by
 * the server's timezone. Deterministic for a given input — safe to compute on
 * the server and pass to a client component as a prop without a hydration
 * mismatch (NXT-1).
 */
export function formatDateLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Pick the best day string from a solve row, preferring the stored local date.
 *
 * BOUNDARY CAVEAT (BE-3): rows written before the `local_date` column existed
 * (or any row where it's null) fall back to the UTC date of `solved_at`. For a
 * user near the UTC day boundary this can mix UTC-bucketed legacy rows with
 * local-bucketed new rows and surface a phantom one-day streak gap. The true
 * local date of legacy rows is unrecoverable (the user's tz at solve time was
 * never stored). New rows always carry `local_date`, so the exposure shrinks to
 * zero as legacy rows age out. See migration 20260531030000_backfill_local_date.
 */
export function solveDay(row: { local_date: string | null; solved_at: string }): string {
  return row.local_date ?? row.solved_at.slice(0, 10);
}
