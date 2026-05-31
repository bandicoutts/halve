"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { TopBar } from "@/components/ui/TopBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/symbols/Logo";
import { Mark } from "@/components/symbols/Mark";
import { Fire } from "@/components/symbols/Fire";
import { Water } from "@/components/symbols/Water";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { AccountMenu } from "@/components/ui/AccountMenu";
import { formatDuration } from "@/lib/format";

// ─── Icons ───────────────────────────────────────────────────────────────────

function ChevronRight({ shifted }: { shifted: boolean }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--fg-3)"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        flexShrink: 0,
        transform: shifted ? "translateX(2px)" : "none",
        transition: "transform .15s",
      }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ─── Destination card ─────────────────────────────────────────────────────────

function DestCard({
  motif,
  title,
  sub,
  href,
}: {
  motif: ReactNode;
  title: string;
  sub: string;
  href: string;
}) {
  const [h, setH] = useState(false);
  return (
    <Link href={href} style={{ flex: 1, textDecoration: "none" }}>
      <div
        onMouseEnter={() => setH(true)}
        onMouseLeave={() => setH(false)}
        onTouchStart={(e) => {
          e.currentTarget.style.opacity = "0.7";
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        onTouchCancel={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius-xl)",
          padding: 18,
          border: `1px solid ${h ? "var(--accent)" : "var(--hairline)"}`,
          boxShadow: h ? "var(--shadow-md)" : "var(--shadow-sm)",
          cursor: "pointer",
          transition: "border-color .16s, box-shadow .16s",
          display: "flex",
          flexDirection: "column",
          minHeight: 132,
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ height: 32, display: "flex", alignItems: "center" }}>
            {motif}
          </div>
          <ChevronRight shifted={h} />
        </div>
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--fg-1)",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 3 }}>
            {sub}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--correct)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/** Completed-state hero shown once today's puzzle is solved. */
function SolvedHero({ durationMs }: { durationMs?: number }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 18px",
          background: "var(--surface)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 999,
            background: "var(--correct-tint, var(--accent-tint))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CheckIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg-1)" }}>
            {durationMs !== undefined ? (
              <>
                Solved in{" "}
                <span className="tnum" style={{ color: "var(--correct)" }}>
                  {formatDuration(durationMs)}
                </span>
              </>
            ) : (
              "Solved today"
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 1 }}>
            Next puzzle at midnight
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <Link href="/stats" style={{ textDecoration: "none" }}>
          <Button variant="secondary" full>
            See your stats
          </Button>
        </Link>
      </div>
    </div>
  );
}

/** Max content-column width — keeps the hero/CTA/cards readable on desktop,
 *  matching the constrained-column convention used across the app. */
const HOME_MAX = 480;

interface HomeScreenProps {
  difficulty?: string;
  puzzleNumber?: number;
  /** Pre-formatted "today" label, computed server-side from getLocalToday() so
   *  the client never renders `new Date()` (avoids hydration mismatch — NXT-1). */
  todayLabel?: string;
  fetchError?: boolean;
  isAuthenticated?: boolean;
  /** Display name (or email) of the signed-in user — drives the account avatar. */
  displayName?: string;
  archiveCount?: number;
  lastDifficulty?: string;
  /** True once the signed-in user has solved today's puzzle. */
  solvedToday?: boolean;
  /** Duration (ms) of today's solve, when known. */
  solveDurationMs?: number;
  /** Streamed server slot: renders StreakBand when user data resolves */
  streakBand?: ReactNode;
}

export function HomeScreen({
  difficulty,
  puzzleNumber,
  todayLabel,
  fetchError,
  isAuthenticated,
  displayName,
  archiveCount,
  lastDifficulty,
  solvedToday,
  solveDurationMs,
  streakBand,
}: HomeScreenProps) {
  const { theme, toggle } = useTheme();

  const [signInHovered, setSignInHovered] = useState(false);

  // Stack the destination cards on very narrow screens so subtitles stop
  // wrapping mid-phrase. Mirrors the matchMedia pattern used in ArchiveScreen.
  const [stack, setStack] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 380px)");
    const update = () => setStack(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <TopBar
        left={<Logo size={20} />}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isAuthenticated ? (
              <AccountMenu displayName={displayName || "?"} />
            ) : (
              <Link
                href="/auth"
                onMouseEnter={() => setSignInHovered(true)}
                onMouseLeave={() => setSignInHovered(false)}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: signInHovered ? "var(--fg-1)" : "var(--fg-2)",
                  height: 34,
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0 14px",
                  border: `1.5px solid ${signInHovered ? "var(--fg-3)" : "var(--hairline-2)"}`,
                  borderRadius: 999,
                  textDecoration: "none",
                  transition: "all .15s",
                }}
              >
                Sign in
              </Link>
            )}
            <ThemeToggle theme={theme} onToggle={toggle} />
          </div>
        }
      />

      <div
        style={{
          flex: 1,
          padding: "0 24px 28px",
        }}
      >
       <div style={{ maxWidth: HOME_MAX, margin: "0 auto", width: "100%" }}>
        {/* Hero section */}
        <div style={{ marginTop: 26 }}>
          {/* StreakBand — renders via Suspense when authenticated */}
          {streakBand && (
            <div style={{ marginBottom: 20 }}>{streakBand}</div>
          )}

          {/* Meta row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              flexWrap: "nowrap",
            }}
          >
            <Eyebrow style={{ fontSize: 12, whiteSpace: "nowrap" }}>
              {todayLabel}
            </Eyebrow>
            <span
              aria-hidden="true"
              style={{ color: "var(--hairline-2)", fontSize: 12 }}
            >
              ·
            </span>
            <Eyebrow style={{ fontSize: 12, whiteSpace: "nowrap" }}>
              {difficulty ?? "Medium"}
            </Eyebrow>
            {puzzleNumber !== undefined && (
              <>
                <span
                  aria-hidden="true"
                  style={{ color: "var(--hairline-2)", fontSize: 12 }}
                >
                  ·
                </span>
                <Eyebrow style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                  #{puzzleNumber}
                </Eyebrow>
              </>
            )}
          </div>

          <h1
            style={{
              fontSize: 44,
              fontWeight: 500,
              letterSpacing: "-0.025em",
              color: "var(--fg-1)",
              marginTop: 10,
              lineHeight: 1.05,
            }}
          >
            Today&rsquo;s puzzle
          </h1>

          {fetchError && (
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.5,
                color: "var(--fg-3)",
                margin: "12px 0 0",
              }}
            >
              Today&rsquo;s puzzle is unavailable — try again shortly.
            </p>
          )}

          {fetchError ? (
            <div style={{ marginTop: 22 }}>
              <Button
                variant="primary"
                full
                onClick={() => window.location.reload()}
              >
                Try again
              </Button>
            </div>
          ) : solvedToday ? (
            <SolvedHero durationMs={solveDurationMs} />
          ) : (
            <div style={{ marginTop: 22 }}>
              <Link href="/play" style={{ textDecoration: "none" }}>
                <Button variant="primary" full>
                  Play today
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Destination cards */}
        <div style={{ marginTop: 36 }}>
          <Eyebrow style={{ marginBottom: 12 }}>Keep playing</Eyebrow>
          <div
            style={{
              display: "flex",
              flexDirection: stack ? "column" : "row",
              gap: 12,
            }}
          >
            <DestCard
              motif={
                <span style={{ display: "flex", gap: 6 }}>
                  <Fire size={26} />
                  <Water size={26} />
                </span>
              }
              title="Practice"
              sub="Any difficulty, unlimited plays"
              href="/practice"
            />
            <DestCard
              motif={<Mark size={28} />}
              title="Archive"
              sub={
                archiveCount !== undefined && lastDifficulty
                  ? `${archiveCount} puzzles · last ${lastDifficulty.toLowerCase()}`
                  : "Every past puzzle, at your pace"
              }
              href="/archive"
            />
          </div>
        </div>

        {/* Footer — trailing element with a comfortable gap; not pinned to the
            viewport bottom, which previously left a large void on tall screens. */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 44 }}>
          <Link
            href="/tutorial"
            style={{
              fontSize: 13,
              color: "var(--fg-3)",
              textDecoration: "none",
              minHeight: 44,
              display: "inline-flex",
              alignItems: "center",
              transition: "color .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--fg-2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--fg-3)";
            }}
          >
            How to play
          </Link>
        </div>
       </div>
      </div>
    </div>
  );
}
