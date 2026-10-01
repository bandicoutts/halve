"use client";

interface MarkProps {
  size?: number;
  style?: React.CSSProperties;
  decorative?: boolean;
}

export function Mark({ size = 36, style, decorative = false }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-label={decorative ? undefined : "Halve"}
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : "img"}
      style={style}
    >
      {/* Complementary hollow halves form one ring while preserving its open centre. */}
      <path d="M 50 8 A 42 42 0 0 0 50 92 L 50 72 A 22 22 0 0 1 50 28 Z" fill="var(--symbol-a)" />
      <path d="M 50 8 A 42 42 0 0 1 50 92 L 50 72 A 22 22 0 0 0 50 28 Z" fill="var(--symbol-b)" />
      {/* Keep the two halves distinct only where the ring material meets. */}
      <path d="M50 8V28 M50 72V92" stroke="var(--bg)" strokeWidth="1.5" />
    </svg>
  );
}
