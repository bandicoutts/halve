import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:halve/theme/theme.dart';
import 'package:halve/widgets/widgets.dart';

/// Wraps [child] in a themed, fixed-size harness so golden captures are
/// deterministic. The captured region is keyed by [_targetKey].
const _targetKey = Key('golden-target');

Widget _harness({required Brightness brightness, required Widget child}) {
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: brightness == Brightness.light ? AppTheme.light() : AppTheme.dark(),
    home: Builder(
      builder: (context) => Material(
        color: context.halveColors.bg,
        child: Center(
          child: RepaintBoundary(
            key: _targetKey,
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.s4),
              child: child,
            ),
          ),
        ),
      ),
    ),
  );
}

/// Registers a light + dark golden for [child] under `goldens/<name>_<mode>.png`.
void _goldenPair(String name, Widget child) {
  for (final b in Brightness.values) {
    final mode = b == Brightness.light ? 'light' : 'dark';
    testWidgets('$name ($mode)', (tester) async {
      await tester.pumpWidget(_harness(brightness: b, child: child));
      await tester.pumpAndSettle();
      await expectLater(
        find.byKey(_targetKey),
        matchesGoldenFile('goldens/${name}_$mode.png'),
      );
    });
  }
}

void main() {
  _goldenPair('symbol_disc', const SymbolDisc(size: 80));
  _goldenPair('symbol_ring', const SymbolRing(size: 80));
  _goldenPair('eqne_eq', const EqNeBadge(sign: EdgeSign.eq, size: 44));
  _goldenPair('eqne_ne', const EqNeBadge(sign: EdgeSign.ne, size: 44));
  _goldenPair(
    'button_primary',
    const HalveButton(label: 'Play today', onPressed: _noop),
  );
  _goldenPair(
    'button_secondary',
    const HalveButton(
      label: 'How to play',
      variant: HalveButtonVariant.secondary,
      onPressed: _noop,
    ),
  );
}

void _noop() {}
