"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import { TopBar } from "@/components/ui/TopBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { BackIcon } from "@/components/ui/icons";
import type { Difficulty } from "@parity/engine";

const DIFFS: Record<string, { blurb: string; givens: string; time: string; difficulty: Difficulty }> = {
  Easy: { blurb: "More given cells and signs to lean on. A gentle, unhurried solve.", givens: "14+", time: "~2 min", difficulty: "easy" },
  Medium: { blurb: "A balanced board — enough to start, room to think.", givens: "11", time: "~4 min", difficulty: "medium" },
  Hard: { blurb: "Few givens. Pure deduction, no shortcuts. For the patient.", givens: "8", time: "~6 min", difficulty: "hard" },
};

export function PracticeScreen() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [diff, setDiff] = useState("Medium");
  const d = DIFFS[diff]!;

  function handleStart() {
    router.push(`/practice/play?difficulty=${d.difficulty}`);
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
      <TopBar
        left={<IconButton label="Back" size={40} onClick={() => router.push("/")}><BackIcon /></IconButton>}
        title={<span style={{ fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>Practice</span>}
        right={<ThemeToggle theme={theme} onToggle={toggle} />}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 24px" }}>
        <div style={{ marginTop: 14 }}>
          <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--fg-1)", lineHeight: 1.2 }}>
            A fresh puzzle,<br />any time.
          </h1>
          <p style={{ marginTop: 12, fontSize: 16, color: "var(--fg-2)", maxWidth: 300, lineHeight: 1.5 }}>
            No streak, no pressure. Pick a difficulty and play as many as you like.
          </p>
        </div>

        <div style={{ marginTop: 32 }}>
          <Eyebrow style={{ marginBottom: 12 }}>Difficulty</Eyebrow>
          <SegmentedControl options={["Easy", "Medium", "Hard"]} value={diff} onChange={setDiff} label="Difficulty" />
        </div>

        <div key={diff} style={{ marginTop: 22, background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "var(--radius-xl)", padding: 24, animation: "lm-fade 0.22s ease" }}>
          <div style={{ display: "flex", gap: 22 }}>
            <div>
              <div className="tnum" style={{ fontSize: 24, fontWeight: 500, color: "var(--fg-1)" }}>6×6</div>
              <Eyebrow style={{ marginTop: 6 }}>Grid</Eyebrow>
            </div>
            <div>
              <div className="tnum" style={{ fontSize: 24, fontWeight: 500, color: "var(--fg-1)" }}>{d.givens}</div>
              <Eyebrow style={{ marginTop: 6 }}>Given</Eyebrow>
            </div>
            <div>
              <div className="tnum" style={{ fontSize: 24, fontWeight: 500, color: "var(--fg-1)" }}>{d.time}</div>
              <Eyebrow style={{ marginTop: 6 }}>Typical</Eyebrow>
            </div>
          </div>
          <p style={{ marginTop: 18, fontSize: 15, color: "var(--fg-2)", lineHeight: 1.5 }}>{d.blurb}</p>
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ paddingBottom: 40 }}>
          <Button variant="primary" full onClick={handleStart}>
            Start {diff.toLowerCase()} puzzle
          </Button>
        </div>
      </div>
    </div>
  );
}
