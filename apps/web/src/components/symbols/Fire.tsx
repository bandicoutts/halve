interface FireProps {
  size?: number;
  fill?: string;
  style?: React.CSSProperties;
}

export function Fire({ size = 32, fill = "var(--symbol-fire)", style }: FireProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-label="Fire"
      role="img"
      style={style}
    >
      <path
        d="M50 8 C57 18 74 34 74 54 C74 70 63 84 50 84 C37 84 26 70 26 54 C26 34 43 18 50 8 Z"
        fill={fill}
      />
    </svg>
  );
}
