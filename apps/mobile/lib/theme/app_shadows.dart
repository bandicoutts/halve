import 'package:flutter/material.dart';

/// Warm-tinted, soft elevation shadows resolved per [Brightness].
///
/// Mirrors the `--shadow-*` tokens in `packages/design/styles/tokens.css`.
/// Paper uses soft warm shadows; ink leans on darker, deeper ones (paired in
/// practice with hairlines + surface lightening — never shadow alone).
///
/// CSS `box-shadow: <x> <y> <blur> <spread> <color>` maps to
/// [BoxShadow.offset]/[BoxShadow.blurRadius]/[BoxShadow.spreadRadius].
///
/// Resolve via `Theme.of(context).extension<HalveShadows>()!` or the
/// `context.halveShadows` extension in `app_theme.dart`.
@immutable
class HalveShadows extends ThemeExtension<HalveShadows> {
  const HalveShadows({
    required this.sm,
    required this.md,
    required this.lg,
    required this.cell,
  });

  final List<BoxShadow> sm;
  final List<BoxShadow> md;
  final List<BoxShadow> lg;
  final List<BoxShadow> cell;

  /// Light (Paper) — warm-tinted on `rgba(33,28,21,…)`.
  static const light = HalveShadows(
    sm: [
      BoxShadow(
        color: Color(0x0F211C15), // 0.06
        offset: Offset(0, 1),
        blurRadius: 2,
      ),
    ],
    md: [
      BoxShadow(
        color: Color(0x1F211C15), // 0.12
        offset: Offset(0, 4),
        blurRadius: 16,
        spreadRadius: -6,
      ),
    ],
    lg: [
      BoxShadow(
        color: Color(0x2E211C15), // 0.18
        offset: Offset(0, 18),
        blurRadius: 48,
        spreadRadius: -12,
      ),
    ],
    cell: [
      BoxShadow(
        color: Color(0x0D211C15), // 0.05
        offset: Offset(0, 1),
      ),
      BoxShadow(
        color: Color(0x1F211C15), // 0.12
        offset: Offset(0, 2),
        blurRadius: 6,
        spreadRadius: -3,
      ),
    ],
  );

  /// Dark (Ink) — deeper, cooler black shadows.
  static const dark = HalveShadows(
    sm: [
      BoxShadow(
        color: Color(0x66000000), // 0.4
        offset: Offset(0, 1),
        blurRadius: 2,
      ),
    ],
    md: [
      BoxShadow(
        color: Color(0x8C000000), // 0.55
        offset: Offset(0, 6),
        blurRadius: 20,
        spreadRadius: -8,
      ),
    ],
    lg: [
      BoxShadow(
        color: Color(0xA6000000), // 0.65
        offset: Offset(0, 22),
        blurRadius: 56,
        spreadRadius: -16,
      ),
    ],
    cell: [
      BoxShadow(
        color: Color(0x66000000), // 0.4
        offset: Offset(0, 1),
      ),
      BoxShadow(
        color: Color(0x80000000), // 0.5
        offset: Offset(0, 2),
        blurRadius: 8,
        spreadRadius: -4,
      ),
    ],
  );

  @override
  HalveShadows copyWith({
    List<BoxShadow>? sm,
    List<BoxShadow>? md,
    List<BoxShadow>? lg,
    List<BoxShadow>? cell,
  }) {
    return HalveShadows(
      sm: sm ?? this.sm,
      md: md ?? this.md,
      lg: lg ?? this.lg,
      cell: cell ?? this.cell,
    );
  }

  @override
  HalveShadows lerp(ThemeExtension<HalveShadows>? other, double t) {
    if (other is! HalveShadows) return this;
    return HalveShadows(
      sm: BoxShadow.lerpList(sm, other.sm, t) ?? sm,
      md: BoxShadow.lerpList(md, other.md, t) ?? md,
      lg: BoxShadow.lerpList(lg, other.lg, t) ?? lg,
      cell: BoxShadow.lerpList(cell, other.cell, t) ?? cell,
    );
  }
}
