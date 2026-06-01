import 'package:flutter/material.dart';

/// The Play control glyphs — Lucide line icons (`rotate-ccw` for Undo,
/// `lightbulb` for Hint), traced 1:1 from Lucide's 24×24 paths so they match
/// the web board controls. Never emoji, never filled (design guardrails).
///
/// Both read color + size from the ambient [IconTheme], so they pick up the
/// state coloring from [HalveIconButton] (fg2 / accent / hairline2-when-disabled)
/// exactly like a Material [Icon].

/// Lucide `rotate-ccw` — the Undo control.
class UndoGlyph extends StatelessWidget {
  const UndoGlyph({super.key, this.strokeWidth = 1.75});

  final double strokeWidth;

  @override
  Widget build(BuildContext context) {
    final theme = IconTheme.of(context);
    return CustomPaint(
      size: Size.square(theme.size ?? 24),
      painter: _UndoPainter(
        color: theme.color ?? const Color(0xFF000000),
        strokeWidth: strokeWidth,
      ),
    );
  }
}

/// Lucide `lightbulb` — the Hint control.
class HintGlyph extends StatelessWidget {
  const HintGlyph({super.key, this.strokeWidth = 1.75});

  final double strokeWidth;

  @override
  Widget build(BuildContext context) {
    final theme = IconTheme.of(context);
    return CustomPaint(
      size: Size.square(theme.size ?? 24),
      painter: _HintPainter(
        color: theme.color ?? const Color(0xFF000000),
        strokeWidth: strokeWidth,
      ),
    );
  }
}

Paint _stroke(Color color, double strokeWidth) => Paint()
  ..color = color
  ..style = PaintingStyle.stroke
  ..strokeWidth = strokeWidth
  ..strokeCap = StrokeCap.round
  ..strokeJoin = StrokeJoin.round
  ..isAntiAlias = true;

class _UndoPainter extends CustomPainter {
  _UndoPainter({required this.color, required this.strokeWidth});

  final Color color;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 24, size.height / 24);

    // Lucide rotate-ccw: "M3 7v6h6" + "M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"
    final corner = Path()
      ..moveTo(3, 7)
      ..relativeLineTo(0, 6)
      ..relativeLineTo(6, 0);
    final arc = Path()
      ..moveTo(21, 17)
      ..relativeArcToPoint(const Offset(-9, -9),
          radius: const Radius.circular(9), clockwise: false)
      ..relativeArcToPoint(const Offset(-6, 2.3),
          radius: const Radius.circular(9), clockwise: false)
      ..lineTo(3, 13);

    final paint = _stroke(color, strokeWidth);
    canvas.drawPath(corner, paint);
    canvas.drawPath(arc, paint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(_UndoPainter old) =>
      old.color != color || old.strokeWidth != strokeWidth;
}

class _HintPainter extends CustomPainter {
  _HintPainter({required this.color, required this.strokeWidth});

  final Color color;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 24, size.height / 24);

    // Lucide lightbulb:
    //   M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8
    //     c0 1 .2 2.2 1.5 3.5 .7 .7 1.3 1.5 1.5 2.5
    //   M9 18h6   M10 22h4
    final bulb = Path()
      ..moveTo(15, 14)
      ..relativeCubicTo(0.2, -1, 0.7, -1.7, 1.5, -2.5)
      ..relativeCubicTo(1, -0.9, 1.5, -2.2, 1.5, -3.5)
      ..arcToPoint(const Offset(6, 8),
          radius: const Radius.circular(6), clockwise: false)
      ..relativeCubicTo(0, 1, 0.2, 2.2, 1.5, 3.5)
      ..relativeCubicTo(0.7, 0.7, 1.3, 1.5, 1.5, 2.5);
    final base = Path()
      ..moveTo(9, 18)
      ..relativeLineTo(6, 0);
    final foot = Path()
      ..moveTo(10, 22)
      ..relativeLineTo(4, 0);

    final paint = _stroke(color, strokeWidth);
    canvas.drawPath(bulb, paint);
    canvas.drawPath(base, paint);
    canvas.drawPath(foot, paint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(_HintPainter old) =>
      old.color != color || old.strokeWidth != strokeWidth;
}
