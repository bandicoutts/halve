"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/providers/ThemeProvider";
import { TopBar } from "@/components/ui/TopBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { IconButton } from "@/components/ui/IconButton";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { Mark } from "@/components/symbols/Mark";
import { Monogram } from "@/components/ui/Monogram";
import Link from "next/link";
import type { UserStats } from "@/app/stats/page";

function BackIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function FlameIcon({ size = 18, color = "var(--accent)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2C12 2 7 8 7 13a5 5 0 0 0 10 0c0-5-5-11-5-11zm0 16a3 3 0 0 1-3-3c0-2.5 3-7 3-7s3 4.5 3 7a3 3 0 0 1-3 3z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const DIST_LABELS = ["<2m", "2–3", "3–4", "4–5", "5–6", "6+m"];

function fmtSecs(s: number | null): string {
  if (s == null) return "—";
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

// ─── Streak hero card ─────────────────────────────────────────────────────────

function StreakHero({ streak, longestStreak }: { streak: number; longestStreak: number }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "var(--radius-xl)", padding: "22px 22px 20px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
      <div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <FlameIcon size={18} color="var(--accent)" />
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-3)", whiteSpace: "nowrap" }}>Day streak</span>
        </div>
        <div className="tnum" style={{ fontSize: 66, fontWeight: 500, letterSpacing: "-0.03em", color: "var(--accent)", lineHeight: 0.95 }}>{streak}</div>
      </div>
      <div style={{ textAlign: "right", paddingBottom: 6 }}>
        <div className="tnum" style={{ fontSize: 24, fontWeight: 500, color: "var(--fg-2)", lineHeight: 1 }}>{longestStreak}</div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--fg-3)", marginTop: 6, whiteSpace: "nowrap" }}>Best ever</div>
      </div>
    </div>
  );
}

// ─── 14-day calendar (two rows) ──────────────────────────────────────────────

function Cal14Weeks({ days }: { days: boolean[] }) {
  const rows = [
    { label: "Last week", cells: days.slice(0, 7) },
    { label: "This week", cells: days.slice(7) },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 76, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: "var(--fg-3)", flexShrink: 0, whiteSpace: "nowrap" }}>{row.label}</span>
          <div style={{ display: "flex", gap: 6, flex: 1 }}>
            {row.cells.map((solved, i) => {
              const isToday = ri === 1 && i === row.cells.length - 1;
              return (
                <div key={i} style={{
                  flex: 1, aspectRatio: "1", borderRadius: "var(--radius-sm)",
                  background: solved ? "var(--accent)" : "var(--bg-sunken)",
                  border: isToday ? "2px solid var(--fg-1)" : solved ? "1px solid var(--accent)" : "1px solid var(--hairline)",
                }} />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SVG area curve ──────────────────────────────────────────────────────────

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function AreaSignature({ dist }: { dist: number[] }) {
  const W = 320, H = 132, padX = 14, padTop = 22, padBot = 30;
  const max = Math.max(...dist, 1);
  const peak = dist.indexOf(Math.max(...dist));
  const stepX = (W - padX * 2) / (dist.length - 1);
  const yFor = (c: number) => padTop + (1 - c / max) * (H - padTop - padBot);
  const pts = dist.map((c, i) => ({ x: padX + i * stepX, y: yFor(c) }));
  const line = smoothPath(pts);
  const area = `${line} L ${pts[pts.length - 1].x} ${H - padBot} L ${pts[0].x} ${H - padBot} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
      <line x1={padX} y1={H - padBot} x2={W - padX} y2={H - padBot} stroke="var(--hairline)" strokeWidth="1" />
      <path d={area} fill="var(--accent-tint)" />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[peak].x} cy={pts[peak].y} r="4.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H - 10} textAnchor="middle" fontSize="10.5" fontWeight={i === peak ? 700 : 500}
          fill={i === peak ? "var(--accent)" : "var(--fg-3)"} fontFamily="var(--font-sans)" style={{ letterSpacing: "0.02em" }}>
          {DIST_LABELS[i]}
        </text>
      ))}
    </svg>
  );
}

// ─── Avg / best time divided card ────────────────────────────────────────────

function StatDivided({ items }: { items: { value: string; label: string; accent?: boolean }[] }) {
  return (
    <div style={{ display: "flex", width: "100%", background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      {items.map((it, i) => (
        <div key={i} style={{ flex: 1, padding: "16px 12px", textAlign: "center", borderLeft: i ? "1px solid var(--hairline)" : "none" }}>
          <div className="tnum" style={{ fontSize: 22, fontWeight: 500, color: it.accent ? "var(--accent)" : "var(--fg-1)", lineHeight: 1 }}>{it.value}</div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--fg-3)", marginTop: 8 }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Shell ───────────────────────────────────────────────────────────────────

function StatsShell({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <TopBar
        left={<IconButton label="Back" size={44} onClick={onBack}><BackIcon /></IconButton>}
        title={<span style={{ fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>Statistics</span>}
        right={<ThemeToggle theme={theme} onToggle={toggle} />}
      />
      <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 36px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", width: "100%" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Authenticated record ────────────────────────────────────────────────────

function StatsRecord({ stats, onBack }: { stats: UserStats; onBack: () => void }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    router.push("/");
    router.refresh();
  }

  return (
    <StatsShell onBack={onBack}>
      {/* Identity row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, marginBottom: 24 }}>
        <Monogram name={stats.displayName} size={48} />
        <div>
          <div style={{ fontSize: 23, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--fg-1)", textTransform: "capitalize" }}>{stats.displayName}</div>
          <div style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 2 }}>
            <span className="tnum">{stats.totalSolved}</span> solved · since {stats.since}
          </div>
        </div>
      </div>

      {/* Streak hero */}
      <StreakHero streak={stats.streak} longestStreak={stats.longestStreak} />

      {/* Last 14 days */}
      <div style={{ marginTop: 28 }}>
        <Eyebrow style={{ marginBottom: 14 }}>Last 14 days</Eyebrow>
        <Cal14Weeks days={stats.last14Days} />
      </div>

      {/* Solve time area chart */}
      <div style={{ marginTop: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <Eyebrow>Solve time</Eyebrow>
          <span style={{ fontSize: 12, color: "var(--fg-3)" }}>avg {fmtSecs(stats.avgTimeSecs)}</span>
        </div>
        <AreaSignature dist={stats.timeDist} />
      </div>

      {/* Avg + best time */}
      <div style={{ marginTop: 24 }}>
        <StatDivided items={[
          { value: fmtSecs(stats.avgTimeSecs), label: "Average" },
          { value: fmtSecs(stats.bestTimeSecs), label: "Best time" },
        ]} />
      </div>

      {/* Sign out — bordered, unmistakable account action (this is the account page) */}
      <div style={{ paddingTop: 32, display: "flex", justifyContent: "center" }}>
        <button
          onClick={handleSignOut}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            height: 44, padding: "0 20px",
            background: "none", border: "1.5px solid var(--hairline-2)", borderRadius: 999,
            color: "var(--fg-2)", fontSize: 14, fontWeight: 500,
            cursor: "pointer", fontFamily: "var(--font-sans)", transition: "color .15s, border-color .15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fg-1)"; e.currentTarget.style.borderColor = "var(--fg-3)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-2)"; e.currentTarget.style.borderColor = "var(--hairline-2)"; }}
        >
          <SignOutIcon />
          Sign out
        </button>
      </div>
    </StatsShell>
  );
}

// ─── Guest state — blurred backdrop + invite ──────────────────────────────────

function StatsGuest({ onBack }: { onBack: () => void }) {
  const { theme, toggle } = useTheme();
  const mockDist = [12, 31, 58, 41, 22, 20];

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      <TopBar
        left={<IconButton label="Back" size={44} onClick={onBack}><BackIcon /></IconButton>}
        title={<span style={{ fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>Statistics</span>}
        right={<ThemeToggle theme={theme} onToggle={toggle} />}
      />

      {/* Blurred preview backdrop */}
      <div aria-hidden="true" style={{ position: "absolute", inset: "56px 0 0", overflow: "hidden", pointerEvents: "none", filter: "blur(4px)", opacity: 0.45, WebkitMaskImage: "linear-gradient(#000, transparent 86%)", maskImage: "linear-gradient(#000, transparent 86%)" }}>
        <div style={{ padding: "14px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <Monogram name="D" size={48} />
            <div>
              <div style={{ fontSize: 23, fontWeight: 600, color: "var(--fg-1)" }}>david</div>
              <div style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 2 }}>184 solved · since January 2026</div>
            </div>
          </div>
          <StreakHero streak={8} longestStreak={23} />
          <div style={{ marginTop: 26 }}><AreaSignature dist={mockDist} /></div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", position: "relative", zIndex: 2 }}>
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}><Mark size={40} /></div>
          <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg-1)", margin: 0, lineHeight: 1.15 }}>Start your record</h2>
          <p style={{ fontSize: 14.5, color: "var(--fg-2)", lineHeight: 1.5, margin: "10px 0 22px" }}>Sign in to keep your streak, track your solve times, and build a history of every puzzle.</p>
          <Link href="/auth" style={{ textDecoration: "none" }}>
            <Button variant="primary" full>Sign in</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Public export ───────────────────────────────────────────────────────────

interface StatsScreenProps {
  stats: UserStats | null;
}

export function StatsScreen({ stats }: StatsScreenProps) {
  const router = useRouter();
  const onBack = () => router.push("/");

  return stats
    ? <StatsRecord stats={stats} onBack={onBack} />
    : <StatsGuest onBack={onBack} />;
}
