"use client";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import { TopBar } from "@/components/ui/TopBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { IconButton } from "@/components/ui/IconButton";
import { StatTile } from "@/components/ui/StatTile";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import type { UserStats } from "@/app/stats/page";

function BackIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const DIST_LABELS = ["<2m", "2–3", "3–4", "4–5", "5–6", "6+m"];

function fmtSecs(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

interface StatsScreenProps {
  stats: UserStats | null;
}

export function StatsScreen({ stats }: StatsScreenProps) {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  const maxDist = stats ? Math.max(...stats.timeDist, 1) : 1;
  const peakIdx = stats ? stats.timeDist.indexOf(Math.max(...stats.timeDist)) : -1;

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
      <TopBar
        left={<IconButton label="Back" size={40} onClick={() => router.push("/")}><BackIcon /></IconButton>}
        title={<span style={{ fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>Statistics</span>}
        right={<ThemeToggle theme={theme} onToggle={toggle} />}
      />
      <div style={{ flex: 1, padding: "0 24px", overflowY: "auto" }}>
        {/* Profile row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6, marginBottom: 26 }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: "var(--accent-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <UserIcon />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: "var(--fg-1)" }}>
              {stats ? stats.displayName : "Guest"}
            </div>
            <div style={{ fontSize: 14, color: "var(--fg-3)", marginTop: 2 }}>
              {stats ? `${stats.totalSolved} puzzle${stats.totalSolved !== 1 ? "s" : ""} solved` : "Sign in to sync your progress"}
            </div>
          </div>
        </div>

        {stats ? (
          <>
            {/* Stat tiles */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <StatTile value={String(stats.streak)} label="Current streak" accent />
              <StatTile value={String(stats.longestStreak)} label="Best streak" />
              <StatTile value={stats.avgTimeSecs !== null ? fmtSecs(stats.avgTimeSecs) : "—"} label="Average time" />
              <StatTile value={stats.bestTimeSecs !== null ? fmtSecs(stats.bestTimeSecs) : "—"} label="Best time" />
            </div>

            {/* Time distribution */}
            <div style={{ marginTop: 30 }}>
              <Eyebrow style={{ marginBottom: 16 }}>Solve time distribution</Eyebrow>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 110 }}>
                {stats.timeDist.map((count, i) => {
                  const h = Math.round((count / maxDist) * 100);
                  const isPeak = i === peakIdx && count > 0;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <div style={{ width: "100%", display: "flex", alignItems: "flex-end", height: 84 }}>
                        <div style={{ width: "100%", height: `${Math.max(h, count > 0 ? 8 : 0)}%`, borderRadius: "5px 5px 0 0", background: isPeak ? "var(--accent)" : "var(--accent-tint)", transition: "height 0.3s" }} />
                      </div>
                      <span className="tnum" style={{ fontSize: 11, color: "var(--fg-3)" }}>{DIST_LABELS[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Last 14 days */}
            <div style={{ marginTop: 30, paddingBottom: 40 }}>
              <Eyebrow style={{ marginBottom: 14 }}>Last 14 days</Eyebrow>
              <div style={{ display: "flex", gap: 6 }}>
                {stats.last14Days.map((solved, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1, height: 30, borderRadius: 5,
                      background: solved ? "var(--accent)" : "var(--bg-sunken)",
                      border: solved ? "none" : "1px solid var(--hairline)",
                      opacity: solved ? 0.92 : 1,
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12, paddingBottom: 40 }}>
            <p style={{ fontSize: 15, color: "var(--fg-2)", margin: 0, lineHeight: 1.5 }}>
              Create an account to track your streak, see your solve times, and keep your progress across devices.
            </p>
            <Link href="/auth" style={{ textDecoration: "none" }}>
              <Button variant="primary" full>Sign in or create account</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
