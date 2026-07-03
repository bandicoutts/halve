interface RingProps {
  size?: number;
  /** Stroke width in the 40×40 viewBox units. */
  strokeWidth?: number;
  style?: React.CSSProperties;
}

/** Symbol B — the ring (outlined teal circle). */
export function Ring({ size = 20, strokeWidth = 5, style }: RingProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={style}>
      <circle cx="20" cy="20" r="13" fill="none" stroke="var(--symbol-b)" strokeWidth={strokeWidth} />
    </svg>
  );
}
