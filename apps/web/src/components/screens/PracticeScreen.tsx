"use client";
import { useRouter } from "next/navigation";
import type { Difficulty } from "@parity/engine";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { freshPracticeSlot } from "@/lib/practice-slot";
import styles from "./PracticeScreen.module.css";

interface Row {
  name: string;
  difficulty: Difficulty;
  desc: string;
}

const ROWS: Row[] = [
  {
    name: "Easy",
    difficulty: "easy",
    desc: "More starting clues. Good for learning the rules.",
  },
  {
    name: "Medium",
    difficulty: "medium",
    desc: "Fewer given cells. A steady solve.",
  },
  {
    name: "Hard",
    difficulty: "hard",
    desc: "More demanding deductions. Take your time.",
  },
];

interface PracticeScreenProps {
  isAuthenticated?: boolean | undefined;
  displayName?: string | undefined;
}

export function PracticeScreen({ isAuthenticated, displayName }: PracticeScreenProps) {
  const router = useRouter();

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
            Play any puzzle, at any difficulty. Practice games do not affect your streak.
          </p>
        </div>

        <div className={styles.choices}>
          {ROWS.map((row) => (
            <button
              key={row.name}
              type="button"
              onClick={() => start(row.difficulty)}
              className={styles.choice}
            >
              <span className={styles.name}>{row.name}</span>
              <span className={styles.description}>{row.desc}</span>
              <span className={styles.action} aria-hidden="true">PLAY <span>→</span></span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
