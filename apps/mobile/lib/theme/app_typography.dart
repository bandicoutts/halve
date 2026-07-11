import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Typography for Halve. Space Grotesk remains the bundled dependable face,
/// with prototype-facing serif/mono roles expressed as fallbacks so the app can
/// take on the mobile prototype's editorial voice without runtime font fetches.
///
/// Mirrors the type scale in `packages/design/styles/tokens.css` / `docs/DESIGN.md`:
/// display 56 · h1 36 · h2 26 · h3 20 (all w500) · body 16 · small 14 ·
/// label 12 (w600, uppercase, tracked) · timer 44 (w500, tabular).
///
/// CSS `letter-spacing` is in `em`; Flutter's `letterSpacing` is in logical
/// pixels, so the em values are pre-multiplied by font size here
/// (e.g. tracking-tight `-0.02em` at 56px → `-1.12`).
///
/// No second typeface. No Inter. (`docs/DESIGN.md` hard rule.)
abstract final class AppTypography {
  static const String fontFamily = 'Space Grotesk';
  static const String serifFamily = 'Newsreader';
  static const String monoFamily = 'Spline Sans Mono';

  /// Builds a Space Grotesk style, wiring the `wght` variation axis to [weight]
  /// so the variable font picks the true weight.
  static TextStyle _grotesk({
    required double size,
    required FontWeight weight,
    double height = 1.0,
    double letterSpacing = 0.0,
    List<FontFeature>? features,
  }) {
    return TextStyle(
      fontFamily: fontFamily,
      fontSize: size,
      fontWeight: weight,
      fontVariations: [FontVariation('wght', weight.value.toDouble())],
      height: height,
      letterSpacing: letterSpacing,
      fontFeatures: features,
    );
  }

  static TextStyle _serif({
    required double size,
    FontWeight weight = FontWeight.w500,
    double height = 1.0,
    double letterSpacing = 0.0,
    bool italic = true,
    List<FontFeature>? features,
  }) {
    return TextStyle(
      fontFamily: serifFamily,
      fontFamilyFallback: const ['Georgia', 'Times New Roman', fontFamily],
      fontSize: size,
      fontWeight: weight,
      fontStyle: italic ? FontStyle.italic : FontStyle.normal,
      height: height,
      letterSpacing: letterSpacing,
      fontFeatures: features,
    );
  }

  static TextStyle _mono({
    required double size,
    FontWeight weight = FontWeight.w500,
    double height = 1.0,
    double letterSpacing = 0.0,
    List<FontFeature>? features,
  }) {
    return TextStyle(
      fontFamily: monoFamily,
      fontFamilyFallback: const ['Menlo', 'Roboto Mono', fontFamily],
      fontSize: size,
      fontWeight: weight,
      height: height,
      letterSpacing: letterSpacing,
      fontFeatures: features,
    );
  }

  static TextStyle get display => _grotesk(
    size: 56,
    weight: FontWeight.w500,
    height: 1.05, // leading-tight
    letterSpacing: -1.12, // -0.02em
  );

  static TextStyle get editorialDisplay =>
      _serif(size: 56, height: 0.95, letterSpacing: -1.12);

  static TextStyle get editorialH1 =>
      _serif(size: 38, height: 1.0, letterSpacing: -0.38);

  static TextStyle get editorialH2 =>
      _serif(size: 30, height: 1.02, letterSpacing: -0.6);

  static TextStyle get wordmark =>
      _serif(size: 20, height: 1.0, letterSpacing: -0.2);

  static TextStyle get h1 => _grotesk(
    size: 36,
    weight: FontWeight.w500,
    height: 1.05,
    letterSpacing: -0.72, // -0.02em
  );

  static TextStyle get h2 => _grotesk(
    size: 26,
    weight: FontWeight.w500,
    height: 1.2, // leading-snug
    letterSpacing: -0.26, // -0.01em
  );

  static TextStyle get h3 => _grotesk(
    size: 20,
    weight: FontWeight.w500,
    height: 1.2,
    letterSpacing: -0.20, // -0.01em
  );

  static TextStyle get body => _grotesk(
    size: 16,
    weight: FontWeight.w400,
    height: 1.5, // leading-normal
  );

  static TextStyle get small =>
      _grotesk(size: 14, weight: FontWeight.w400, height: 1.45);

  /// Uppercase tracked eyebrow label. Caller must uppercase the text
  /// (matches CSS `text-transform: uppercase`).
  static TextStyle get label => _grotesk(
    size: 12,
    weight: FontWeight.w600,
    height: 1.0,
    letterSpacing: 0.96, // 0.08em
  );

  static TextStyle get monoLabel =>
      _mono(size: 11, weight: FontWeight.w500, height: 1.0, letterSpacing: 2.2);

  static TextStyle get monoMicro =>
      _mono(size: 10, weight: FontWeight.w500, height: 1.0, letterSpacing: 1.6);

  static TextStyle get monoNumber => _mono(
    size: 24,
    weight: FontWeight.w500,
    height: 1.0,
    features: _tabularFeatures,
  );

  /// Large tabular numeric display for the play timer.
  static TextStyle get timer => _grotesk(
    size: 44,
    weight: FontWeight.w500,
    height: 1.0,
    letterSpacing: -0.44, // -0.01em
    features: _tabularFeatures,
  );

  /// Sub-label text — 11 px, slightly tracked (0.06em). Used for bottom-nav
  /// labels, play-control labels, archive weekday initials, and legend text.
  static TextStyle get micro => _grotesk(
    size: 11,
    weight: FontWeight.w500,
    height: 1.0,
    letterSpacing: 0.66, // 0.06em
  );

  static final List<FontFeature> _tabularFeatures = [
    const FontFeature.tabularFigures(),
    FontFeature.stylisticSet(1),
  ];

  /// Apply tabular figures + stylistic set 01 to any style. Use for every
  /// number that changes width over time (timer, streak, stats) so digits
  /// never shift. Mirrors `font-feature-settings: "tnum" 1, "ss01" 1`.
  static TextStyle tabular(TextStyle style) =>
      style.copyWith(fontFeatures: _tabularFeatures);

  /// Fully-colored [TextTheme] for a given palette. Default text color is
  /// `fg1`; secondary slots (body/small) use `fg2`; the label slot uses `fg3`,
  /// matching the semantic type classes in `tokens.css`.
  static TextTheme textTheme(HalveColors c) {
    return TextTheme(
      displayLarge: display.copyWith(color: c.fg1),
      headlineLarge: h1.copyWith(color: c.fg1),
      headlineMedium: h2.copyWith(color: c.fg1),
      titleLarge: h3.copyWith(color: c.fg1),
      bodyLarge: body.copyWith(color: c.fg2),
      bodyMedium: small.copyWith(color: c.fg2),
      labelLarge: label.copyWith(color: c.fg3),
    );
  }
}
