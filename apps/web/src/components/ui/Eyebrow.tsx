import type { CSSProperties, ElementType, ReactNode } from "react";

export function Eyebrow({
  as: Tag = "div",
  children,
  style,
}: {
  as?: ElementType;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <Tag
      style={{
        fontSize: "var(--text-label)",
        fontWeight: 600,
        letterSpacing: "var(--tracking-label)",
        textTransform: "uppercase" as const,
        color: "var(--fg-3)",
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
