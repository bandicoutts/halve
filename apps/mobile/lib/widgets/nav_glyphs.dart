import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Bottom-tab glyphs, ported from the mobile wireframe (`app/screens/symbols.jsx`).
/// Line-drawn, Lucide-adjacent; the Today glyph doubles as the brand duality
/// mark. Each takes [active] (drives weight/fill + color) — color is resolved
/// from the theme so it inverts correctly in Paper/Ink.

/// Today / daily-puzzle tab — the split circle (brand mark). Active fills the
/// two halves amber/teal; inactive is a single-color outlined split circle.
class TodayGlyph extends StatelessWidget {
  const TodayGlyph({super.key, this.size = 24, this.active = false, this.color});

  final double size;
  final bool active;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return CustomPaint(
      size: Size.square(size),
      painter: _TodayPainter(
        active: active,
        line: color ?? c.fg3,
        a: c.symbolA,
        b: c.symbolB,
        divider: c.bg,
      ),
    );
  }
}

/// Archive tab — a calendar outline.
class ArchiveGlyph extends StatelessWidget {
  const ArchiveGlyph({super.key, this.size = 24, this.active = false, this.color});

  final double size;
  final bool active;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return CustomPaint(
      size: Size.square(size),
      painter: _ArchivePainter(
        color: color ?? (active ? c.accent : c.fg3),
        strokeWidth: active ? 2.0 : 1.6,
      ),
    );
  }
}

/// Settings tab — three horizontal sliders with knobs.
class SettingsGlyph extends StatelessWidget {
  const SettingsGlyph({super.key, this.size = 24, this.active = false, this.color});

  final double size;
  final bool active;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return CustomPaint(
      size: Size.square(size),
      painter: _SettingsPainter(
        color: color ?? (active ? c.accent : c.fg3),
        strokeWidth: active ? 2.0 : 1.6,
      ),
    );
  }
}

/// Stats tab — three ascending bars.
class StatsGlyph extends StatelessWidget {
  const StatsGlyph({super.key, this.size = 24, this.active = false, this.color});

  final double size;
  final bool active;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return CustomPaint(
      size: Size.square(size),
      painter: _StatsPainter(
        color: color ?? (active ? c.accent : c.fg3),
        strokeWidth: active ? 2.2 : 1.7,
      ),
    );
  }
}

class _TodayPainter extends CustomPainter {
  _TodayPainter({
    required this.active,
    required this.line,
    required this.a,
    required this.b,
    required this.divider,
  });
  final bool active;
  final Color line;
  final Color a;
  final Color b;
  final Color divider;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 100, size.height / 100);
    const top = Offset(50, 10);
    const bottom = Offset(50, 90);
    const r = Radius.circular(40);

    final left = Path()
      ..moveTo(top.dx, top.dy)
      ..arcToPoint(bottom, radius: r, clockwise: false)
      ..close();
    final right = Path()
      ..moveTo(top.dx, top.dy)
      ..arcToPoint(bottom, radius: r, clockwise: true)
      ..close();

    if (active) {
      final fill = Paint()..isAntiAlias = true;
      canvas.drawPath(left, fill..color = a);
      canvas.drawPath(right, fill..color = b);
      canvas.drawLine(
        top,
        bottom,
        Paint()
          ..color = divider
          ..strokeWidth = 5
          ..isAntiAlias = true,
      );
    } else {
      final stroke = Paint()
        ..color = line
        ..style = PaintingStyle.stroke
        ..strokeWidth = 6
        ..strokeCap = StrokeCap.round
        ..isAntiAlias = true;
      canvas.drawCircle(const Offset(50, 50), 40, stroke);
      canvas.drawLine(top, bottom, stroke);
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(_TodayPainter old) =>
      old.active != active ||
      old.line != line ||
      old.a != a ||
      old.b != b ||
      old.divider != divider;
}

class _ArchivePainter extends CustomPainter {
  _ArchivePainter({required this.color, required this.strokeWidth});
  final Color color;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 24, size.height / 24);
    final p = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..isAntiAlias = true;
    final body = RRect.fromRectAndRadius(
      const Rect.fromLTWH(3, 4, 18, 16),
      const Radius.circular(2.5),
    );
    canvas.drawRRect(body, p);
    canvas.drawLine(const Offset(3, 9), const Offset(21, 9), p); // header rule
    canvas.drawLine(const Offset(8, 2.5), const Offset(8, 5.5), p); // ring l
    canvas.drawLine(const Offset(16, 2.5), const Offset(16, 5.5), p); // ring r
    canvas.restore();
  }

  @override
  bool shouldRepaint(_ArchivePainter old) =>
      old.color != color || old.strokeWidth != strokeWidth;
}

class _StatsPainter extends CustomPainter {
  _StatsPainter({required this.color, required this.strokeWidth});
  final Color color;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 24, size.height / 24);
    final p = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..isAntiAlias = true;
    canvas.drawLine(const Offset(6, 20), const Offset(6, 13), p);
    canvas.drawLine(const Offset(12, 20), const Offset(12, 6), p);
    canvas.drawLine(const Offset(18, 20), const Offset(18, 10), p);
    canvas.restore();
  }

  @override
  bool shouldRepaint(_StatsPainter old) =>
      old.color != color || old.strokeWidth != strokeWidth;
}

class _SettingsPainter extends CustomPainter {
  _SettingsPainter({required this.color, required this.strokeWidth});
  final Color color;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 24, size.height / 24);
    final stroke = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..isAntiAlias = true;
    final fill = Paint()
      ..color = color
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;

    // Three horizontal slider lines with knobs at staggered positions.
    // Line 1 (y=6): knob at x=9
    canvas.drawLine(const Offset(3, 6), const Offset(21, 6), stroke);
    canvas.drawCircle(const Offset(9, 6), 2.4, fill);

    // Line 2 (y=12): knob at x=15
    canvas.drawLine(const Offset(3, 12), const Offset(21, 12), stroke);
    canvas.drawCircle(const Offset(15, 12), 2.4, fill);

    // Line 3 (y=18): knob at x=9
    canvas.drawLine(const Offset(3, 18), const Offset(21, 18), stroke);
    canvas.drawCircle(const Offset(9, 18), 2.4, fill);

    canvas.restore();
  }

  @override
  bool shouldRepaint(_SettingsPainter old) =>
      old.color != color || old.strokeWidth != strokeWidth;
}
