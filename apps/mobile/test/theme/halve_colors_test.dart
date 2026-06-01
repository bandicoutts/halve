import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:halve/theme/theme.dart';

void main() {
  group('HalveColors resolves per brightness', () {
    testWidgets('light theme exposes Paper tokens', (tester) async {
      late HalveColors c;
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: Builder(
            builder: (context) {
              c = context.halveColors;
              return const SizedBox();
            },
          ),
        ),
      );
      expect(c.bg, HalvePalette.paper100);
      expect(c.fg1, HalvePalette.ink900);
      expect(c.fg3, HalvePalette.clay550); // AA-compliant muted fg
      expect(c.accent, HalvePalette.amber);
      expect(c.symbolB, HalvePalette.teal);
    });

    testWidgets('dark theme exposes Ink tokens', (tester) async {
      late HalveColors c;
      late HalveShadows s;
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          darkTheme: AppTheme.dark(),
          themeMode: ThemeMode.dark,
          home: Builder(
            builder: (context) {
              c = context.halveColors;
              s = context.halveShadows;
              return const SizedBox();
            },
          ),
        ),
      );
      expect(c.bg, HalvePalette.night950);
      expect(c.fg1, HalvePalette.dust100);
      expect(c.fg3, HalvePalette.dust400);
      expect(c.accent, HalvePalette.amberBright);
      expect(c.symbolB, HalvePalette.tealBright); // shifts in dark
      // shadows resolve to the dark set
      expect(s.sm.first.color, const Color(0x66000000));
    });

    test('symbolA is identical across themes; symbolB shifts', () {
      expect(HalveColors.light.symbolA, HalveColors.dark.symbolA);
      expect(HalveColors.light.symbolB, isNot(HalveColors.dark.symbolB));
    });
  });
}
