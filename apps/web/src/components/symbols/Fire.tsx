interface FireProps {
  size?: number;
  fill?: string;
  style?: React.CSSProperties;
}

export function Fire({ size = 32, fill = "var(--symbol-a)", style }: FireProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden={true}
      style={style}
    >
      <circle cx="50" cy="50" r="42" fill={fill} />
    </svg>
  );
}
