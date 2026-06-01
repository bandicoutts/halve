import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_shadows.dart';
import 'app_typography.dart';

/// Assembles the light (Paper) and dark (Ink) [ThemeData] for Halve, wiring
/// the semantic [HalveColors] + [HalveShadows] extensions, the Space Grotesk
/// [TextTheme], and calm press-state tuning (no ripple — primitives use a
/// press-scale instead, per the motion rules in `docs/DESIGN.md`).
abstract final class AppTheme {
  static ThemeData light() => _build(Brightness.light, HalveColors.light, HalveShadows.light);
  static ThemeData dark() => _build(Brightness.dark, HalveColors.dark, HalveShadows.dark);

  static ThemeData _build(Brightness brightness, HalveColors c, HalveShadows shadows) {
    final scheme = ColorScheme(
      brightness: brightness,
      primary: c.accent,
      onPrimary: c.onAccent,
      secondary: c.symbolB,
      onSecondary: c.onAccent,
      tertiary: c.symbolA,
      onTertiary: c.onAccent,
      error: c.wrong,
      onError: c.onAccent,
      surface: c.surface,
      onSurface: c.fg1,
      surfaceContainerHighest: c.surfaceRaised,
      surfaceContainerLow: c.bgSunken,
      outline: c.hairline2,
      outlineVariant: c.hairline,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: c.bg,
      canvasColor: c.bg,
      textTheme: AppTypography.textTheme(c),
      // Calm motion: no ripple/splash — primitives confirm with a press-scale.
      splashFactory: NoSplash.splashFactory,
      splashColor: Colors.transparent,
      highlightColor: Colors.transparent,
      // Warm-paper / deep-ink backgrounds are flat — no Material tint overlay.
      extensions: [c, shadows],
    );
  }
}

/// Ergonomic access to the semantic theme extensions.
extension HalveThemeContext on BuildContext {
  /// Semantic colors for the active brightness.
  HalveColors get halveColors => Theme.of(this).extension<HalveColors>()!;

  /// Elevation shadows for the active brightness.
  HalveShadows get halveShadows => Theme.of(this).extension<HalveShadows>()!;
}
