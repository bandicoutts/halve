"use client";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import { TopBar } from "@/components/ui/TopBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import type { Difficulty } from "@parity/engine";

function BackIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

/**
 * Shown when the shared practice pool has no puzzle for the chosen difficulty
 * (e.g. the seed script hasn't run yet) or the RPC is unavailable. Practice is
 * non-essential, so we fail softly with a clear message instead of crashing.
 */
export function PracticeUnavailable({ difficulty }: { difficulty: Difficulty }) {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
      <TopBar
        left={<IconButton label="Back" size={40} onClick={() => router.push("/practice")}><BackIcon /></IconButton>}
        title={<span style={{ fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>Practice</span>}
        right={<ThemeToggle theme={theme} onToggle={toggle} />}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--fg-1)", lineHeight: 1.2 }}>
          No {difficulty} puzzle yet
        </h1>
        <p style={{ marginTop: 12, fontSize: 16, color: "var(--fg-2)", maxWidth: 320, marginInline: "auto", lineHeight: 1.5 }}>
          The practice pool isn&apos;t ready for this difficulty right now. Please try another difficulty or check back shortly.
        </p>
        <div style={{ marginTop: 28, maxWidth: 320, marginInline: "auto", width: "100%" }}>
          <Button variant="primary" full onClick={() => router.push("/practice")}>
            Back to practice
          </Button>
        </div>
      </div>
    </div>
  );
}
