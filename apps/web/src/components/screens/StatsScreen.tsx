"use client";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { Button } from "@/components/ui/Button";
import type { UserStats } from "@/app/stats/page";

const DIST_LABELS = ["<2m", "2–3", "3–4", "4–5", "5–6", "6m+"];

function fmtSecs(s: number | null): string {
  if (s == null) return "-";
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

const KICKER: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  letterSpacing: "0.22em",
  color: "var(--fg-3)",
};

// ─── Week dots (last 7 days) ──────────────────────────────────────────────────

function WeekDots({ days }: { days: boolean[] }) {
  const last7 = days.slice(-7);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {last7.map((solved, i) => {
        const isToday = i === last7.length - 1;
        const style: React.CSSProperties = solved
          ? { fill: "var(--accent)" }
          : isToday
          ? { fill: "none", stroke: "var(--symbol-b)", strokeWidth: "3px" }
          : { fill: "none", stroke: "var(--hairline-2)", strokeWidth: "2.5px" };
        return (
          <svg key={i} viewBox="0 0 20 20" style={{ width: 10, height: 10 }} aria-hidden="true">
            <circle cx="10" cy="10" r="7.5" style={style} />
          </svg>
        );
      })}
    </div>
  );
}

// ─── Authenticated record ────────────────────────────────────────────────────

function StatsRecord({ stats }: { stats: UserStats }) {
  const statCards = [
    { label: "BEST STREAK", value: String(stats.longestStreak) },
    { label: "SOLVED", value: String(stats.totalSolved) },
    { label: "BEST TIME", value: fmtSecs(stats.bestTimeSecs) },
    { label: "AVG TIME", value: fmtSecs(stats.avgTimeSecs) },
  ];

  const maxCount = Math.max(...stats.timeDist, 1);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <SiteHeader active="stats" isAuthenticated displayName={stats.displayName} />
      <h1 className="sr-only">Statistics</h1>

      <section
        style={{
          maxWidth: 900,
          width: "100%",
          margin: "0 auto",
          padding: "16px clamp(20px, 4vw, 40px) 96px",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(40px, 6vw, 60px)",
          animation: "fadeup 0.45s var(--ease-editorial) both",
        }}
      >
        {/* Identity */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={KICKER}>PLAYING SINCE {stats.since.toUpperCase()}</div>
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: "clamp(40px, 6vw, 56px)",
                lineHeight: 1,
                letterSpacing: "-0.01em",
                textTransform: "capitalize",
              }}
            >
              {stats.displayName}
            </div>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--fg-3)", paddingBottom: 6 }}>
            {stats.totalSolved} PUZZLES SOLVED
          </div>
        </div>

        {/* Streak band + stat cards */}
        <div
          className="hv-band"
          style={{
            borderTop: "1px solid var(--hairline)",
            borderBottom: "1px solid var(--hairline)",
          }}
        >
          <div className="hv-band-main" style={{ padding: "clamp(26px, 4vw, 40px) 32px clamp(26px, 4vw, 40px) 0", display: "flex", alignItems: "center", gap: "clamp(18px, 3vw, 28px)", minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: "clamp(96px, 13vw, 150px)",
                lineHeight: 0.85,
                color: "var(--accent-text)",
                letterSpacing: "-0.03em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {stats.streak}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.2em", color: "var(--fg-3)" }}>
                DAY
                <br />
                STREAK
              </div>
              <WeekDots days={stats.last14Days} />
            </div>
          </div>
          <div className="hv-band-rule" />
          <div
            className="hv-band-aside"
            style={{
              padding: "clamp(26px, 4vw, 40px) 0 clamp(26px, 4vw, 40px) clamp(24px, 4vw, 40px)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "clamp(24px, 4vw, 36px) 24px",
              alignContent: "center",
              minWidth: 0,
            }}
          >
            {statCards.map((c) => (
              <div key={c.label} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <div className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(26px, 3.4vw, 32px)", lineHeight: 1 }}>
                  {c.value}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.2em", color: "var(--fg-3)" }}>
            {c.label === "BEST TIME" ? "BEST · NO HINTS" : c.label === "AVG TIME" ? "AVG · NO HINTS" : c.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity + solve-time distribution */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(36px, 6vw, 72px)" }}>
          <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.2em", color: "var(--fg-3)" }}>LAST TWO WEEKS</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--fg-3)" }}>
                {stats.last14Days.filter(Boolean).length} OF 14 SOLVED
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "clamp(6px, 1.4vw, 12px)", maxWidth: 380 }}>
              {stats.last14Days.map((solved, i) => {
                const isToday = i === stats.last14Days.length - 1;
                const style: React.CSSProperties = solved
                  ? { fill: "var(--accent)" }
                  : isToday
                  ? { fill: "none", stroke: "var(--symbol-b)", strokeWidth: "3.5px" }
                  : { fill: "none", stroke: "var(--hairline-2)", strokeWidth: "2px" };
                return (
                  <div key={i} style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 40 40" style={{ width: "min(80%, 26px)", height: "min(80%, 26px)" }} aria-hidden="true">
                      <circle cx="20" cy="20" r="14" style={style} />
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.2em", color: "var(--fg-3)" }}>SOLVE TIMES · WITHOUT HINTS</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--fg-3)" }}>AVG {fmtSecs(stats.avgTimeSecs)}</span>
              </div>
              <span style={{ fontSize: 13, color: "var(--fg-3)" }}>
                {stats.timedSolves} timed {stats.timedSolves === 1 ? "solve" : "solves"}{stats.hintedSolves > 0 ? ` · ${stats.hintedSolves} with hints excluded` : ""}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {stats.timeDist.map((count, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)", width: 44, flex: "none", letterSpacing: "0.06em" }}>
                    {DIST_LABELS[i]}
                  </span>
                  <div style={{ flex: 1, height: 12, display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        height: 12,
                        borderRadius: 999,
                        background: count ? "var(--accent)" : "var(--hairline)",
                        width: count ? `${Math.max(4, (count / maxCount) * 100)}%` : 4,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                  <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 12, width: 24, textAlign: "right", flex: "none" }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
            {stats.bestTimeSecs !== null && (
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: 16,
                  color: "var(--fg-3)",
                  borderTop: "1px solid var(--hairline)",
                  paddingTop: 16,
                }}
              >
                Your fastest solve without hints: {fmtSecs(stats.bestTimeSecs)}.
              </div>
            )}
          </div>
        </div>

      </section>
    </div>
  );
}

// ─── Guest state ──────────────────────────────────────────────────────────────

function StatsGuest() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <SiteHeader active="stats" />
      <h1 className="sr-only">Statistics</h1>
      <section
        style={{
          flex: 1,
          display: "flex",
          flexWrap: "wrap-reverse",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(36px, 6vw, 88px)",
          maxWidth: 1140,
          width: "100%",
          margin: "0 auto",
          padding: "8px clamp(20px, 4vw, 40px) 64px",
          animation: "fadeup 0.5s var(--ease-editorial) both",
        }}
      >
        <div style={{ flex: "1 1 400px", display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          <div style={KICKER}>YOUR RECORD</div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "clamp(48px, 7vw, 84px)",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}
          >
            Save your
            <br />
            progress.
          </div>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "var(--fg-3)", maxWidth: "40ch" }}>
            Sign in to save your streak, solve times and puzzle history.
          </p>
          <div>
            <Button href="/auth">Sign in</Button>
          </div>
        </div>

        {/* Faded preview of the big streak number */}
        <div
          aria-hidden="true"
          style={{ flex: "1 1 340px", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0, opacity: 0.5 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: "clamp(120px, 18vw, 200px)",
                lineHeight: 0.85,
                color: "var(--accent-text)",
                letterSpacing: "-0.03em",
              }}
            >
              12
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.2em", color: "var(--fg-3)" }}>
              DAY
              <br />
              STREAK
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Public export ───────────────────────────────────────────────────────────

interface StatsScreenProps {
  stats: UserStats | null;
}

export function StatsScreen({ stats }: StatsScreenProps) {
  return stats ? <StatsRecord stats={stats} /> : <StatsGuest />;
}
