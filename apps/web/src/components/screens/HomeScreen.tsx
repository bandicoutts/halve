"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";
import { TopBar } from "@/components/ui/TopBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/symbols/Logo";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

interface HomeScreenProps {
  difficulty?: string;
  puzzleNumber?: number;
  fetchError?: boolean;
  /** Streamed server slot: renders streak badge when user data resolves */
  userContent?: ReactNode;
}

export function HomeScreen({ difficulty, puzzleNumber, fetchError, userContent }: HomeScreenProps) {
  const { theme, toggle } = useTheme();

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
      <TopBar
        left={<Logo size={20} />}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/stats"
              style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-2)", textDecoration: "none", height: 40, display: "flex", alignItems: "center", padding: "0 4px" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fg-1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-2)"; }}
            >
              Stats
            </Link>
            <ThemeToggle theme={theme} onToggle={toggle} />
          </div>
        }
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 24px 40px" }}>

        {/* Streamed user content — streak badge or null */}
        <div style={{ marginTop: 32, minHeight: 0 }}>
          {userContent}
        </div>

        <div style={{ marginTop: 8 }}>
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

        {fetchError && (
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--fg-3)", lineHeight: 1.5 }}>
            {"Today's puzzle is unavailable — try again shortly."}
          </p>
        )}

        <div style={{ marginTop: 24 }}>
          <Link href="/play" style={{ textDecoration: "none" }}>
            <Button variant="primary" full>Play today</Button>
          </Link>
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
          <span aria-hidden="true" style={{ color: "var(--hairline)", userSelect: "none" }}>·</span>
          <Link
            href="/auth"
            style={{ fontSize: 13, color: "var(--fg-3)", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fg-2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-3)"; }}
          >
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
}
