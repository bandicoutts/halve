"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Difficulty } from "@parity/engine";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { freshPracticeSlot } from "@/lib/practice-slot";

interface Row {
  name: string;
  difficulty: Difficulty;
  meta: string;
  desc: string;
}

const ROWS: Row[] = [
  {
    name: "Easy",
    difficulty: "easy",
    meta: "14 GIVENS · 4 LINKS",
    desc: "A generous start — most of the logic is laid out for you. Good for learning the shapes.",
  },
  {
    name: "Medium",
    difficulty: "medium",
    meta: "11 GIVENS · 5 LINKS",
    desc: "The daily's weight. Fewer footholds, steady deduction all the way down.",
  },
  {
    name: "Hard",
    difficulty: "hard",
    meta: "8 GIVENS · 7 LINKS",
    desc: "Sparse and slow-burning. Every placement has to be earned.",
  },
];

interface PracticeScreenProps {
  isAuthenticated?: boolean | undefined;
  displayName?: string | undefined;
}

export function PracticeScreen({ isAuthenticated, displayName }: PracticeScreenProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);

  // A fresh random slot each time so practice serves a different puzzle per play.
  const start = (d: Difficulty) =>
    router.push(`/practice/play?difficulty=${d}&r=${freshPracticeSlot()}`);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <SiteHeader active="practice" isAuthenticated={isAuthenticated} displayName={displayName} />

      <section
        style={{
          maxWidth: 900,
          width: "100%",
          margin: "0 auto",
          padding: "16px clamp(20px, 4vw, 40px) 96px",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(32px, 5vw, 48px)",
          animation: "fadeup 0.45s var(--ease-editorial) both",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.22em", color: "var(--fg-3)" }}>
            PRACTICE · UNLIMITED
          </div>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "clamp(40px, 6vw, 64px)",
              lineHeight: 1,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Off the record.
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 16, lineHeight: 1.55, color: "var(--fg-3)", maxWidth: "52ch" }}>
            As many puzzles as you like, at any difficulty. The streak is never at stake here — just you
            and the grid.
          </p>
        </div>

        <div style={{ borderBottom: "1px solid var(--hairline)" }}>
          {ROWS.map((row) => (
            <button
              key={row.name}
              onClick={() => start(row.difficulty)}
              onMouseEnter={() => setHovered(row.name)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "14px 28px",
                width: "100%",
                padding: "clamp(22px, 4vw, 32px) clamp(6px, 1.5vw, 14px)",
                border: "none",
                borderTop: "1px solid var(--hairline)",
                background: hovered === row.name ? "var(--hover)" : "transparent",
                cursor: "pointer",
                color: "inherit",
                textAlign: "left",
                fontFamily: "inherit",
                transition: "background 0.2s ease",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div style={{ flex: "0 1 190px", minWidth: 150, display: "flex", flexDirection: "column", gap: 8 }}>
                <span
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                    fontWeight: 500,
                    fontSize: "clamp(30px, 4.4vw, 40px)",
                    lineHeight: 1,
                  }}
                >
                  {row.name}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.16em", color: "var(--fg-3)" }}>
                  {row.meta}
                </span>
              </div>
              <p style={{ flex: "1 1 240px", margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--fg-3)", minWidth: 0 }}>
                {row.desc}
              </p>
              <span
                style={{
                  flex: "none",
                  marginLeft: "auto",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  letterSpacing: "0.16em",
                  color: "var(--accent)",
                }}
              >
                PLAY →
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
