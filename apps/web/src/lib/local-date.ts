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
  if (tzDate && /^\d{4}-\d{2}-\d{2}$/.test(tzDate)) return tzDate;
  return new Date().toISOString().slice(0, 10);
}

/** Pick the best day string from a solve row, preferring the stored local date. */
export function solveDay(row: { local_date: string | null; solved_at: string }): string {
  return row.local_date ?? row.solved_at.slice(0, 10);
}
