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
  solvedToday?: boolean;
  difficulty?: string;
  puzzleNumber?: number;
}

export function HomeScreen({ streak, isSignedIn, solvedToday, difficulty, puzzleNumber }: HomeScreenProps) {
  const { theme, toggle } = useTheme();
  const hasStreak = isSignedIn && streak !== undefined && streak > 0;

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

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 24px 40px" }}>

        {hasStreak && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 32 }}>
            <FlameIcon />
            <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-1)" }}>
              <span className="tnum" style={{ color: "var(--accent)" }}>{streak}</span>
              {" day streak"}
            </span>
          </div>
        )}

        <div style={{ marginTop: hasStreak ? 16 : 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Eyebrow>{todayLabel()}</Eyebrow>
            <span aria-hidden="true" style={{ color: "var(--hairline)", fontSize: 12 }}>·</span>
            <Eyebrow>{difficulty ?? "Medium"}</Eyebrow>
            {puzzleNumber !== undefined && (
              <>
                <span aria-hidden="true" style={{ color: "var(--hairline)", fontSize: 12 }}>·</span>
                <Eyebrow>#{puzzleNumber}</Eyebrow>
              </>
            )}
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--fg-1)", marginTop: 8, lineHeight: 1.1 }}>
            {"Today's puzzle"}
          </h1>
        </div>

        <div style={{ marginTop: 24 }}>
          {solvedToday ? (
            <Link href="/play" style={{ textDecoration: "none" }}>
              <Button variant="secondary" full>View today's result</Button>
            </Link>
          ) : (
            <Link href="/play" style={{ textDecoration: "none" }}>
              <Button variant="primary" full>Play today</Button>
            </Link>
          )}
        </div>

        <div style={{ marginTop: 40, borderTop: "1px solid var(--hairline)" }}>
          <Link
            href="/practice"
            style={{ display: "flex", alignItems: "center", padding: "16px 0", fontSize: 17, fontWeight: 500, color: "var(--fg-1)", textDecoration: "none", borderBottom: "1px solid var(--hairline)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-1)"; }}
          >
            Practice
          </Link>
          <Link
            href="/archive"
            style={{ display: "flex", alignItems: "center", padding: "16px 0", fontSize: 17, fontWeight: 500, color: "var(--fg-1)", textDecoration: "none" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-1)"; }}
          >
            Archive
          </Link>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20 }}>
          <Link
            href="/tutorial"
            style={{ fontSize: 13, color: "var(--fg-3)", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fg-2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-3)"; }}
          >
            How to play
          </Link>
          {!isSignedIn && (
            <>
              <span aria-hidden="true" style={{ color: "var(--hairline)", userSelect: "none" }}>·</span>
              <Link
                href="/auth"
                style={{ fontSize: 13, color: "var(--fg-3)", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fg-2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-3)"; }}
              >
                Sign in
              </Link>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
