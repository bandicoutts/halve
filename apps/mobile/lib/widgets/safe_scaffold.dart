import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// A [Scaffold] that paints the Halve page background and guards content
/// against the status bar / home-indicator via [SafeArea]. Used by every
/// screen so safe-area handling is consistent and centralised.
///
/// The bottom edge is left unguarded by default ([safeBottom] = false) because
/// the shell's bottom nav owns that inset; full-screen routes (Play, sheets)
/// set [safeBottom] = true.
class SafeScaffold extends StatelessWidget {
  const SafeScaffold({
    super.key,
    required this.body,
    this.safeTop = true,
    this.safeBottom = false,
    this.backgroundColor,
  });

  final Widget body;
  final bool safeTop;
  final bool safeBottom;

  /// Defaults to the theme `bg` (warm paper / deep ink).
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor ?? context.halveColors.bg,
      body: SafeArea(
        top: safeTop,
        bottom: safeBottom,
        child: body,
      ),
    );
  }
}

/// Whether the OS has asked for reduced motion. Drive page-transition and
/// incidental animations off this (per `docs/DESIGN.md` reduced-motion rule).
extension ReducedMotion on BuildContext {
  bool get reduceMotion => MediaQuery.disableAnimationsOf(this);
}
