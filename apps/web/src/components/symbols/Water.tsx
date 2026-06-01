interface WaterProps {
  size?: number;
  fill?: string;
  style?: React.CSSProperties;
}

export function Water({ size = 32, fill = "var(--symbol-b)", style }: WaterProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden={true}
      style={style}
    >
      <circle cx="50" cy="50" r="36" fill="none" stroke={fill} strokeWidth="12" />
    </svg>
  );
}
