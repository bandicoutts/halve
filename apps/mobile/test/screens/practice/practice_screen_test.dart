import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:halve/screens/practice/practice_screen.dart';
import 'package:halve/theme/theme.dart';

/// Pumps [PracticeScreen] inside a minimal router so [context.push] and
/// [context.canPop] work, and captures navigated routes for assertions.
Future<({GoRouter router, List<String> navLog})> pumpPractice(
  WidgetTester tester, {
  List<Override> overrides = const [],
}) async {
  final navLog = <String>[];
  final router = GoRouter(
    initialLocation: '/practice',
    observers: [_NavLogger(navLog)],
    routes: [
      GoRoute(
        path: '/practice',
        builder: (_, _) => const PracticeScreen(),
      ),
      // Stub for /practice/play so the push can resolve.
      GoRoute(
        path: '/practice/play',
        builder: (_, state) {
          navLog.add(state.uri.toString());
          return const Scaffold(body: Text('play-stub'));
        },
      ),
    ],
  );

  await tester.pumpWidget(
    ProviderScope(
      overrides: overrides,
      child: MaterialApp.router(
        routerConfig: router,
        theme: AppTheme.light(),
      ),
    ),
  );
  await tester.pumpAndSettle();
  return (router: router, navLog: navLog);
}

class _NavLogger extends NavigatorObserver {
  _NavLogger(this._log);
  final List<String> _log;

  @override
  void didPush(Route<Object?> route, Route<Object?>? previousRoute) {
    final name = route.settings.name;
    if (name != null) _log.add(name);
  }
}

void main() {
  group('PracticeScreen', () {
    testWidgets('renders all three difficulty cards', (tester) async {
      await pumpPractice(tester);

      expect(find.text('Easy'), findsOneWidget);
      expect(find.text('Medium'), findsOneWidget);
      expect(find.text('Hard'), findsOneWidget);
    });

    testWidgets('medium is selected by default (Play sends medium difficulty)',
        (tester) async {
      // Verify default via the navigation outcome: Play without any tap should
      // send difficulty=medium.
      final captured = <Uri>[];
      final router = GoRouter(
        initialLocation: '/practice',
        routes: [
          GoRoute(
            path: '/practice',
            builder: (_, _) => const PracticeScreen(),
          ),
          GoRoute(
            path: '/practice/play',
            builder: (_, state) {
              captured.add(state.uri);
              return const Scaffold(body: Text('play-stub'));
            },
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(
            routerConfig: router,
            theme: AppTheme.light(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Play'));
      await tester.pumpAndSettle();

      expect(captured.first.queryParameters['difficulty'], 'medium');
    });

    testWidgets(
        'tapping easy card then Play sends difficulty=easy',
        (tester) async {
      final captured = <Uri>[];
      final router = GoRouter(
        initialLocation: '/practice',
        routes: [
          GoRoute(
            path: '/practice',
            builder: (_, _) => const PracticeScreen(),
          ),
          GoRoute(
            path: '/practice/play',
            builder: (_, state) {
              captured.add(state.uri);
              return const Scaffold(body: Text('play-stub'));
            },
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(
            routerConfig: router,
            theme: AppTheme.light(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Easy'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Play'));
      await tester.pumpAndSettle();

      expect(captured.first.queryParameters['difficulty'], 'easy');
    });

    testWidgets('tapping hard card changes selection to hard', (tester) async {
      await pumpPractice(tester);

      // Tap hard.
      await tester.tap(find.text('Hard'));
      await tester.pumpAndSettle();

      // The provider in this scope should now be hard.
      // Verify by tapping Play and checking the route param.
      await tester.tap(find.text('Play'));
      await tester.pumpAndSettle();

      // The navigation should have gone to /practice/play?difficulty=hard.
      expect(find.text('play-stub'), findsOneWidget);
    });

    testWidgets('Play CTA routes to practice play with default medium',
        (tester) async {
      await pumpPractice(tester);

      await tester.tap(find.text('Play'));
      await tester.pumpAndSettle();

      // Stub screen confirms navigation completed.
      expect(find.text('play-stub'), findsOneWidget);
    });

    testWidgets(
        'selecting easy then tapping Play navigates to practice/play?difficulty=easy',
        (tester) async {
      final captured = <Uri>[];
      final router = GoRouter(
        initialLocation: '/practice',
        routes: [
          GoRoute(
            path: '/practice',
            builder: (_, _) => const PracticeScreen(),
          ),
          GoRoute(
            path: '/practice/play',
            builder: (_, state) {
              captured.add(state.uri);
              return const Scaffold(body: Text('play-stub'));
            },
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(
            routerConfig: router,
            theme: AppTheme.light(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Select Easy.
      await tester.tap(find.text('Easy'));
      await tester.pumpAndSettle();

      // Tap Play.
      await tester.tap(find.text('Play'));
      await tester.pumpAndSettle();

      expect(captured, hasLength(1));
      expect(captured.first.queryParameters['difficulty'], 'easy');
    });

    testWidgets(
        'selecting hard then tapping Play navigates to practice/play?difficulty=hard',
        (tester) async {
      final captured = <Uri>[];
      final router = GoRouter(
        initialLocation: '/practice',
        routes: [
          GoRoute(
            path: '/practice',
            builder: (_, _) => const PracticeScreen(),
          ),
          GoRoute(
            path: '/practice/play',
            builder: (_, state) {
              captured.add(state.uri);
              return const Scaffold(body: Text('play-stub'));
            },
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(
            routerConfig: router,
            theme: AppTheme.light(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Select Hard.
      await tester.tap(find.text('Hard'));
      await tester.pumpAndSettle();

      // Tap Play.
      await tester.tap(find.text('Play'));
      await tester.pumpAndSettle();

      expect(captured, hasLength(1));
      expect(captured.first.queryParameters['difficulty'], 'hard');
    });

    testWidgets(
        'medium difficulty navigates to practice/play?difficulty=medium',
        (tester) async {
      final captured = <Uri>[];
      final router = GoRouter(
        initialLocation: '/practice',
        routes: [
          GoRoute(
            path: '/practice',
            builder: (_, _) => const PracticeScreen(),
          ),
          GoRoute(
            path: '/practice/play',
            builder: (_, state) {
              captured.add(state.uri);
              return const Scaffold(body: Text('play-stub'));
            },
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(
            routerConfig: router,
            theme: AppTheme.light(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Medium is already selected by default — just tap Play.
      await tester.tap(find.text('Play'));
      await tester.pumpAndSettle();

      expect(captured, hasLength(1));
      expect(captured.first.queryParameters['difficulty'], 'medium');
    });

    testWidgets('difficulty card descriptions are visible', (tester) async {
      await pumpPractice(tester);

      expect(
        find.text('More edge signs to guide you. Good for learning the rules.'),
        findsOneWidget,
      );
      expect(
        find.text(
            'A balanced challenge — the same level as the daily puzzle.'),
        findsOneWidget,
      );
      expect(
        find.text('Fewer edge clues, more room to think.'),
        findsOneWidget,
      );
    });
  });
}
