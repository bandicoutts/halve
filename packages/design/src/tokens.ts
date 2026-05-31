/**
 * Halve design tokens — single source of truth (TS mirror of styles/tokens.css).
 * Light/dark duality is the brand device: warm "paper" light, deep "ink" dark.
 * Amber is the hero accent (symbol A); teal is the secondary symbol color (symbol B).
 */

/** Raw palette — reference values; theme via the semantic tokens, not these. */
export const palette = {
  // Warm paper neutrals (light)
  paper50: '#FBF8F1',
  paper100: '#F6F1E8', // page background
  paper200: '#EFE8DA',
  paper300: '#E4DDCD', // hairline
  paper400: '#D6CCB8',
  clay500: '#9A9080', // decorative muted (fails AA as text)
  clay550: '#746B5A', // muted fg — AA text (4.67:1 on bg)
  clay600: '#6B6253', // secondary fg
  clay700: '#463F33',
  ink900: '#211C15', // primary fg on paper

  // Warm ink neutrals (dark)
  night950: '#14110B', // page background
  night900: '#1A160F',
  night850: '#221D15', // surface
  night800: '#2A2418',
  night700: '#352E20', // hairline
  night600: '#4A4030',
  dust500: '#6E6553', // decorative muted (fails AA as text)
  dust400: '#928873', // muted fg — AA text (5.37:1 on bg)
  dust300: '#A79D89', // secondary fg
  dust100: '#EFE8D9', // primary fg on ink

  // Amber — the hero accent
  amberDisc: '#D45220', // the solid game symbol (A)
  amber: '#B03E12', // accent on paper
  amberStrong: '#943210', // pressed / strong
  amberBright: '#E86B38', // accent on ink
  amberTint: '#F8E4DC', // soft fill on paper
  amberTintDk: '#38180E', // soft fill on ink

  // Teal — the ring game symbol (B)
  teal: '#2A7A6E', // game symbol B on paper
  tealBright: '#6EC8BC', // game symbol B on ink
  tealStrong: '#1E5C52',

  // Semantic feedback (warm-leaning)
  correctL: '#4E8A66',
  correctTintL: '#E2EFE5',
  wrongL: '#C2564B',
  wrongTintL: '#F6E2DD',
  correctD: '#6FB389',
  correctTintD: '#1E2C22',
  wrongD: '#DC7A6E',
  wrongTintD: '#2E1C18',
} as const;

/** Semantic color tokens resolved per theme. */
export const colors = {
  light: {
    bg: palette.paper100,
    bgSunken: palette.paper200,
    surface: palette.paper50,
    surfaceRaised: '#FFFFFF',
    fg1: palette.ink900,
    fg2: palette.clay600,
    fg3: palette.clay550,
    hairline: palette.paper300,
    hairline2: palette.paper400,
    accent: palette.amber,
    accentStrong: palette.amberStrong,
    accentTint: palette.amberTint,
    onAccent: '#FFFFFF',
    symbolA: palette.amberDisc,
    symbolB: palette.teal,
    correct: palette.correctL,
    correctTint: palette.correctTintL,
    wrong: palette.wrongL,
    wrongTint: palette.wrongTintL,
  },
  dark: {
    bg: palette.night950,
    bgSunken: palette.night900,
    surface: palette.night850,
    surfaceRaised: palette.night800,
    fg1: palette.dust100,
    fg2: palette.dust300,
    fg3: palette.dust400,
    hairline: palette.night700,
    hairline2: palette.night600,
    accent: palette.amberBright,
    accentStrong: palette.amberDisc,
    accentTint: palette.amberTintDk,
    onAccent: '#1A160F',
    symbolA: palette.amberDisc,
    symbolB: palette.tealBright,
    correct: palette.correctD,
    correctTint: palette.correctTintD,
    wrong: palette.wrongD,
    wrongTint: palette.wrongTintD,
  },
} as const;

export const shadows = {
  light: {
    sm: '0 1px 2px rgba(33,28,21,0.06)',
    md: '0 4px 16px -6px rgba(33,28,21,0.12)',
    lg: '0 18px 48px -12px rgba(33,28,21,0.18)',
    cell: '0 1px 0 rgba(33,28,21,0.05), 0 2px 6px -3px rgba(33,28,21,0.12)',
  },
  dark: {
    sm: '0 1px 2px rgba(0,0,0,0.4)',
    md: '0 6px 20px -8px rgba(0,0,0,0.55)',
    lg: '0 22px 56px -16px rgba(0,0,0,0.65)',
    cell: '0 1px 0 rgba(0,0,0,0.4), 0 2px 8px -4px rgba(0,0,0,0.5)',
  },
} as const;

export const font = {
  sans: "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
  num: "'Space Grotesk', ui-monospace, monospace",
} as const;

/** Type scale in px. */
export const fontSize = {
  display: 56,
  h1: 36,
  h2: 26,
  h3: 20,
  body: 16,
  small: 14,
  label: 12,
  timer: 44,
} as const;

export const leading = {
  tight: 1.05,
  snug: 1.2,
  normal: 1.5,
} as const;

export const tracking = {
  tight: '-0.02em',
  snug: '-0.01em',
  label: '0.08em',
} as const;

/** 8-point spacing system, in px. */
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 40,
  8: 48,
  9: 64,
  10: 80,
  11: 96,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  cell: 12,
  lg: 16,
  xl: 22,
  full: 999,
} as const;

/**
 * Brand symbol geometry — 100×100 viewBox.
 * Symbol A is a filled circle; symbol B is an outlined ring (same outer radius).
 * The mark is a single circle split vertically: left half A, right half B.
 */
export const symbols = {
  viewBox: '0 0 100 100',
  a: {
    circle: { cx: 50, cy: 50, r: 42 },
    fill: palette.amberDisc,
  },
  b: {
    circle: { cx: 50, cy: 50, r: 36, strokeWidth: 12 },
    stroke: palette.teal,
  },
} as const;

/** The two playable symbols, encoded as the engine encodes them (0 = A, 1 = B). */
export const SYMBOL = { a: 0, b: 1 } as const;
