// Parity brand symbols as theme-aware React components.
let _markSeq = 0;

// Fire — teardrop pointing UP, amber-red flame
function Fire({ size = 32, style, fill = 'var(--symbol-fire)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style} aria-label="Fire" role="img">
      <path d="M50 8 C57 18 74 34 74 54 C74 70 63 84 50 84 C37 84 26 70 26 54 C26 34 43 18 50 8 Z" fill={fill} />
    </svg>
  );
}

// Water — teardrop pointing DOWN, cool teal droplet
function Water({ size = 32, style, fill = 'var(--symbol-water)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style} aria-label="Water" role="img">
      <path d="M50 92 C43 82 26 66 26 46 C26 30 37 16 50 16 C63 16 74 30 74 46 C74 66 57 82 50 92 Z" fill={fill} />
    </svg>
  );
}

// The Parity equilibrium mark — flame (up, fire) + bridge + drop (down, water)
function Mark({ size = 36, style }) {
  const bridgeId = React.useMemo(() => `mark-bridge-${_markSeq++}`, []);
  const h = size * (100 / 140);
  return (
    <svg width={size} height={h} viewBox="0 0 140 100" style={style} aria-label="Parity" role="img">
      <defs>
        <linearGradient id={bridgeId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--symbol-fire)" />
          <stop offset="1" stopColor="var(--symbol-water)" />
        </linearGradient>
      </defs>
      <path d="M40 8 C47 18 64 34 64 54 C64 70 53 84 40 84 C27 84 16 70 16 54 C16 34 33 18 40 8 Z" fill="var(--symbol-fire)" />
      <rect x="62" y="47" width="16" height="6" rx="3" fill={`url(#${bridgeId})`} />
      <path d="M100 92 C93 82 76 66 76 46 C76 30 87 16 100 16 C113 16 124 30 124 46 C124 66 107 82 100 92 Z" fill="var(--symbol-water)" />
    </svg>
  );
}

// Horizontal wordmark lockup
function Logo({ size = 26, style }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.32, ...style }}>
      <Mark size={size * 1.8} />
      <span style={{
        fontFamily: 'var(--font-sans)', fontWeight: 600,
        fontSize: size, letterSpacing: '-0.025em', color: 'var(--fg-1)',
      }}>Parity</span>
    </span>
  );
}

// The = / ≠ edge sign capsule
function EdgeSign({ sign, size = 22 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: '999px',
      background: 'var(--bg)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)', fontWeight: 600,
      fontSize: size * 0.68, color: 'var(--fg-1)', lineHeight: 1,
    }}>{sign === 'eq' ? '=' : '\u2260'}</span>
  );
}

Object.assign(window, { Fire, Water, Mark, Logo, EdgeSign });
