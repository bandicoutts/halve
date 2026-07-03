/**
 * A random practice-pool slot index for the `r` navigation param. The
 * get_practice_puzzle RPC maps any integer into the pool via mod(total), so a
 * fresh slot yields a different practice puzzle each time (unlimited practice).
 *
 * Lives at module scope (not inside a component) so the impure Math.random call
 * is outside React's render-purity boundary.
 */
export function freshPracticeSlot(): number {
  return Math.floor(Math.random() * 1_000_000_000);
}
