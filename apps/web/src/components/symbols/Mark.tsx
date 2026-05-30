"use client";

interface MarkProps {
  size?: number;
  style?: React.CSSProperties;
}

export function Mark({ size = 36, style }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-label="Halve"
      role="img"
      style={style}
    >
      {/* Left half — solid, symbol A */}
      <path d="M 50 8 A 42 42 0 0 0 50 92 Z" fill="var(--symbol-a)" />
      {/* Right half — solid, symbol B */}
      <path d="M 50 8 A 42 42 0 0 1 50 92 Z" fill="var(--symbol-b)" />
      {/* Dividing line — crisp split */}
      <line x1="50" y1="8" x2="50" y2="92" stroke="var(--bg)" strokeWidth="1.5" />
    </svg>
  );
}
