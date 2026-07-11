import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:halve/data/models/models.dart';
import 'package:halve/screens/stats/stats_provider.dart';
import 'package:halve/screens/stats/stats_screen.dart';
import 'package:halve/theme/theme.dart';
import 'package:halve/widgets/widgets.dart';

// ─── Helpers ─────────────────────────────────────────────────────────────────

SolveRow solve(String localDate, {int durationMs = 180000}) => SolveRow(
  solvedAt: DateTime.parse('${localDate}T12:00:00Z'),
  durationMs: durationMs,
  usedHint: false,
  localDate: localDate,
);

Stats statsFromDays(
  List<String> days,
  String today, {
  int durationMs = 180000,
}) => Stats.fromSolves([
  for (final d in days) solve(d, durationMs: durationMs),
], today: today);

Future<void> pumpStats(WidgetTester tester, {required StatsData data}) async {
  final router = GoRouter(
    initialLocation: '/stats',
    routes: [
      GoRoute(path: '/stats', builder: (_, _) => const StatsScreen()),
      GoRoute(path: '/auth', builder: (_, _) => const Text('AUTH')),
      GoRoute(path: '/', builder: (_, _) => const Text('HOME')),
    ],
  );

  await tester.pumpWidget(
    ProviderScope(
      overrides: [statsDataProvider.overrideWith((ref) async => data)],
      child: MaterialApp.router(theme: AppTheme.light(), routerConfig: router),
    ),
  );
  await tester.pumpAndSettle();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

void main() {
  group('StatsScreen — signed-out', () {
    testWidgets('shows sign-in CTA and mark', (tester) async {
      await pumpStats(
        tester,
        data: const StatsData(signedIn: false, today: '2026-06-01'),
      );

      expect(find.text('Start your record'), findsOneWidget);
      expect(find.text('Sign in'), findsOneWidget);
      expect(find.byType(HalveMark), findsWidgets);
    });

    testWidgets('sign-in button routes to /auth', (tester) async {
      await pumpStats(
        tester,
        data: const StatsData(signedIn: false, today: '2026-06-01'),
      );

      await tester.tap(find.text('Sign in'));
      await tester.pumpAndSettle();

      expect(find.text('AUTH'), findsOneWidget);
    });
  });

  group('StatsScreen — loading', () {
    testWidgets('shows skeleton tiles while loading', (tester) async {
      final router = GoRouter(
        initialLocation: '/stats',
        routes: [
          GoRoute(path: '/stats', builder: (_, _) => const StatsScreen()),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            // A Completer that is never completed — no pending timer.
            statsDataProvider.overrideWith(
              (ref) => Completer<StatsData>().future,
            ),
          ],
          child: MaterialApp.router(
            theme: AppTheme.light(),
            routerConfig: router,
          ),
        ),
      );
      // Two pumps: first for the router, second for Riverpod's async frame.
      await tester.pump();
      await tester.pump();

      expect(find.byType(Skeleton), findsWidgets);
    });
  });

  group('StatsScreen — signed-in', () {
    testWidgets('shows streak hero with headline values', (tester) async {
      final stats = statsFromDays([
        '2026-05-29',
        '2026-05-30',
        '2026-05-31',
        '2026-06-01',
      ], '2026-06-01');

      await pumpStats(
        tester,
        data: StatsData(
          signedIn: true,
          today: '2026-06-01',
          stats: stats,
          displayName: 'alice',
        ),
      );

      // Streak tiles via ValueKeys
      final streakFinder = find.byKey(const ValueKey('stat-streak'));
      expect(streakFinder, findsOneWidget);
      expect((tester.widget(streakFinder) as Text).data, '4');

      final longestFinder = find.byKey(const ValueKey('stat-longest'));
      expect(longestFinder, findsOneWidget);
      expect((tester.widget(longestFinder) as Text).data, 'BEST EVER 4');
    });

    testWidgets('shows displayName in identity row', (tester) async {
      final stats = statsFromDays(['2026-06-01'], '2026-06-01');

      await pumpStats(
        tester,
        data: StatsData(
          signedIn: true,
          today: '2026-06-01',
          stats: stats,
          displayName: 'alice',
        ),
      );

      expect(find.text('alice'), findsOneWidget);
    });

    testWidgets('shows average and best time tiles when solves exist', (
      tester,
    ) async {
      final stats = statsFromDays(
        ['2026-05-31', '2026-06-01'],
        '2026-06-01',
        durationMs: 180000, // 3:00
      );

      await pumpStats(
        tester,
        data: StatsData(
          signedIn: true,
          today: '2026-06-01',
          stats: stats,
          displayName: 'alice',
        ),
      );

      expect(find.byKey(const ValueKey('stat-tile-Average')), findsOneWidget);
      expect(find.byKey(const ValueKey('stat-tile-Best time')), findsOneWidget);
    });

    testWidgets('shows empty-state nudge when no solves', (tester) async {
      final stats = Stats.fromSolves([], today: '2026-06-01');

      await pumpStats(
        tester,
        data: StatsData(
          signedIn: true,
          today: '2026-06-01',
          stats: stats,
          displayName: 'alice',
        ),
      );

      expect(find.text('Solve your first puzzle'), findsOneWidget);
    });

    testWidgets('does NOT show solve chart in empty state', (tester) async {
      final stats = Stats.fromSolves([], today: '2026-06-01');

      await pumpStats(
        tester,
        data: StatsData(
          signedIn: true,
          today: '2026-06-01',
          stats: stats,
          displayName: 'alice',
        ),
      );

      expect(find.byKey(const ValueKey('stat-tile-Average')), findsNothing);
    });

    testWidgets('shows sign-out button', (tester) async {
      final stats = statsFromDays(['2026-06-01'], '2026-06-01');

      await pumpStats(
        tester,
        data: StatsData(
          signedIn: true,
          today: '2026-06-01',
          stats: stats,
          displayName: 'alice',
        ),
      );

      expect(find.text('Sign out'), findsOneWidget);
    });
  });
}
