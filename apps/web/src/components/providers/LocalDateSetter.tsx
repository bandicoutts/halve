"use client";
import { useEffect } from "react";

/**
 * Writes a `tz_date` cookie containing today's date in the user's local timezone
 * (YYYY-MM-DD). Server components read this via getLocalToday() so streak logic
 * uses the user's calendar day rather than UTC midnight.
 *
 * Runs on every page load — keeps the cookie fresh across midnight rollovers.
 */
export function LocalDateSetter() {
  useEffect(() => {
    const local = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local TZ
    document.cookie = `tz_date=${local}; path=/; max-age=86400; SameSite=Lax`;
  }, []);
  return null;
}
