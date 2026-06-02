import 'package:flutter/material.dart';

/// Polyline checkmark matching the wireframe SVG (`points="20 6 9 17 4 12"`
/// in a 24×24 viewbox), scaled to [size].
class CheckGlyph extends StatelessWidget {
  const CheckGlyph({super.key, required this.color, this.size = 24.0});

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) => CustomPaint(
        size: Size(size, size),
        painter: _CheckPainter(color: color),
      );
}

class _CheckPainter extends CustomPainter {
  const _CheckPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..isAntiAlias = true;
    final sx = size.width / 24;
    final sy = size.height / 24;
    final path = Path()
      ..moveTo(20 * sx, 6 * sy)
      ..lineTo(9 * sx, 17 * sy)
      ..lineTo(4 * sx, 12 * sy);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_CheckPainter old) => old.color != color;
}
