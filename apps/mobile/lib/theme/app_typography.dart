import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Typography for Halve — a single characterful grotesque (Space Grotesk),
/// bundled as a variable font asset (no runtime fetching). Weight is driven
/// through the `wght` variation axis so the variable font renders the exact
/// weight rather than a synthetic bold.
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

  static TextStyle get display => _grotesk(
        size: 56,
        weight: FontWeight.w500,
        height: 1.05, // leading-tight
        letterSpacing: -1.12, // -0.02em
      );

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

  static TextStyle get small => _grotesk(
        size: 14,
        weight: FontWeight.w400,
        height: 1.45,
      );

  /// Uppercase tracked eyebrow label. Caller must uppercase the text
  /// (matches CSS `text-transform: uppercase`).
  static TextStyle get label => _grotesk(
        size: 12,
        weight: FontWeight.w600,
        height: 1.0,
        letterSpacing: 0.96, // 0.08em
      );

  /// Large tabular numeric display for the play timer.
  static TextStyle get timer => _grotesk(
        size: 44,
        weight: FontWeight.w500,
        height: 1.0,
        letterSpacing: -0.44, // -0.01em
        features: _tabularFeatures,
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
