import type { CSSProperties, ReactNode } from "react";

export function Eyebrow({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--fg-3)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
