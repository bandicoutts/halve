"use client";
import type { Difficulty } from "@parity/engine";
import { MessageScreen } from "@/components/ui/MessageScreen";

/**
 * Shown when the shared practice pool has no puzzle for the chosen difficulty
 * (e.g. the seed script hasn't run yet) or the RPC is unavailable. Practice is
 * non-essential, so we fail softly with a clear message instead of crashing.
 */
export function PracticeUnavailable({ difficulty }: { difficulty: Difficulty }) {
  return (
    <MessageScreen
      mark="outline"
      kicker="PRACTICE"
      headline="Practice is unavailable."
      body={`No ${difficulty} practice puzzles are available right now. Try again in a moment, or pick another difficulty.`}
      primary={{ label: "Back to practice", href: "/practice" }}
    />
  );
}
