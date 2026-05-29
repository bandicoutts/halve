"use client";
import { useId } from "react";

interface MarkProps {
  size?: number;
  style?: React.CSSProperties;
}

export function Mark({ size = 36, style }: MarkProps) {
  const bridgeId = useId();
  const h = size * (100 / 140);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 140 100"
      aria-label="Parity"
      role="img"
      style={style}
    >
      <defs>
        <linearGradient id={bridgeId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--symbol-fire)" />
          <stop offset="1" stopColor="var(--symbol-water)" />
        </linearGradient>
      </defs>
      {/* fire — teardrop pointing up */}
      <path
        d="M40 8 C47 18 64 34 64 54 C64 70 53 84 40 84 C27 84 16 70 16 54 C16 34 33 18 40 8 Z"
        fill="var(--symbol-fire)"
      />
      {/* bridge — warm→cool gradient */}
      <rect x="62" y="47" width="16" height="6" rx="3" fill={`url(#${bridgeId})`} />
      {/* water — teardrop pointing down */}
      <path
        d="M100 92 C93 82 76 66 76 46 C76 30 87 16 100 16 C113 16 124 30 124 46 C124 66 107 82 100 92 Z"
        fill="var(--symbol-water)"
      />
    </svg>
  );
}
