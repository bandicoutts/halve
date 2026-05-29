"use client";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import { TopBar } from "@/components/ui/TopBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { IconButton } from "@/components/ui/IconButton";
import { StatTile } from "@/components/ui/StatTile";
import { Eyebrow } from "@/components/ui/Eyebrow";

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

const DIST = [
  { t: "<2", h: 18 }, { t: "2–3", h: 44 }, { t: "3–4", h: 100, peak: true },
  { t: "4–5", h: 62 }, { t: "5–6", h: 30 }, { t: "6+", h: 14 },
];

const HISTORY = [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1];

export function StatsScreen() {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
      <TopBar
        left={<IconButton label="Back" size={40} onClick={() => router.push("/")}><BackIcon /></IconButton>}
        title={<span style={{ fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>Statistics</span>}
        right={<ThemeToggle theme={theme} onToggle={toggle} />}
      />
      <div style={{ flex: 1, padding: "0 24px", overflowY: "auto" }}>
        {/* Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6, marginBottom: 26 }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: "var(--accent-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <UserIcon />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: "var(--fg-1)" }}>Guest</div>
            <div style={{ fontSize: 14, color: "var(--fg-3)", marginTop: 2 }}>
              Sign in to sync your progress
            </div>
          </div>
        </div>

        {/* Stat tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <StatTile value="—" label="Current streak" accent />
          <StatTile value="0" label="Solved" />
          <StatTile value="—" label="Average time" />
          <StatTile value="—" label="Best time" />
        </div>

        {/* Distribution */}
        <div style={{ marginTop: 30 }}>
          <Eyebrow style={{ marginBottom: 16 }}>Solve time distribution</Eyebrow>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 110 }}>
            {DIST.map((d) => (
              <div key={d.t} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ width: "100%", display: "flex", alignItems: "flex-end", height: 84 }}>
                  <div style={{ width: "100%", height: `${d.h}%`, borderRadius: "5px 5px 0 0", background: d.peak ? "var(--accent)" : "var(--accent-tint)" }} />
                </div>
                <span className="tnum" style={{ fontSize: 11, color: "var(--fg-3)" }}>{d.t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* History strip */}
        <div style={{ marginTop: 30, paddingBottom: 40 }}>
          <Eyebrow style={{ marginBottom: 14 }}>Last 14 days</Eyebrow>
          <div style={{ display: "flex", gap: 6 }}>
            {HISTORY.map((v, i) => (
              <div
                key={i}
                style={{
                  flex: 1, height: 30, borderRadius: 5,
                  background: v ? "var(--accent)" : "var(--bg-sunken)",
                  border: v ? "none" : "1px solid var(--hairline)",
                  opacity: v ? 0.92 : 1,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
