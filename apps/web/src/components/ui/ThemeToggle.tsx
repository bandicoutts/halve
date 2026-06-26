"use client";
import { Fire } from "@/components/symbols/Fire";
import { Water } from "@/components/symbols/Water";

interface ThemeToggleProps {
  theme: "light" | "dark";
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  // The thumb position and which icon shows are driven by the `.dark` class via
  // CSS (see globals.css `.theme-toggle`), NOT by `theme`. The inline script in
  // layout.tsx sets `.dark` before hydration, so the control is correct from the
  // first paint and can never desync from a hydration mismatch. The markup is
  // identical on server and client; only `aria-checked` derives from `theme`,
  // which ThemeProvider mount-corrects (suppressHydrationWarning covers the
  // one-frame gap for assistive tech).
  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === "dark"}
      aria-label="Dark mode"
      onClick={onToggle}
      className="theme-toggle"
      suppressHydrationWarning
      style={{
        width: 60,
        height: 32,
        borderRadius: "var(--radius-full)",
        border: "none",
        padding: 3,
        display: "flex",
        alignItems: "center",
        background: "var(--bg-sunken)",
        cursor: "pointer",
        transition: "background 0.2s",
      }}
    >
      <span
        className="tt-thumb"
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "var(--surface-raised)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span className="tt-icon tt-icon--light">
          <Fire size={16} fill="var(--symbol-a)" />
        </span>
        <span className="tt-icon tt-icon--dark">
          <Water size={16} fill="var(--symbol-b)" />
        </span>
      </span>
    </button>
  );
}
