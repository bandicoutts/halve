/**
 * Streak + day-bucketing math for the daily puzzle (CQ-2).
 *
 * This is the app's core engagement metric. It was previously duplicated
 * verbatim in `app/page.tsx`'s streak band (HomeUserContent) and `stats/page.tsx`
 * with no tests; this is the single tested source of truth. All inputs are
 * YYYY-MM-DD strings in the user's LOCAL calendar day (see `solveDay` /
 * `getLocalToday` in local-date.ts), never UTC timestamps — so streaks bucket by
 * the day the user experienced, matching the served puzzle's date (EPIC-B).
 */

/** Offset a YYYY-MM-DD string by `delta` days without timezone conversion. */
export function offsetDay(date: string, delta: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toLocaleDateString("en-CA");
}

/**
 * Current consecutive-day streak ending at (or just before) `today`.
 *
 * TODAY-SAFE: a streak is not broken merely because today's puzzle isn't solved
 * yet — the user still has until their local midnight. So if `today` is absent
 * but yesterday is present, counting starts at yesterday and the streak stands.
 * It only collapses to 0 once a full day with no solve has elapsed.
 *
 * `days` is the set of distinct local days the user has solved on (order/dupes
 * don't matter); `today` is the user's local calendar day.
 */
export function computeStreak(days: string[], today: string): number {
  const set = new Set(days);
  let cur = set.has(today) ? today : offsetDay(today, -1);
  let streak = 0;
  while (set.has(cur)) {
    streak++;
    cur = offsetDay(cur, -1);
  }
  return streak;
}

/**
 * Longest run of consecutive solved days across the entire history.
 * Independent of `today` — purely a property of the solved-day set.
 */
export function computeLongestStreak(days: string[]): number {
  if (!days.length) return 0;
  const sorted = [...new Set(days)].sort();
  let longest = 1;
  let cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round(
      (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86_400_000
    );
    if (diff === 1) {
      cur++;
      if (cur > longest) longest = cur;
    } else if (diff > 1) {
      cur = 1;
    }
  }
  return longest;
}

/**
 * Boolean presence map for the last `n` days, oldest → newest, ending at
 * `today` (so the final element is today). Powers the home 7-dot row and the
 * stats 14-day grid.
 */
export function computeLastDays(days: string[], today: string, n: number): boolean[] {
  const set = new Set(days);
  return Array.from({ length: n }, (_, i) => set.has(offsetDay(today, -(n - 1 - i))));
}
