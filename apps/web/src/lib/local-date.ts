import { cookies } from "next/headers";

/**
 * Returns "today" as the user's local YYYY-MM-DD date.
 *
 * A client component (LocalDateSetter in layout.tsx) writes a `tz_date` cookie
 * on every page load. Server components read it here so streak/"today" logic
 * uses the user's calendar day, not UTC midnight.
 *
 * Falls back to UTC on first SSR before JS has run, or if the cookie is absent.
 */
export async function getLocalToday(): Promise<string> {
  const cookieStore = await cookies();
  const tzDate = cookieStore.get("tz_date")?.value;
  const utcToday = new Date().toISOString().slice(0, 10);
  // Accept the cookie only when it's within ±1 day of the server's UTC date.
  // No real timezone differs from UTC by more than ~14h, so a spread of one
  // calendar day covers every offset while rejecting a forged future date
  // (e.g. tz_date=2099-01-01 set via devtools) that would derail streak logic.
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

/** Pick the best day string from a solve row, preferring the stored local date. */
export function solveDay(row: { local_date: string | null; solved_at: string }): string {
  return row.local_date ?? row.solved_at.slice(0, 10);
}
