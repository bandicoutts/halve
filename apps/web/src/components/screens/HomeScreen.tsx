"use client";
import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";
import { TopBar } from "@/components/ui/TopBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { IconButton } from "@/components/ui/IconButton";
import { Logo } from "@/components/symbols/Logo";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

function StatsIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
    </svg>
  );
}

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

interface HomeScreenProps {
  streak?: number;
  isSignedIn?: boolean;
}

export function HomeScreen({ streak, isSignedIn }: HomeScreenProps) {
  const { theme, toggle } = useTheme();

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
      <TopBar
        left={<Logo size={20} />}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/stats">
              <IconButton label="Stats" size={40}><StatsIcon /></IconButton>
            </Link>
            <ThemeToggle theme={theme} onToggle={toggle} />
          </div>
        }
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 24px" }}>
        {/* Streak */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 6 }}>
          <FlameIcon />
          {isSignedIn ? (
            <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-1)" }}>
              {streak && streak > 0
                ? <><span className="tnum" style={{ color: "var(--accent)" }}>{streak}</span>{" day streak"}</>
                : "Start your streak today"}
            </span>
          ) : (
            <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-1)" }}>
              Sign in to track your streak
            </span>
          )}
        </div>

        {/* Title block */}
        <div style={{ marginTop: 30 }}>
          <Eyebrow>{todayLabel()}</Eyebrow>
          <h1 style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--fg-1)", marginTop: 10, lineHeight: 1.1 }}>
            {"Today's puzzle"}
          </h1>
        </div>

        {/* Hero card */}
        <div style={{ marginTop: 26, background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "var(--radius-xl)", padding: 26, boxShadow: "var(--shadow-md)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Eyebrow>Daily</Eyebrow>
            <Eyebrow>Medium</Eyebrow>
          </div>
          {/* Mini board preview — static dots */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6, margin: "22px 0 24px" }}>
            {PREVIEW_CELLS.map((sym, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: "1",
                  borderRadius: "var(--radius-cell)",
                  background: sym === "fire" ? "var(--symbol-fire)" : sym === "water" ? "var(--symbol-water)" : "var(--bg-sunken)",
                  border: sym === null ? "1.5px solid var(--hairline)" : "none",
                  opacity: sym ? 0.88 : 1,
                }}
              />
            ))}
          </div>
          <Link href="/play" style={{ textDecoration: "none" }}>
            <Button variant="primary" full>Play today</Button>
          </Link>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
          <Link href="/practice" style={{ flex: 1, textDecoration: "none" }}>
            <Button variant="secondary" full>Practice</Button>
          </Link>
          {isSignedIn ? (
            <Link href="/stats" style={{ flex: 1, textDecoration: "none" }}>
              <Button variant="secondary" full>My stats</Button>
            </Link>
          ) : (
            <Link href="/auth" style={{ flex: 1, textDecoration: "none" }}>
              <Button variant="secondary" full>Sign in</Button>
            </Link>
          )}
        </div>
        <div style={{ textAlign: "center", paddingBottom: 40, paddingTop: 16 }}>
          <Link href="/tutorial" style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-3)", textDecoration: "none" }}>
            How to play
          </Link>
        </div>
      </div>
    </div>
  );
}

/* Static preview pattern — a small representative grid */
type PreviewCell = "fire" | "water" | null;
const PREVIEW_CELLS: PreviewCell[] = [
  "fire",  "water", null,    "fire",  null,    "water",
  null,    "fire",  "water", null,    "fire",  null,
  "water", null,    "fire",  null,    "water", "fire",
  "fire",  null,    null,    "water", null,    null,
  null,    "water", "fire",  null,    null,    "fire",
  null,    null,    "water", "fire",  "water", null,
];
