interface SymbolProps {
  size?: number;
  style?: React.CSSProperties;
}

/** Symbol A — the broad amber ring with a smaller, transparent aperture. */
export function SymbolA({ size = 20, style }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={style}>
      <circle cx="50" cy="50" r="32" fill="none" stroke="var(--symbol-a)" strokeWidth="20" />
    </svg>
  );
}
