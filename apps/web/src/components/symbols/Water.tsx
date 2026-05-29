interface WaterProps {
  size?: number;
  fill?: string;
  style?: React.CSSProperties;
}

export function Water({ size = 32, fill = "var(--symbol-water)", style }: WaterProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-label="Water"
      role="img"
      style={style}
    >
      <path
        d="M50 92 C43 82 26 66 26 46 C26 30 37 16 50 16 C63 16 74 30 74 46 C74 66 57 82 50 92 Z"
        fill={fill}
      />
    </svg>
  );
}
