import 'package:flutter/material.dart';

/// Single-breakpoint system: phone (<600 logical px) vs tablet (≥600).
/// All adaptive layout decisions key off [isTablet] or [hPagePad].
abstract final class Breakpoints {
  /// Minimum width (logical px) to treat the device as a tablet.
  static const double tablet = 600;

  /// Target content width on tablet screens (logical px). Content is centered
  /// within this column; narrower devices use full bleed.
  static const double contentWidth = 560;
}

extension BreakpointX on BuildContext {
  /// True when the screen is ≥[Breakpoints.tablet] logical px wide.
  bool get isTablet =>
      MediaQuery.sizeOf(this).width >= Breakpoints.tablet;

  /// Horizontal page padding: centered-column margin on tablet, fixed 20px on phone.
  double get hPagePad {
    final w = MediaQuery.sizeOf(this).width;
    if (w < Breakpoints.tablet) return 20.0; // AppSpacing.s5
    return ((w - Breakpoints.contentWidth) / 2).clamp(20.0, double.infinity);
  }
}
