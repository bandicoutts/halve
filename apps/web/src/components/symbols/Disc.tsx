interface DiscProps {
  size?: number;
  style?: React.CSSProperties;
}

/** Symbol A — the solid disc (filled amber circle). */
export function Disc({ size = 20, style }: DiscProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={style}>
      <circle cx="20" cy="20" r="15" fill="var(--symbol-a)" />
    </svg>
  );
}
