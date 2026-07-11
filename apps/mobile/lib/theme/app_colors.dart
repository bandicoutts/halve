import 'package:flutter/material.dart';

/// Raw reference palette. Do NOT theme directly on these — they are the
/// source values that semantic [HalveColors] tokens are composed from.
/// Mirrors `packages/design/styles/tokens.css` :root raw palette (canonical).
abstract final class HalvePalette {
  // Warm paper neutrals (light)
  static const paper50 = Color(0xFFFDFAF3);
  static const paper100 = Color(0xFFF5F0E6); // page background
  static const paper200 = Color(0xFFEFE8DA);
  static const paper300 = Color(0xFFE4DDCD); // hairline
  static const paper400 = Color(0xFFD6CCB8);
  static const clay500 = Color(
    0xFF9A9080,
  ); // decorative muted (fails AA as text)
  static const clay550 = Color(0xFF746B5A); // muted fg — AA text
  static const clay600 = Color(0xFF6B6253); // secondary fg
  static const clay700 = Color(0xFF463F33);
  static const ink900 = Color(0xFF211B14); // primary fg on paper

  // Warm ink neutrals (dark)
  static const night950 = Color(0xFF161210); // page background
  static const night900 = Color(0xFF1B1410);
  static const night850 = Color(0xFF1F1A15); // surface
  static const night800 = Color(0xFF2A2418);
  static const night700 = Color(0xFF352E20); // hairline
  static const night600 = Color(0xFF4A4030);
  static const dust500 = Color(
    0xFF6E6553,
  ); // decorative muted (fails AA as text)
  static const dust400 = Color(0xFF9A8F7E); // muted fg — AA text
  static const dust300 = Color(0xFFA79D89); // secondary fg
  static const dust100 = Color(0xFFEFE8D9); // primary fg on ink

  // Amber — the hero accent
  static const amberDisc = Color(0xFFE8703A); // the solid game symbol (A)
  static const amber = Color(0xFFDE5F27); // accent on paper
  static const amberStrong = Color(0xFF943210); // pressed / strong
  static const amberBright = Color(0xFFE8703A); // accent on ink
  static const amberTint = Color(0xFFF8E4DC); // soft fill on paper
  static const amberTintDk = Color(0xFF38180E); // soft fill on ink

  // Teal — the ring game symbol (B)
  static const teal = Color(0xFF1E9C8F); // symbol B on paper
  static const tealBright = Color(0xFF45BFB2); // symbol B on ink
  static const tealStrong = Color(0xFF1E5C52);

  // Semantic feedback (warm-leaning)
  static const correctL = Color(0xFF4E8A66);
  static const correctTintL = Color(0xFFE2EFE5);
  static const wrongL = Color(0xFFC2564B);
  static const wrongTintL = Color(0xFFF6E2DD);
  static const correctD = Color(0xFF6FB389);
  static const correctTintD = Color(0xFF1E2C22);
  static const wrongD = Color(0xFFDC7A6E);
  static const wrongTintD = Color(0xFF2E1C18);

  static const white = Color(0xFFFFFFFF);
}

/// Semantic color tokens for Halve, resolved per [Brightness].
///
/// This is the single source of truth for color in the app — exposes every
/// semantic token from `packages/design/styles/tokens.css`, including the
/// non-Material ones (symbol A/B, correct/wrong + tints, hairlines, accent
/// tint) that don't map cleanly onto Material's [ColorScheme].
///
/// Resolve via `Theme.of(context).extension<HalveColors>()!` or the
/// `context.halveColors` extension in `app_theme.dart`.
///
/// Gotcha: `symbolA` is identical in both themes; `symbolB` shifts
/// (light teal `#2A7A6E` → dark teal-bright `#6EC8BC`).
@immutable
class HalveColors extends ThemeExtension<HalveColors> {
  const HalveColors({
    required this.bg,
    required this.bgSunken,
    required this.surface,
    required this.surfaceRaised,
    required this.fg1,
    required this.fg2,
    required this.fg3,
    required this.hairline,
    required this.hairline2,
    required this.accent,
    required this.accentStrong,
    required this.accentTint,
    required this.onAccent,
    required this.symbolA,
    required this.symbolB,
    required this.correct,
    required this.correctTint,
    required this.wrong,
    required this.wrongTint,
  });

  // Surfaces
  final Color bg;
  final Color bgSunken;
  final Color surface;
  final Color surfaceRaised;

  // Foreground text
  final Color fg1; // primary
  final Color fg2; // secondary
  final Color fg3; // tertiary / labels (AA-compliant value)

  // Borders
  final Color hairline;
  final Color hairline2;

  // Accent (amber)
  final Color accent;
  final Color accentStrong;
  final Color accentTint;
  final Color onAccent;

  // Game symbols
  final Color symbolA; // disc (amber)
  final Color symbolB; // ring (teal)

  // Correctness feedback (never reused for symbols)
  final Color correct;
  final Color correctTint;
  final Color wrong;
  final Color wrongTint;

  /// Light (Paper) — the default. Mirrors `:root` semantic tokens.
  static const light = HalveColors(
    bg: HalvePalette.paper100,
    bgSunken: HalvePalette.paper200,
    surface: HalvePalette.paper50,
    surfaceRaised: HalvePalette.white,
    fg1: HalvePalette.ink900,
    fg2: HalvePalette.clay600,
    fg3: HalvePalette.clay550,
    hairline: Color(0x291F1A14),
    hairline2: Color(0x3D1F1A14),
    accent: HalvePalette.amber,
    accentStrong: HalvePalette.amberStrong,
    accentTint: HalvePalette.amberTint,
    onAccent: HalvePalette.white,
    symbolA: HalvePalette.amberDisc,
    symbolB: HalvePalette.teal,
    correct: HalvePalette.correctL,
    correctTint: HalvePalette.correctTintL,
    wrong: HalvePalette.wrongL,
    wrongTint: HalvePalette.wrongTintL,
  );

  /// Dark (Ink). Mirrors `.dark` semantic tokens.
  static const dark = HalveColors(
    bg: HalvePalette.night950,
    bgSunken: HalvePalette.night900,
    surface: HalvePalette.night850,
    surfaceRaised: HalvePalette.night800,
    fg1: HalvePalette.dust100,
    fg2: HalvePalette.dust300,
    fg3: HalvePalette.dust400,
    hairline: Color(0x26E9DFCD),
    hairline2: Color(0x40E9DFCD),
    accent: HalvePalette.amberBright,
    accentStrong: HalvePalette.amberDisc,
    accentTint: HalvePalette.amberTintDk,
    onAccent: HalvePalette.night900,
    symbolA: HalvePalette.amberDisc,
    symbolB: HalvePalette.tealBright,
    correct: HalvePalette.correctD,
    correctTint: HalvePalette.correctTintD,
    wrong: HalvePalette.wrongD,
    wrongTint: HalvePalette.wrongTintD,
  );

  @override
  HalveColors copyWith({
    Color? bg,
    Color? bgSunken,
    Color? surface,
    Color? surfaceRaised,
    Color? fg1,
    Color? fg2,
    Color? fg3,
    Color? hairline,
    Color? hairline2,
    Color? accent,
    Color? accentStrong,
    Color? accentTint,
    Color? onAccent,
    Color? symbolA,
    Color? symbolB,
    Color? correct,
    Color? correctTint,
    Color? wrong,
    Color? wrongTint,
  }) {
    return HalveColors(
      bg: bg ?? this.bg,
      bgSunken: bgSunken ?? this.bgSunken,
      surface: surface ?? this.surface,
      surfaceRaised: surfaceRaised ?? this.surfaceRaised,
      fg1: fg1 ?? this.fg1,
      fg2: fg2 ?? this.fg2,
      fg3: fg3 ?? this.fg3,
      hairline: hairline ?? this.hairline,
      hairline2: hairline2 ?? this.hairline2,
      accent: accent ?? this.accent,
      accentStrong: accentStrong ?? this.accentStrong,
      accentTint: accentTint ?? this.accentTint,
      onAccent: onAccent ?? this.onAccent,
      symbolA: symbolA ?? this.symbolA,
      symbolB: symbolB ?? this.symbolB,
      correct: correct ?? this.correct,
      correctTint: correctTint ?? this.correctTint,
      wrong: wrong ?? this.wrong,
      wrongTint: wrongTint ?? this.wrongTint,
    );
  }

  @override
  HalveColors lerp(ThemeExtension<HalveColors>? other, double t) {
    if (other is! HalveColors) return this;
    return HalveColors(
      bg: Color.lerp(bg, other.bg, t)!,
      bgSunken: Color.lerp(bgSunken, other.bgSunken, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceRaised: Color.lerp(surfaceRaised, other.surfaceRaised, t)!,
      fg1: Color.lerp(fg1, other.fg1, t)!,
      fg2: Color.lerp(fg2, other.fg2, t)!,
      fg3: Color.lerp(fg3, other.fg3, t)!,
      hairline: Color.lerp(hairline, other.hairline, t)!,
      hairline2: Color.lerp(hairline2, other.hairline2, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      accentStrong: Color.lerp(accentStrong, other.accentStrong, t)!,
      accentTint: Color.lerp(accentTint, other.accentTint, t)!,
      onAccent: Color.lerp(onAccent, other.onAccent, t)!,
      symbolA: Color.lerp(symbolA, other.symbolA, t)!,
      symbolB: Color.lerp(symbolB, other.symbolB, t)!,
      correct: Color.lerp(correct, other.correct, t)!,
      correctTint: Color.lerp(correctTint, other.correctTint, t)!,
      wrong: Color.lerp(wrong, other.wrong, t)!,
      wrongTint: Color.lerp(wrongTint, other.wrongTint, t)!,
    );
  }
}
