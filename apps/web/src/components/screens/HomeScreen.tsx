"use client";
import type { ReactNode } from "react";
import { useState } from "react";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { RulesModal } from "@/components/screens/RulesModal";
import { GhostLink } from "@/components/ui/GhostLink";
import { Button } from "@/components/ui/Button";
import { formatDuration } from "@/lib/format";
import styles from "./HomeScreen.module.css";

// An illustrative board, independent of today's puzzle so it never reveals clues.
const EXAMPLE = [
  [0, 1, 1, 0, 0, 1],
  [1, null, 1, 1, null, 0],
  [null, 0, null, null, 1, null],
  [0, null, 1, null, null, 1],
  [null, 1, null, 0, null, null],
  [1, null, 0, null, 1, 0],
];

function PuzzlePreview() {
  return (
    <figure className={styles.preview}>
      <svg viewBox="0 0 360 360" role="img" aria-label="Example six by six puzzle with amber rings, teal rings and empty cells. The top row has three of each symbol." className={styles.board}>
        <path d="M0 0H360V360H0Z M60 0V360 M120 0V360 M180 0V360 M240 0V360 M300 0V360 M0 60H360 M0 120H360 M0 180H360 M0 240H360 M0 300H360" fill="none" stroke="var(--hairline)" />
        {EXAMPLE.flatMap((row, r) => row.map((value, c) => value === null ? null : (
          value === 0
            ? <circle key={`${r}-${c}`} cx={c * 60 + 30} cy={r * 60 + 30} r={10.75} fill="none" stroke="var(--symbol-a)" strokeWidth={6.7} />
            : <circle key={`${r}-${c}`} cx={c * 60 + 30} cy={r * 60 + 30} r={12} fill="none" stroke="var(--symbol-b)" strokeWidth={4.2} />
        )))}
        <g className={styles.edge}>
          <rect x={110} y={20} width={20} height={20} rx={10} />
          <text x={120} y={30}>=</text>
          <rect x={260} y={170} width={20} height={20} rx={10} />
          <text x={270} y={180}>≠</text>
        </g>
      </svg>
      <figcaption className={styles.caption}>
        <span className={styles.eyebrow}>An example board</span>
        <span>Three amber rings. Three teal rings.<br />Every row and column.</span>
      </figcaption>
    </figure>
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
  solveDurationMs,
  streakBand,
}: HomeScreenProps) {
  const [showRules, setShowRules] = useState(false);

  const kicker = [todayLabel, difficulty ?? "Medium", puzzleNumber !== undefined ? `NO. ${puzzleNumber}` : null]
    .filter(Boolean)
    .join(" · ")
    .toUpperCase();

  return (
    <div className={styles.screen}>
      <SiteHeader isAuthenticated={isAuthenticated} displayName={displayName} />
      <section className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>{kicker}</p>
          <h1 className={styles.title}>Today&rsquo;s<br />puzzle.</h1>
          {fetchError ? (
            <>
              <p className={styles.description}>Today&rsquo;s puzzle is unavailable. Try again shortly.</p>
              <div><Button onClick={() => window.location.reload()}>Try again</Button></div>
            </>
          ) : (
            <>
              <p className={styles.description}>
                {solvedToday
                  ? "You’re done for today. Come back tomorrow for a new puzzle."
                  : "A daily 6×6 puzzle. Balance amber and teal rings, follow the edge clues, and solve it by deduction."}
              </p>
              {solvedToday && (
                <p className={styles.solved}>
                  {solveDurationMs !== undefined
                    ? <>Solved today in <span className="tnum">{formatDuration(solveDurationMs)}</span>.</>
                    : "Today’s puzzle is complete."}
                </p>
              )}
              <div className={styles.actions}>
                <Button href="/play">{solvedToday ? "Review your solve" : "Play today"}</Button>
                <GhostLink onClick={() => setShowRules(true)}>HOW TO PLAY</GhostLink>
              </div>
              {streakBand}
            </>
          )}
        </div>
        <PuzzlePreview />
      </section>
      <RulesModal open={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
