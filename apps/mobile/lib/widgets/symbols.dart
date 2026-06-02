import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// The two abstract game pieces and the master mark, drawn as custom vector
/// art (never emoji, never images). All built on a `0 0 100 100` viewBox to
/// match `docs/DESIGN.md`:
///   • Disc (A): filled circle r=42 — fills space (amber, `symbolA`).
///   • Ring (B): stroked circle r=36 / width=12, outer radius 42 to match the
///     disc — defines space (teal, `symbolB`).
///   • Mark: one circle split by a vertical hairline — left half amber, right
///     half teal — the literal embodiment of the name *Halve*.

/// Symbol A — the solid disc. Defaults to `symbolA` for the active theme.
class SymbolDisc extends StatelessWidget {
  const SymbolDisc({super.key, this.size = 32, this.color});

  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size.square(size),
      painter: _DiscPainter(color ?? context.halveColors.symbolA),
    );
  }
}

/// Symbol B — the outlined ring. Defaults to `symbolB` for the active theme.
class SymbolRing extends StatelessWidget {
  const SymbolRing({super.key, this.size = 32, this.color});

  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size.square(size),
      painter: _RingPainter(color ?? context.halveColors.symbolB),
    );
  }
}

/// The master mark — a single circle bisected by a vertical hairline, left
/// half amber (A), right half teal (B). The divider uses the page background
/// so the two halves read as a clean cut.
class HalveMark extends StatelessWidget {
  const HalveMark({super.key, this.size = 36, this.dividerColor});

  final double size;

  /// Override for the hairline divider. Defaults to the page background (`bg`).
  final Color? dividerColor;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return CustomPaint(
      size: Size.square(size),
      painter: _MarkPainter(
        a: c.symbolA,
        b: c.symbolB,
        divider: dividerColor ?? c.bg,
      ),
    );
  }
}

class _DiscPainter extends CustomPainter {
  _DiscPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..isAntiAlias = true
      ..style = PaintingStyle.fill;
    final center = Offset(size.width / 2, size.height / 2);
    canvas.drawCircle(center, size.width * 0.42, paint);
  }

  @override
  bool shouldRepaint(_DiscPainter old) => old.color != color;
}

class _RingPainter extends CustomPainter {
  _RingPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..isAntiAlias = true
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.12;
    final center = Offset(size.width / 2, size.height / 2);
    // r=36 in viewBox; stroke (width 12) straddles the path → outer edge 42,
    // matching the disc's radius for visual parity.
    canvas.drawCircle(center, size.width * 0.36, paint);
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.color != color;
}

class _MarkPainter extends CustomPainter {
  _MarkPainter({required this.a, required this.b, required this.divider});
  final Color a;
  final Color b;
  final Color divider;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 100, size.height / 100); // work in viewBox units

    const top = Offset(50, 8);
    const bottom = Offset(50, 92);
    const r = Radius.circular(42);

    final left = Path()
      ..moveTo(top.dx, top.dy)
      ..arcToPoint(bottom, radius: r, clockwise: false)
      ..close();
    final right = Path()
      ..moveTo(top.dx, top.dy)
      ..arcToPoint(bottom, radius: r, clockwise: true)
      ..close();

    final aa = Paint()..isAntiAlias = true;
    canvas.drawPath(left, aa..color = a);
    canvas.drawPath(right, aa..color = b);

    canvas.drawLine(
      top,
      bottom,
      Paint()
        ..color = divider
        ..strokeWidth = 1.5
        ..isAntiAlias = true,
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(_MarkPainter old) =>
      old.a != a || old.b != b || old.divider != divider;
}
