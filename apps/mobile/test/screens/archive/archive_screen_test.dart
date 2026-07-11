import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:halve/data/models/models.dart';
import 'package:halve/screens/archive/archive_provider.dart';
import 'package:halve/screens/archive/archive_screen.dart';
import 'package:halve/theme/theme.dart';
import 'package:halve/widgets/widgets.dart';

ArchiveDay day(String date, Difficulty difficulty, {bool solved = false}) =>
    ArchiveDay(
      puzzleId: 'p-$date',
      date: date,
      difficulty: difficulty,
      solved: solved,
      durationMs: solved ? 60000 : null,
    );

/// A June-2026 archive that also reaches back to March (so the month range
/// spans March → June). today = 2026-06-15.
ArchiveData sampleData() => ArchiveData(
  today: '2026-06-15',
  days: [
    day('2026-03-20', Difficulty.medium, solved: true),
    day('2026-06-10', Difficulty.easy, solved: true),
    day('2026-06-11', Difficulty.hard), // missed
    day('2026-06-15', Difficulty.medium, solved: true), // today
  ],
);

Finder dayCell(String date) => find.byKey(ValueKey('arc-day-$date'));

BoxDecoration cellDecoration(WidgetTester tester, String date) {
  // The cell Container carries the key directly.
  final container = tester.widget<Container>(dayCell(date));
  return container.decoration! as BoxDecoration;
}

HalveIconButton navButton(WidgetTester tester, String label) =>
    tester.widget<HalveIconButton>(
      find.byWidgetPredicate(
        (w) => w is HalveIconButton && w.semanticLabel == label,
      ),
    );

Future<GoRouter> pumpArchive(
  WidgetTester tester, {
  required ArchiveData data,
}) async {
  final router = GoRouter(
    initialLocation: '/archive',
    routes: [
      GoRoute(path: '/archive', builder: (_, _) => const ArchiveScreen()),
      GoRoute(path: '/play', builder: (_, _) => const Text('PLAY-TODAY')),
      GoRoute(
        path: '/play/:date',
        builder: (_, s) => Text('PLAY-${s.pathParameters['date']}'),
      ),
    ],
  );

  await tester.pumpWidget(
    ProviderScope(
      overrides: [archiveDataProvider.overrideWith((ref) async => data)],
      child: MaterialApp.router(theme: AppTheme.light(), routerConfig: router),
    ),
  );
  await tester.pumpAndSettle();
  return router;
}

void main() {
  group('month helpers', () {
    test('monthsBetween spans inclusive, ascending, wrapping the year', () {
      expect(monthsBetween((2025, 11), (2026, 2)), [
        (2025, 11),
        (2025, 12),
        (2026, 1),
        (2026, 2),
      ]);
      expect(monthsBetween((2026, 6), (2026, 6)), [(2026, 6)]);
    });

    test('daysInMonth handles 30/31/leap-Feb', () {
      expect(daysInMonth(2026, 6), 30);
      expect(daysInMonth(2026, 7), 31);
      expect(daysInMonth(2024, 2), 29); // leap
      expect(daysInMonth(2026, 2), 28);
    });

    test('firstWeekdayOffset is Sunday-indexed', () {
      // 2026-06-01 is a Monday → one blank cell before it (Sunday = 0).
      expect(firstWeekdayOffset(2026, 6), 1);
    });

    test('prev/next month clamp at the range ends', () {
      expect(prevMonth((2026, 6), (2026, 6)), isNull);
      expect(prevMonth((2026, 6), (2026, 3)), (2026, 5));
      expect(nextMonth((2026, 6), (2026, 6)), isNull);
      expect(nextMonth((2026, 1), (2026, 6)), (2026, 2));
    });
  });

  group('ArchiveData', () {
    test('derives the month range and per-month counts', () {
      final data = sampleData();
      expect(data.months, [(2026, 3), (2026, 4), (2026, 5), (2026, 6)]);
      expect(data.currentMonth, (2026, 6));
      expect(data.monthStats((2026, 6)), (2, 3)); // 2 solved of 3
      expect(data.monthStats((2026, 3)), (1, 1));
    });
  });

  testWidgets('day cells render solved / missed / today states', (
    tester,
  ) async {
    await pumpArchive(tester, data: sampleData());

    expect(
      cellDecoration(tester, '2026-06-10').color,
      HalveColors.light.accent,
    ); // solved
    expect(
      (cellDecoration(tester, '2026-06-15').border! as Border).top.width,
      2.5,
    ); // today
    expect(
      (cellDecoration(tester, '2026-06-11').border! as Border).top.color,
      HalveColors.light.hairline2,
    ); // missed
  });

  testWidgets('prototype calendar removes difficulty dots from day cells', (
    tester,
  ) async {
    await pumpArchive(tester, data: sampleData());

    expect(
      find.descendant(
        of: dayCell('2026-06-10'),
        matching: find.byType(Container),
      ),
      findsNothing,
    );
    expect(
      find.descendant(
        of: dayCell('2026-06-11'),
        matching: find.byType(Container),
      ),
      findsNothing,
    );
  });

  testWidgets('month nav clamps next at the current month', (tester) async {
    await pumpArchive(tester, data: sampleData());

    // Default view is the current month (June) → next disabled, prev enabled.
    expect(find.textContaining('June 2026'), findsOneWidget);
    expect(navButton(tester, 'Next month').onPressed, isNull);
    expect(navButton(tester, 'Previous month').onPressed, isNotNull);

    // Step back to the oldest month → prev disabled, next enabled.
    for (var i = 0; i < 3; i++) {
      await tester.tap(find.bySemanticsLabel('Previous month'));
      await tester.pumpAndSettle();
    }
    expect(find.textContaining('March 2026'), findsOneWidget);
    expect(navButton(tester, 'Previous month').onPressed, isNull);
    expect(navButton(tester, 'Next month').onPressed, isNotNull);
  });

  testWidgets('the month picker lists months and jumps', (tester) async {
    await pumpArchive(tester, data: sampleData());

    await tester.tap(find.textContaining('June 2026'));
    await tester.pumpAndSettle();

    expect(find.text('March 2026'), findsOneWidget);
    await tester.tap(find.text('March 2026'));
    await tester.pumpAndSettle();

    expect(find.textContaining('March 2026'), findsOneWidget);
  });

  testWidgets('tapping a past solved day opens that archive puzzle', (
    tester,
  ) async {
    await pumpArchive(tester, data: sampleData());

    await tester.ensureVisible(dayCell('2026-06-10'));
    await tester.tap(dayCell('2026-06-10'));
    await tester.pumpAndSettle();

    expect(find.text('PLAY-2026-06-10'), findsOneWidget);
  });

  testWidgets("tapping today opens today's daily", (tester) async {
    await pumpArchive(tester, data: sampleData());

    await tester.drag(find.byType(ListView), const Offset(0, -180));
    await tester.pumpAndSettle();
    await tester.ensureVisible(dayCell('2026-06-15'));
    await tester.tap(dayCell('2026-06-15'));
    await tester.pumpAndSettle();

    expect(find.text('PLAY-TODAY'), findsOneWidget);
  });

  testWidgets('empty archive shows the notice', (tester) async {
    await pumpArchive(
      tester,
      data: ArchiveData(days: const [], today: '2026-06-15'),
    );
    expect(find.textContaining('No puzzles yet'), findsOneWidget);
  });
}
