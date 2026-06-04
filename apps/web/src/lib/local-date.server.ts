import { cookies } from "next/headers";
import { resolveLocalToday } from "./local-date";

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
