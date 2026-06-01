import 'package:flutter/material.dart';

import '../../data/models/models.dart';
import '../../engine/validator.dart' show Coord;
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';

/// The 6×6 play surface: a grid of tappable cells with the `=`/`≠` edge signs
/// floating over the gaps. Ported faithfully from the web `Board.tsx` +
/// `Cell.tsx` (cell radius, hairlines, given/entered/error styling, edge
/// positioning). Pure presentation — state lives in the [PlayController].
class PlayBoard extends StatelessWidget {
  const PlayBoard({
    super.key,
    required this.cells,
    required this.givens,
    required this.edges,
    required this.violations,
    required this.cellSize,
    required this.gap,
    this.readOnly = false,
    this.onCellTap,
  });

  final Grid cells;
  final Grid givens;
  final List<Edge> edges;
  final Set<Coord> violations;
  final double cellSize;
  final double gap;
  final bool readOnly;
  final void Function(int r, int c)? onCellTap;

  @override
  Widget build(BuildContext context) {
    final n = cells.length;
    final total = n * cellSize + (n - 1) * gap;
    double span(int i) => i * (cellSize + gap);
    final edgeSignSize = (cellSize * 0.42).clamp(20.0, double.infinity);

    return SizedBox(
      width: total,
      height: total,
      child: Stack(
        children: [
          // Cells.
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (var r = 0; r < n; r++) ...[
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    for (var c = 0; c < n; c++) ...[
                      _PlayCell(
                        key: ValueKey('cell-$r-$c'),
                        value: cells[r][c],
                        isGiven: givens[r][c] != null,
                        isError: violations.contains((r, c)),
                        size: cellSize,
                        onTap: readOnly || givens[r][c] != null
                            ? null
                            : () => onCellTap?.call(r, c),
                        semanticLabel: _cellLabel(r, c, cells[r][c],
                            givens[r][c] != null, violations.contains((r, c))),
                      ),
                      if (c < n - 1) SizedBox(width: gap),
                    ],
                  ],
                ),
                if (r < n - 1) SizedBox(height: gap),
              ],
            ],
          ),
          // Edge signs, centered over the gap between their two cells.
          for (final e in edges)
            Positioned(
              left: (e.orientation == EdgeOrientation.h
                      ? span(e.c) + cellSize + gap / 2
                      : span(e.c) + cellSize / 2) -
                  edgeSignSize / 2,
              top: (e.orientation == EdgeOrientation.h
                      ? span(e.r) + cellSize / 2
                      : span(e.r) + cellSize + gap / 2) -
                  edgeSignSize / 2,
              child: EqNeBadge(
                sign: e.kind == EdgeKind.eq ? EdgeSign.eq : EdgeSign.ne,
                size: edgeSignSize,
              ),
            ),
        ],
      ),
    );
  }

  String _cellLabel(int r, int c, Cell v, bool given, bool error) {
    final symbol = v == 0 ? 'disc' : (v == 1 ? 'ring' : 'empty');
    return [
      'Row ${r + 1}, column ${c + 1}',
      symbol,
      if (given) 'given',
      if (error) 'error',
    ].join(', ');
  }
}

/// One board cell. Visual states (mirroring `Cell.tsx`):
///   • given  — sunken fill, no border, not tappable;
///   • error  — wrong-tint fill, 2px wrong border;
///   • filled — raised surface, soft cell shadow;
///   • empty  — raised surface, 1px hairline.
class _PlayCell extends StatefulWidget {
  const _PlayCell({
    super.key,
    required this.value,
    required this.isGiven,
    required this.isError,
    required this.size,
    required this.semanticLabel,
    this.onTap,
  });

  final Cell value;
  final bool isGiven;
  final bool isError;
  final double size;
  final String semanticLabel;
  final VoidCallback? onTap;

  @override
  State<_PlayCell> createState() => _PlayCellState();
}

class _PlayCellState extends State<_PlayCell> {
  bool _pressed = false;

  bool get _enabled => widget.onTap != null;

  void _setPressed(bool v) {
    if (!_enabled) return;
    if (_pressed != v) setState(() => _pressed = v);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final filled = widget.value != null;

    Color bg;
    BoxBorder? border;
    List<BoxShadow>? shadow;
    if (widget.isGiven) {
      bg = c.bgSunken;
      border = null;
    } else if (widget.isError) {
      bg = c.wrongTint;
      border = Border.all(color: c.wrong, width: 2);
    } else if (filled) {
      bg = c.surfaceRaised;
      border = null;
      shadow = context.halveShadows.cell;
    } else {
      bg = c.surfaceRaised;
      border = Border.all(color: c.hairline, width: 1);
    }

    final symbolSize = widget.size * 0.6;

    return Semantics(
      button: _enabled,
      label: widget.semanticLabel,
      child: GestureDetector(
        onTapDown: (_) => _setPressed(true),
        onTapUp: (_) => _setPressed(false),
        onTapCancel: () => _setPressed(false),
        onTap: widget.onTap,
        child: AnimatedScale(
          scale: _pressed ? 0.94 : 1.0,
          duration: const Duration(milliseconds: 100),
          curve: Curves.easeOut,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            curve: Curves.easeInOut,
            width: widget.size,
            height: widget.size,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: bg,
              border: border,
              borderRadius: AppRadii.cellR,
              boxShadow: shadow,
            ),
            child: widget.value == 0
                ? SymbolDisc(size: symbolSize)
                : widget.value == 1
                    ? SymbolRing(size: symbolSize)
                    : null,
          ),
        ),
      ),
    );
  }
}
