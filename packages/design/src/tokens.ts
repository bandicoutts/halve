/**
 * Halve design tokens — single source of truth (TS mirror of styles/tokens.css).
 * Light/dark duality is the brand device: warm "paper" light, deep "ink" dark.
 * Editorial voice: Newsreader (italic serif display) + Instrument Sans (body) +
 * Spline Sans Mono (labels/kickers/timer). Amber is both the hero accent and the
 * solid game symbol (A); teal is the ring game symbol (B).
 */

/** Raw palette — reference values; theme via the semantic tokens, not these. */
export const palette = {
  // Warm paper neutrals (light)
  paper100: '#F5F0E6', // page background
  paper200: '#EDE6D8', // sunken
  paperSurface: '#FDFAF3',
  clay700: '#463F33',
  clay600: '#6E6455', // secondary fg
  clay500: '#8A7F6E', // muted fg
  ink900: '#211B14', // primary fg on paper

  // Warm ink neutrals (dark)
  night950: '#161210', // page background
  night925: '#120E0C', // sunken
  night850: '#1F1A15', // surface
  night800: '#2A2418', // raised
  dust300: '#B4A990', // secondary fg on ink
  dust400: '#9A8F7E', // muted fg on ink
  dust100: '#EDE5D7', // primary fg on ink

  // Amber — the hero accent AND the solid game symbol (A). Unified.
  amberPaper: '#DE5F27', // accent + disc on paper
  amberPaperStrong: '#C24E1C',
  amberInk: '#E8703A', // accent + disc on ink
  amberInkStrong: '#F2895A',

  // Teal — the ring game symbol (B)
  tealPaper: '#1E9C8F',
  tealInk: '#45BFB2',

  // Semantic feedback (warm-leaning)
  correctL: '#4E8A66',
  correctTintL: '#E2EFE5',
  wrongL: '#C0442C',
  wrongTintL: '#F6E2DD',
  correctD: '#6FB389',
  correctTintD: '#1E2C22',
  wrongD: '#D9553B',
  wrongTintD: '#2E1C18',
} as const;

/** Semantic color tokens resolved per theme. */
export const colors = {
  light: {
    bg: palette.paper100,
    bgSunken: palette.paper200,
    surface: palette.paperSurface,
    surfaceRaised: '#FFFFFF',
    fg1: palette.ink900,
    fg2: palette.clay600,
    fg3: palette.clay500,
    hairline: 'rgba(31, 26, 20, 0.16)',
    hairline2: 'rgba(31, 26, 20, 0.28)',
    accent: palette.amberPaper,
    accentStrong: palette.amberPaperStrong,
    accentTint: 'rgba(222, 95, 39, 0.12)',
    onAccent: '#1B1410',
    symbolA: palette.amberPaper,
    symbolB: palette.tealPaper,
    plate: 'rgba(31, 26, 20, 0.055)',
    hover: 'rgba(31, 26, 20, 0.045)',
    err: '#C0442C',
    correct: palette.correctL,
    correctTint: palette.correctTintL,
    wrong: palette.wrongL,
    wrongTint: palette.wrongTintL,
  },
  dark: {
    bg: palette.night950,
    bgSunken: palette.night925,
    surface: palette.night850,
    surfaceRaised: palette.night800,
    fg1: palette.dust100,
    fg2: palette.dust300,
    fg3: palette.dust400,
    hairline: 'rgba(233, 223, 205, 0.15)',
    hairline2: 'rgba(233, 223, 205, 0.28)',
    accent: palette.amberInk,
    accentStrong: palette.amberInkStrong,
    accentTint: 'rgba(232, 112, 58, 0.16)',
    onAccent: '#1B1410',
    symbolA: palette.amberInk,
    symbolB: palette.tealInk,
    plate: 'rgba(233, 223, 205, 0.06)',
    hover: 'rgba(233, 223, 205, 0.05)',
    err: '#D9553B',
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
  serif: "'Newsreader', Georgia, 'Times New Roman', serif",
  sans: "'Instrument Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
  mono: "'Spline Sans Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  /** @deprecated use `mono` */
  num: "'Spline Sans Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

/**
 * Type scale. Editorial display sizes are fluid (CSS clamp) and expressed as
 * strings; the fixed steps stay in px for programmatic use.
 */
export const fontSize = {
  jumbo: 'clamp(5rem, 13vw, 9.375rem)',
  hero: 'clamp(3.625rem, 8.5vw, 7.25rem)',
  display: 'clamp(2.5rem, 6vw, 4rem)',
  h1: 36,
  h2: 26,
  h3: 20,
  body: 16,
  small: 14,
  label: 12,
  timer: 'clamp(3.25rem, 6vw, 4.75rem)',
} as const;

export const leading = {
  tight: 0.92,
  snug: 1.2,
  normal: 1.5,
} as const;

export const tracking = {
  tight: '-0.02em',
  snug: '-0.01em',
  label: '0.18em',
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
 * Motion — tactile and confirming. The standard curve is the brand easing;
 * the back curve is used only for symbol placement and the solve wave.
 */
export const motion = {
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    outBack: 'cubic-bezier(0.34, 1.56, 0.5, 1)',
    editorial: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
  duration: { instant: 120, fast: 160, base: 220, slow: 320 },
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
    fill: palette.amberInk,
  },
  b: {
    circle: { cx: 50, cy: 50, r: 36, strokeWidth: 12 },
    stroke: palette.tealInk,
  },
} as const;

/** The two playable symbols, encoded as the engine encodes them (0 = A, 1 = B). */
export const SYMBOL = { a: 0, b: 1 } as const;
