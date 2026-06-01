import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../theme/app_typography.dart';

/// The `=` / `≠` edge constraint sign — a typographic glyph in a small
/// background-filled capsule that sits on the edge between two cells.
/// Per `docs/DESIGN.md` these are glyphs, not icons.
enum EdgeSign { eq, ne }

class EqNeBadge extends StatelessWidget {
  const EqNeBadge({super.key, required this.sign, this.size = 22});

  final EdgeSign sign;
  final double size;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: c.bg, // fills against the board so the glyph reads cleanly
        shape: BoxShape.circle,
        boxShadow: context.halveShadows.sm,
      ),
      child: Text(
        sign == EdgeSign.eq ? '=' : '≠',
        textAlign: TextAlign.center,
        style: AppTypography.label.copyWith(
          fontSize: size * 0.68,
          letterSpacing: 0, // glyph, not a tracked label
          color: c.fg1,
        ),
      ),
    );
  }
}
