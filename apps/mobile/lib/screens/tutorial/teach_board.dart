import 'package:flutter/material.dart';

import '../../data/models/models.dart';
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';

/// A cell coordinate `(row, col)`.
typedef Coord = (int row, int col);

/// The square teaching board used by the tutorial: an n×n grid with `=`/`≠`
/// edge signs in the gaps, per-cell correct/wrong tint, an annotation
/// highlight (+ optional dimming of the rest), and an interactive mode for the
/// guided solve. A faithful port of `TeachBoard` in the wireframe
/// `teach-board.jsx`. Separate from the play board because it adds the teaching
/// affordances (highlight / dim / tappable-subset) the real game never needs.
class TeachBoard extends StatelessWidget {
  const TeachBoard({
    super.key,
    required this.cells,
    required this.givens,
    required this.edges,
    required this.cellSize,
    required this.gap,
    this.violations = const {},
    this.highlight = const {},
    this.dimRest = false,
    this.onTap,
    this.tappable,
  });

  final Grid cells;
  final Grid givens;
  final List<Edge> edges;
  final double cellSize;
  final double gap;

  /// Cells currently breaking a rule (wrong tint + border).
  final Set<Coord> violations;

  /// Cells to call out with an accent ring (and a subtle scale-up).
  final Set<Coord> highlight;

  /// When true, every non-highlighted cell is dimmed (used to focus the one
  /// guided move).
  final bool dimRest;

  final void Function(int r, int c)? onTap;

  /// Which cells accept taps; null → none (a display-only board).
  final bool Function(int r, int c)? tappable;

  @override
  Widget build(BuildContext context) {
    final n = cells.length;
    final total = n * cellSize + (n - 1) * gap;
    double span(int i) => i * (cellSize + gap);
    final signSize = (cellSize * 0.4).clamp(20.0, double.infinity);

    return SizedBox(
      width: total,
      height: total,
      child: Stack(
        children: [
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (var r = 0; r < n; r++) ...[
                if (r > 0) SizedBox(height: gap),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    for (var c = 0; c < n; c++) ...[
                      if (c > 0) SizedBox(width: gap),
                      TeachCell(
                        key: ValueKey('tut-cell-$r-$c'),
                        value: cells[r][c],
                        size: cellSize,
                        given: givens[r][c] != null,
                        violation: violations.contains((r, c)),
                        highlight: highlight.contains((r, c)),
                        dimmed: dimRest && !highlight.contains((r, c)),
                        onTap: (tappable?.call(r, c) ?? false) && onTap != null
                            ? () => onTap!(r, c)
                            : null,
                      ),
                    ],
                  ],
                ),
              ],
            ],
          ),
          for (final e in edges)
            Positioned(
              left: (e.orientation == EdgeOrientation.h
                      ? span(e.c) + cellSize + gap / 2
                      : span(e.c) + cellSize / 2) -
                  signSize / 2,
              top: (e.orientation == EdgeOrientation.h
                      ? span(e.r) + cellSize / 2
                      : span(e.r) + cellSize + gap / 2) -
                  signSize / 2,
              child: EqNeBadge(
                sign: e.kind == EdgeKind.eq ? EdgeSign.eq : EdgeSign.ne,
                size: signSize,
              ),
            ),
        ],
      ),
    );
  }
}

/// One teaching cell — the four base states (given / entered / empty /
/// violation) plus the annotation states (highlight ring, dim). Presses
/// confirm with a calm scale-to-0.94 (no ripple), matching the play board.
class TeachCell extends StatefulWidget {
  const TeachCell({
    super.key,
    required this.value,
    required this.size,
    this.given = false,
    this.violation = false,
    this.highlight = false,
    this.dimmed = false,
    this.onTap,
  });

  final Cell value;
  final double size;
  final bool given;
  final bool violation;
  final bool highlight;
  final bool dimmed;
  final VoidCallback? onTap;

  @override
  State<TeachCell> createState() => _TeachCellState();
}

class _TeachCellState extends State<TeachCell> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final filled = widget.value != null;

    final Color bg;
    final BoxBorder? border;
    if (widget.violation) {
      bg = c.wrongTint;
      border = Border.all(color: c.wrong, width: 2);
    } else if (widget.highlight) {
      bg = filled ? c.surfaceRaised : c.surface;
      border = Border.all(color: c.accent, width: 2);
    } else if (widget.given) {
      bg = c.bgSunken;
      border = null;
    } else if (filled) {
      bg = c.surfaceRaised;
      border = null;
    } else {
      bg = c.surface;
      border = Border.all(color: c.hairline2, width: 1.5);
    }

    final scale = _pressed ? 0.94 : (widget.highlight ? 1.04 : 1.0);

    return GestureDetector(
      onTapDown: widget.onTap == null ? null : (_) => setState(() => _pressed = true),
      onTapUp: widget.onTap == null ? null : (_) => setState(() => _pressed = false),
      onTapCancel:
          widget.onTap == null ? null : () => setState(() => _pressed = false),
      onTap: widget.onTap,
      child: AnimatedOpacity(
        opacity: widget.dimmed ? 0.32 : 1,
        duration: const Duration(milliseconds: 200),
        child: AnimatedScale(
          scale: scale,
          duration: const Duration(milliseconds: 160),
          curve: Curves.easeOut,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            width: widget.size,
            height: widget.size,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: bg,
              border: border,
              borderRadius: AppRadii.cellR,
              boxShadow: filled && !widget.violation && !widget.given
                  ? context.halveShadows.cell
                  : null,
            ),
            child: filled
                ? (widget.value == 0
                    ? SymbolDisc(size: widget.size * 0.6)
                    : SymbolRing(size: widget.size * 0.6))
                : null,
          ),
        ),
      ),
    );
  }
}
