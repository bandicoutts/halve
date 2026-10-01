"use client";
import type { Difficulty } from "@parity/engine";
import { MessageScreen } from "@/components/ui/MessageScreen";

/**
 * Shown when the shared practice pool has no puzzle for the chosen difficulty
 * (e.g. the seed script hasn't run yet) or the RPC is unavailable. Practice is
 * non-essential, so we fail softly with a clear message instead of crashing.
 */
export function PracticeUnavailable({ difficulty }: { difficulty: Difficulty }) {
  const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  return (
    <MessageScreen
      mark="quiet"
      kicker="PRACTICE"
      headline="Practice is unavailable."
      body={`There are no ${difficultyLabel} puzzles available right now. Try again in a moment, or choose another difficulty.`}
      primary={{ label: "Back to practice", href: "/practice" }}
    />
  );
}
