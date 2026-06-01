import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// The Lucide "flame" glyph, drawn as a stroked line icon (never emoji — see
/// the design guardrails). Traced 1:1 from Lucide's 24×24 path so it matches
/// the web streak band. Defaults to the accent color.
class FlameIcon extends StatelessWidget {
  const FlameIcon({super.key, this.size = 20, this.color, this.strokeWidth = 1.75});

  final double size;
  final Color? color;
  final double strokeWidth;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size.square(size),
      painter: _FlamePainter(
        color: color ?? context.halveColors.accent,
        strokeWidth: strokeWidth,
      ),
    );
  }
}

class _FlamePainter extends CustomPainter {
  _FlamePainter({required this.color, required this.strokeWidth});

  final Color color;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 24, size.height / 24);

    // Lucide flame:
    // M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6
    //   .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0
    //   c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z
    final path = Path()
      ..moveTo(8.5, 14.5)
      ..arcToPoint(const Offset(11, 12),
          radius: const Radius.circular(2.5), clockwise: false)
      ..relativeCubicTo(0, -1.38, -0.5, -2, -1, -3)
      ..relativeCubicTo(-1.072, -2.143, -0.224, -4.054, 2, -6)
      ..relativeCubicTo(0.5, 2.5, 2, 4.9, 4, 6.5)
      ..relativeCubicTo(2, 1.6, 3, 3.5, 3, 5.5)
      ..relativeArcToPoint(const Offset(-14, 0),
          radius: const Radius.circular(7), largeArc: true, clockwise: true)
      ..relativeCubicTo(0, -1.153, 0.433, -2.294, 1, -3)
      ..relativeArcToPoint(const Offset(2.5, 3),
          radius: const Radius.circular(2.5), clockwise: false)
      ..close();

    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round
        ..isAntiAlias = true,
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(_FlamePainter old) =>
      old.color != color || old.strokeWidth != strokeWidth;
}
