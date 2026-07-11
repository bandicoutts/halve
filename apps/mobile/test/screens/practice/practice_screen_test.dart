import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:halve/screens/practice/practice_screen.dart';
import 'package:halve/theme/theme.dart';

Future<({GoRouter router, List<Uri> navLog})> pumpPractice(
  WidgetTester tester,
) async {
  final navLog = <Uri>[];
  final router = GoRouter(
    initialLocation: '/practice',
    routes: [
      GoRoute(path: '/practice', builder: (_, _) => const PracticeScreen()),
      GoRoute(
        path: '/practice/play',
        builder: (_, state) {
          navLog.add(state.uri);
          return const Scaffold(body: Text('play-stub'));
        },
      ),
    ],
  );

  await tester.pumpWidget(
    ProviderScope(
      child: MaterialApp.router(routerConfig: router, theme: AppTheme.light()),
    ),
  );
  await tester.pumpAndSettle();
  return (router: router, navLog: navLog);
}

void main() {
  group('PracticeScreen', () {
    testWidgets('renders the prototype practice picker copy', (tester) async {
      await pumpPractice(tester);

      expect(find.text('PRACTICE · UNLIMITED'), findsOneWidget);
      expect(find.text('Off the record.'), findsOneWidget);
      expect(find.text('Easy'), findsOneWidget);
      expect(find.text('Medium'), findsOneWidget);
      expect(find.text('Hard'), findsOneWidget);
      expect(find.text('PLAY →'), findsNWidgets(3));
    });

    testWidgets('easy row routes to easy practice play', (tester) async {
      final result = await pumpPractice(tester);

      await tester.tap(find.text('Easy'));
      await tester.pumpAndSettle();

      expect(find.text('play-stub'), findsOneWidget);
      expect(result.navLog.single.queryParameters['difficulty'], 'easy');
    });

    testWidgets('medium row routes to medium practice play', (tester) async {
      final result = await pumpPractice(tester);

      await tester.tap(find.text('Medium'));
      await tester.pumpAndSettle();

      expect(find.text('play-stub'), findsOneWidget);
      expect(result.navLog.single.queryParameters['difficulty'], 'medium');
    });

    testWidgets('hard row routes to hard practice play', (tester) async {
      final result = await pumpPractice(tester);

      await tester.tap(find.text('Hard'));
      await tester.pumpAndSettle();

      expect(find.text('play-stub'), findsOneWidget);
      expect(result.navLog.single.queryParameters['difficulty'], 'hard');
    });

    testWidgets('difficulty descriptions are visible', (tester) async {
      await pumpPractice(tester);

      expect(
        find.text('A generous start - most of the logic is laid out for you.'),
        findsOneWidget,
      );
      expect(
        find.text("The daily's weight. Fewer footholds, steady deduction."),
        findsOneWidget,
      );
      expect(
        find.text('Sparse and slow-burning. Every placement is earned.'),
        findsOneWidget,
      );
    });
  });
}
