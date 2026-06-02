import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:halve/screens/tutorial/tut_fixture.dart';
import 'package:halve/screens/tutorial/tutorial_flow.dart';
import 'package:halve/theme/theme.dart';
import 'package:halve/widgets/widgets.dart';

Finder tutCell(int r, int c) => find.byKey(ValueKey('tut-cell-$r-$c'));

BoxDecoration tutDecoration(WidgetTester tester, int r, int c) {
  final container = tester.widget<AnimatedContainer>(
    find.descendant(of: tutCell(r, c), matching: find.byType(AnimatedContainer)),
  );
  return container.decoration! as BoxDecoration;
}

Future<void> pumpFlow(
  WidgetTester tester, {
  VoidCallback? onComplete,
  VoidCallback? onSkip,
}) async {
  await tester.pumpWidget(
    MediaQuery(
      data: const MediaQueryData(disableAnimations: true),
      child: MaterialApp(
        theme: AppTheme.light(),
        home: TutorialFlow(
          onSkip: onSkip ?? () {},
          onComplete: onComplete ?? () {},
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

/// Advance the four lesson steps to the guided solve (step 4, phase 0).
Future<void> toGuided(WidgetTester tester) async {
  for (final label in ['Next', 'Next', 'Next', 'Got it']) {
    await tester.tap(find.text(label));
    await tester.pumpAndSettle();
  }
}

/// Tap an empty cell up to its target symbol (empty→0 is one tap, →1 is two).
Future<void> setCell(WidgetTester tester, int r, int c, int target) async {
  final taps = target == 0 ? 1 : 2;
  for (var i = 0; i < taps; i++) {
    await tester.ensureVisible(tutCell(r, c));
    await tester.tap(tutCell(r, c));
    await tester.pump();
  }
}

void main() {
  testWidgets('walks the lesson steps into the guided solve', (tester) async {
    await pumpFlow(tester);

    expect(find.text('Two symbols'), findsOneWidget);
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();
    expect(find.text('No crowding'), findsOneWidget);
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();
    expect(find.text('Half and half'), findsOneWidget);
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();
    expect(find.text('Read the edges'), findsOneWidget);
    await tester.tap(find.text('Got it'));
    await tester.pumpAndSettle();

    expect(find.text('Your turn'), findsOneWidget);
    expect(find.text('Tap the highlighted square'), findsOneWidget);
  });

  testWidgets('the guided move is the only tappable cell, and it advances',
      (tester) async {
    await pumpFlow(tester);
    await toGuided(tester);

    // A non-guide empty cell does nothing in phase 0.
    await tester.ensureVisible(tutCell(0, 2));
    await tester.tap(tutCell(0, 2));
    await tester.pump();
    expect(find.text('Tap the highlighted square'), findsOneWidget);

    // Tapping the guide cell places the ring and moves to the free solve.
    await tester.ensureVisible(tutCell(Tut4.guide.r, Tut4.guide.c));
    await tester.tap(tutCell(Tut4.guide.r, Tut4.guide.c));
    await tester.pumpAndSettle();

    expect(find.text('Finish it'), findsOneWidget);
    expect(
      find.descendant(
          of: tutCell(Tut4.guide.r, Tut4.guide.c),
          matching: find.byType(SymbolRing)),
      findsOneWidget,
    );
  });

  testWidgets('live validator feedback tints a conflicting cell',
      (tester) async {
    await pumpFlow(tester);
    await toGuided(tester);

    // Enter the guided move first.
    await tester.ensureVisible(tutCell(Tut4.guide.r, Tut4.guide.c));
    await tester.tap(tutCell(Tut4.guide.r, Tut4.guide.c));
    await tester.pumpAndSettle();

    // Row 1 already holds two rings (given (1,1) + guided (1,0)); forcing a
    // third at (1,3) overruns the balance → that cell tints wrong.
    await setCell(tester, 1, 3, 1);
    await tester.pumpAndSettle();

    expect(tutDecoration(tester, 1, 3).color, HalveColors.light.wrongTint);
  });

  testWidgets('completing the solve fires onComplete', (tester) async {
    var completed = false;
    await pumpFlow(tester, onComplete: () => completed = true);
    await toGuided(tester);

    // Place the guided move, then fill the remaining empties to the solution.
    await tester.ensureVisible(tutCell(Tut4.guide.r, Tut4.guide.c));
    await tester.tap(tutCell(Tut4.guide.r, Tut4.guide.c));
    await tester.pumpAndSettle();

    await setCell(tester, 0, 2, Tut4.solution[0][2]); // 1
    await setCell(tester, 1, 3, Tut4.solution[1][3]); // 0
    await setCell(tester, 2, 1, Tut4.solution[2][1]); // 1
    await setCell(tester, 2, 3, Tut4.solution[2][3]); // 0
    await setCell(tester, 3, 1, Tut4.solution[3][1]); // 0
    await setCell(tester, 3, 2, Tut4.solution[3][2]); // 0
    await tester.pumpAndSettle();

    expect(completed, isTrue);
  });
}
