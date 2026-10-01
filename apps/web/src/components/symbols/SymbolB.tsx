interface SymbolProps {
  size?: number;
  style?: React.CSSProperties;
}

/** Symbol B — the finer teal ring with a larger, transparent aperture. */
export function SymbolB({ size = 20, style }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={style}>
      <circle cx="50" cy="50" r="35.75" fill="none" stroke="var(--symbol-b)" strokeWidth="12.5" />
    </svg>
  );
}
