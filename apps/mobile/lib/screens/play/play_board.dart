import 'package:flutter/material.dart';

import '../../data/models/models.dart';
import '../../engine/validator.dart' show Coord;
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';

/// The 6×6 play surface: a raw bordered square grid with `=`/`≠` edge signs
/// floating over the lines, matching the mobile prototype. Pure presentation —
/// state lives in the [PlayController].
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
    final total = n * cellSize;
    double span(int i) => i * cellSize;
    final edgeSignSize = (cellSize * 0.42).clamp(20.0, double.infinity);
    final c = context.halveColors;

    return Container(
      width: total,
      height: total,
      decoration: BoxDecoration(border: Border.all(color: c.hairline)),
      child: Stack(
        children: [
          for (var r = 0; r < n; r++)
            for (var col = 0; col < n; col++)
              Positioned(
                left: span(col),
                top: span(r),
                child: _PlayCell(
                  key: ValueKey('cell-$r-$col'),
                  value: cells[r][col],
                  isGiven: givens[r][col] != null,
                  isError: violations.contains((r, col)),
                  size: cellSize,
                  showRightBorder: col < n - 1,
                  showBottomBorder: r < n - 1,
                  onTap: readOnly || givens[r][col] != null
                      ? null
                      : () => onCellTap?.call(r, col),
                  semanticLabel: _cellLabel(
                    r,
                    col,
                    cells[r][col],
                    givens[r][col] != null,
                    violations.contains((r, col)),
                  ),
                ),
              ),
          for (final e in edges)
            Positioned(
              left:
                  (e.orientation == EdgeOrientation.h
                      ? span(e.c + 1)
                      : span(e.c) + cellSize / 2) -
                  edgeSignSize / 2,
              top:
                  (e.orientation == EdgeOrientation.h
                      ? span(e.r) + cellSize / 2
                      : span(e.r + 1)) -
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
    required this.showRightBorder,
    required this.showBottomBorder,
    required this.semanticLabel,
    this.onTap,
  });

  final Cell value;
  final bool isGiven;
  final bool isError;
  final double size;
  final bool showRightBorder;
  final bool showBottomBorder;
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
    final symbolSize = widget.size * 0.6;
    final cellBorder = Border(
      right: widget.showRightBorder
          ? BorderSide(color: c.hairline)
          : BorderSide.none,
      bottom: widget.showBottomBorder
          ? BorderSide(color: c.hairline)
          : BorderSide.none,
    );

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
              color: widget.isError
                  ? c.wrongTint
                  : widget.isGiven
                  ? c.bgSunken.withValues(alpha: 0.7)
                  : Colors.transparent,
              border: cellBorder,
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                if (widget.isGiven)
                  Positioned.fill(
                    child: FractionallySizedBox(
                      widthFactor: 0.82,
                      heightFactor: 0.82,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: c.bgSunken,
                          borderRadius: AppRadii.mdR,
                        ),
                      ),
                    ),
                  ),
                if (widget.value == 0)
                  SymbolDisc(size: symbolSize)
                else if (widget.value == 1)
                  SymbolRing(size: symbolSize),
                if (widget.isError)
                  Positioned(
                    bottom: widget.size * 0.08,
                    child: Container(
                      width: 5,
                      height: 5,
                      decoration: BoxDecoration(
                        color: c.wrong,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
