import type { ReactNode } from "react";

interface TopBarProps {
  left?: ReactNode;
  title?: ReactNode;
  right?: ReactNode;
}

export function TopBar({ left, title, right }: TopBarProps) {
  return (
    <header
      style={{
        height: 56,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 8,
      }}
    >
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>{left}</div>
      <div
        style={{
          fontSize: "var(--text-body)",
          fontWeight: 600,
          color: "var(--fg-1)",
          letterSpacing: "var(--tracking-snug)",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        {right}
      </div>
    </header>
  );
}
