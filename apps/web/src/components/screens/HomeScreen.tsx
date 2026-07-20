"use client";
import type { ReactNode } from "react";
import { useState } from "react";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { RulesModal } from "@/components/screens/RulesModal";
import { GhostLink } from "@/components/ui/GhostLink";
import { Button } from "@/components/ui/Button";

// ─── Hero mark — the split circle that drifts apart and back ───────────────────

function DriftMark() {
  return (
    <svg viewBox="0 0 200 200" style={{ width: "clamp(190px, 28vw, 380px)", overflow: "visible" }} aria-hidden="true">
      <g style={{ animation: "driftL 5.5s ease-in-out infinite alternate" }}>
        <path d="M96 5 A95 95 0 0 0 96 195 Z" style={{ fill: "var(--symbol-a)" }} />
      </g>
      <g style={{ animation: "driftR 5.5s ease-in-out infinite alternate" }}>
        <path d="M104 5 A95 95 0 0 1 104 195 Z" style={{ fill: "var(--symbol-b)" }} />
      </g>
    </svg>
  );
}

interface HomeScreenProps {
  difficulty?: string | undefined;
  puzzleNumber?: number | undefined;
  /** Pre-formatted "today" label, computed server-side from getLocalToday() so
   *  the client never renders `new Date()` (avoids hydration mismatch — NXT-1). */
  todayLabel?: string | undefined;
  fetchError?: boolean | undefined;
  isAuthenticated?: boolean | undefined;
  /** Display name (or email) of the signed-in user — drives the account avatar. */
  displayName?: string | undefined;
  archiveCount?: number | undefined;
  lastDifficulty?: string | undefined;
  /** True once the signed-in user has solved today's puzzle. */
  solvedToday?: boolean | undefined;
  /** Duration (ms) of today's solve, when known. */
  solveDurationMs?: number | undefined;
  /** Streamed server slot: renders StreakBand when user data resolves */
  streakBand?: ReactNode | undefined;
}

export function HomeScreen({
  difficulty,
  puzzleNumber,
  todayLabel,
  fetchError,
  isAuthenticated,
  displayName,
  solvedToday,
  streakBand,
}: HomeScreenProps) {
  const [showRules, setShowRules] = useState(false);

  const kicker = [todayLabel, difficulty ?? "Medium", puzzleNumber !== undefined ? `NO. ${puzzleNumber}` : null]
    .filter(Boolean)
    .join(" · ")
    .toUpperCase();

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <SiteHeader isAuthenticated={isAuthenticated} displayName={displayName} />

      <section
        className="hv-split"
        style={{
          flex: 1,
          justifyContent: "center",
          width: "100%",
          padding: "0 clamp(20px, 4vw, 40px) 56px",
          animation: "fadeup 0.5s var(--ease-editorial) both",
        }}
      >
        {/* Left — the hero */}
        <div
          className="hv-split-main"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 30,
            padding: "40px 0",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.22em",
              color: "var(--fg-3)",
            }}
          >
            {kicker}
          </div>

          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "var(--text-hero)",
              lineHeight: 0.92,
              margin: 0,
              letterSpacing: "-0.02em",
              textWrap: "balance",
            }}
          >
            Today&rsquo;s
            <br />
            puzzle.
          </h1>

          {fetchError ? (
            <>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "var(--fg-3)", maxWidth: "36ch" }}>
                Today&rsquo;s puzzle is unavailable. Try again shortly.
              </p>
              <div>
                <Button onClick={() => window.location.reload()}>Try again</Button>
              </div>
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "var(--fg-3)", maxWidth: "36ch" }}>
                Six by six. Every row and column, half and half. One solution, no guessing.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "12px 20px", flexWrap: "wrap" }}>
                <Button href="/play">{solvedToday ? "Review your solve" : "Play today"}</Button>
                <GhostLink onClick={() => setShowRules(true)}>HOW TO PLAY</GhostLink>
              </div>

              {/* Streak band — streamed in for authenticated users */}
              {streakBand}
            </>
          )}
        </div>

        {/* Divider — only present in the two-column layout (see .hv-split) */}
        <div className="hv-split-rule" />

        {/* Right — the drifting mark */}
        <div
          className="hv-split-aside"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(24px, 4vw, 56px)",
          }}
        >
          <DriftMark />
        </div>
      </section>

      <RulesModal open={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
