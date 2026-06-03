/** Returns a human-readable "Xh Ym" string until the next daily puzzle (00:05 UTC). */
export function computeNextIn(): string {
  const now = new Date();
  const tomorrowUtc = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 5, 0
  ));
  const diffMs = tomorrowUtc.getTime() - now.getTime();
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
