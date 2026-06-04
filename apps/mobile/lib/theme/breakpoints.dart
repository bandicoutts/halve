import 'package:flutter/material.dart';

/// Single-breakpoint system: phone (<600 logical px) vs tablet (≥600).
/// All adaptive layout decisions key off [isTablet] or [hPagePad].
abstract final class Breakpoints {
  /// Minimum width (logical px) to treat the device as a tablet.
  static const double tablet = 600;

  /// Target content width on tablet screens (logical px), portrait and landscape.
  /// Used by [hPagePad] to derive horizontal margin; content is centred within
  /// this column and narrower devices use full bleed.
  static const double contentWidthPortrait  = 600.0;
  static const double contentWidthLandscape = 640.0;
}

extension BreakpointX on BuildContext {
  /// True when the screen is ≥[Breakpoints.tablet] logical px wide.
  bool get isTablet =>
      MediaQuery.sizeOf(this).width >= Breakpoints.tablet;

  /// Horizontal page padding: centered-column margin on tablet, fixed 20px on phone.
  /// Returns a padding value — (screenWidth − contentWidth) / 2.
  double get hPagePad {
    final w = MediaQuery.sizeOf(this).width;
    if (w < Breakpoints.tablet) return 20.0; // AppSpacing.s5
    final isLandscape =
        MediaQuery.orientationOf(this) == Orientation.landscape;
    final target = isLandscape
        ? Breakpoints.contentWidthLandscape
        : Breakpoints.contentWidthPortrait;
    return ((w - target) / 2).clamp(20.0, double.infinity);
  }
}
