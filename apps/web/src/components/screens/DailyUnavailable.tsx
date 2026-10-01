"use client";
import { MessageScreen } from "@/components/ui/MessageScreen";

/** Shown when the daily puzzle's offline generator throws unexpectedly. */
export function DailyUnavailable() {
  return (
    <MessageScreen
      mark="faint"
      kicker="TODAY’S PUZZLE"
      headline="Today’s puzzle isn’t ready."
      body="Try again in a moment."
      primary={{ label: "Retry", onClick: () => window.location.reload() }}
      secondary={{ label: "HOME", href: "/" }}
    />
  );
}
