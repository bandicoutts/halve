"use client";
import { Fire } from "@/components/symbols/Fire";
import { Water } from "@/components/symbols/Water";

interface ThemeToggleProps {
  theme: "light" | "dark";
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const dark = theme === "dark";
  return (
    <button
      onClick={onToggle}
      aria-label={dark ? "Switch to light" : "Switch to dark"}
      style={{
        width: 60,
        height: 32,
        borderRadius: 999,
        border: "none",
        padding: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: dark ? "flex-end" : "flex-start",
        background: "var(--bg-sunken)",
        cursor: "pointer",
        transition: "background 0.2s",
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "var(--surface-raised)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s",
        }}
      >
        {dark ? (
          <Water size={16} fill="var(--symbol-water)" />
        ) : (
          <Fire size={16} fill="var(--symbol-fire)" />
        )}
      </span>
    </button>
  );
}
