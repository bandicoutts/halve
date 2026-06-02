import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// The `=` / `≠` edge constraint sign — a custom-painted glyph in a small
/// background-filled circle that sits on the edge between two cells.
/// Painted rather than typographic so the pixel output is identical across
/// platforms (eliminates CoreText vs Skia rendering differences in CI).
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
      decoration: BoxDecoration(
        color: c.bg,
        shape: BoxShape.circle,
        boxShadow: context.halveShadows.sm,
      ),
      child: CustomPaint(
        painter: _SignPainter(
          isNotEqual: sign == EdgeSign.ne,
          color: c.fg1,
        ),
      ),
    );
  }
}

/// Draws `=` (two horizontal bars) or `≠` (two bars + diagonal slash).
/// All proportions are relative to the paint bounds so the glyph scales
/// correctly at any [EqNeBadge.size].
class _SignPainter extends CustomPainter {
  const _SignPainter({required this.isNotEqual, required this.color});

  final bool isNotEqual;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = size.width * 0.09;
    final paint = Paint()
      ..color = color
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final cx = size.width / 2;
    final cy = size.height / 2;
    // Half-width of each bar (= sign proportions).
    final hw = size.width * 0.24;
    // Half-gap between the two bars.
    final hg = size.height * 0.10;

    // Top bar.
    canvas.drawLine(Offset(cx - hw, cy - hg), Offset(cx + hw, cy - hg), paint);
    // Bottom bar.
    canvas.drawLine(Offset(cx - hw, cy + hg), Offset(cx + hw, cy + hg), paint);

    if (isNotEqual) {
      // Diagonal slash through the bars (bottom-left to top-right).
      final slashH = hg * 2.6;
      canvas.drawLine(
        Offset(cx - hw * 0.55, cy + slashH),
        Offset(cx + hw * 0.55, cy - slashH),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_SignPainter old) =>
      old.isNotEqual != isNotEqual || old.color != color;
}
