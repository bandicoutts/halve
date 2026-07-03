import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:halve/data/models/models.dart';
import 'package:halve/data/repositories/solve_repository.dart';
import 'package:halve/providers/providers.dart';
import 'package:halve/screens/play/play_board.dart';
import 'package:halve/screens/play/play_provider.dart';
import 'package:halve/screens/play/play_screen.dart';
import 'package:halve/screens/win/win_screen.dart';
import 'package:halve/theme/theme.dart';
import 'package:halve/widgets/widgets.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class MockSolveRepository extends Mock implements SolveRepository {}

class MockUser extends Mock implements User {}

/// A checkerboard 6×6 solution `(r + c) % 2`, with [emptyCells] left null in
/// the givens (all other cells given). No edges → solving = filling the
/// empties with their solution values.
Puzzle puzzle({
  String id = 'p-1',
  Difficulty difficulty = Difficulty.medium,
  Set<(int, int)> emptyCells = const {},
}) {
  return Puzzle.tryParse(
    id: id,
    difficulty: difficulty.wire,
    gridSpec: {
      'solution': [
        for (var r = 0; r < 6; r++) [for (var c = 0; c < 6; c++) (r + c) % 2],
      ],
      'givens': [
        for (var r = 0; r < 6; r++)
          [
            for (var c = 0; c < 6; c++)
              emptyCells.contains((r, c)) ? null : (r + c) % 2,
          ],
      ],
      'edges': const <Map<String, Object?>>[],
    },
  )!;
}

/// A fully-empty board (no givens) — used to force violations.
Puzzle emptyPuzzle() => puzzle(
  emptyCells: {
    for (var r = 0; r < 6; r++)
      for (var c = 0; c < 6; c++) (r, c),
  },
);

Finder cell(int r, int c) => find.byKey(ValueKey('cell-$r-$c'));

Finder discIn(int r, int c) =>
    find.descendant(of: cell(r, c), matching: find.byType(SymbolDisc));
Finder ringIn(int r, int c) =>
    find.descendant(of: cell(r, c), matching: find.byType(SymbolRing));

BoxDecoration decorationOf(WidgetTester tester, int r, int c) {
  final container = tester.widget<AnimatedContainer>(
    find.descendant(of: cell(r, c), matching: find.byType(AnimatedContainer)),
  );
  return container.decoration! as BoxDecoration;
}

/// Pumps PlayScreen for [load] inside a router that also hosts the Win route,
/// so the solve hand-off can navigate. Animations disabled → no 520ms swell.
Future<GoRouter> pumpPlay(
  WidgetTester tester, {
  required PlayLoad load,
  required List<Override> overrides,
}) async {
  final router = GoRouter(
    initialLocation: '/play',
    routes: [
      GoRoute(path: '/play', builder: (_, _) => const PlayScreen()),
      GoRoute(
        path: '/win',
        builder: (_, state) => WinScreen(
          result: state.extra is PlayResult ? state.extra! as PlayResult : null,
        ),
      ),
      GoRoute(path: '/', builder: (_, _) => const SizedBox.shrink()),
      GoRoute(path: '/stats', builder: (_, _) => const SizedBox.shrink()),
      GoRoute(path: '/tutorial', builder: (_, _) => const SizedBox.shrink()),
    ],
  );

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        playLoadProvider.overrideWith((ref, args) async => load),
        ...overrides,
      ],
      child: MediaQuery(
        data: const MediaQueryData(disableAnimations: true),
        child: MaterialApp.router(
          theme: AppTheme.light(),
          routerConfig: router,
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();
  return router;
}

/// Like [pumpPlay] but does NOT inject a [playLoadProvider] override — callers
/// supply their own via [overrides] to test loading/error/retry states.
Future<void> pumpPlayRaw(
  WidgetTester tester, {
  required List<Override> overrides,
}) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: overrides,
      child: MediaQuery(
        data: const MediaQueryData(disableAnimations: true),
        child: MaterialApp.router(
          theme: AppTheme.light(),
          routerConfig: GoRouter(
            initialLocation: '/play',
            routes: [
              GoRoute(path: '/play', builder: (_, _) => const PlayScreen()),
              GoRoute(path: '/', builder: (_, _) => const SizedBox.shrink()),
              GoRoute(
                path: '/tutorial',
                builder: (_, _) => const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

void main() {
  late MockSolveRepository solveRepo;

  setUp(() {
    solveRepo = MockSolveRepository();
    registerFallbackValue(<List<int?>>[]);
  });

  PlayLoad dailyLoad(Puzzle p) => PlayLoad(
    puzzle: p,
    kind: PlayKind.daily,
    localDate: '2026-06-01',
    puzzleId: p.id,
  );

  testWidgets('tap cycles a cell empty → disc → ring → empty', (tester) async {
    await pumpPlay(
      tester,
      load: dailyLoad(emptyPuzzle()),
      overrides: [currentUserProvider.overrideWithValue(null)],
    );

    expect(discIn(0, 0), findsNothing);
    expect(ringIn(0, 0), findsNothing);

    await tester.tap(cell(0, 0));
    await tester.pump();
    expect(discIn(0, 0), findsOneWidget);

    await tester.tap(cell(0, 0));
    await tester.pump();
    expect(ringIn(0, 0), findsOneWidget);

    await tester.tap(cell(0, 0));
    await tester.pump();
    expect(discIn(0, 0), findsNothing);
    expect(ringIn(0, 0), findsNothing);

    await _disposeTree(tester); // cancel the running timer
  });

  testWidgets('a forced three-in-a-row highlights the offending cells', (
    tester,
  ) async {
    await pumpPlay(
      tester,
      load: dailyLoad(emptyPuzzle()),
      overrides: [currentUserProvider.overrideWithValue(null)],
    );

    // Three discs in a row → adjacency violation on (0,0),(0,1),(0,2).
    for (final c in [0, 1, 2]) {
      await tester.tap(cell(0, c));
      await tester.pump();
    }

    expect(decorationOf(tester, 0, 0).color, HalveColors.light.wrongTint);
    expect(decorationOf(tester, 0, 1).color, HalveColors.light.wrongTint);
    expect(decorationOf(tester, 0, 2).color, HalveColors.light.wrongTint);
    // An uninvolved empty cell stays on the raised surface.
    expect(decorationOf(tester, 3, 3).color, HalveColors.light.surfaceRaised);

    await _disposeTree(tester);
  });

  testWidgets('undo reverts the last move', (tester) async {
    await pumpPlay(
      tester,
      load: dailyLoad(emptyPuzzle()),
      overrides: [currentUserProvider.overrideWithValue(null)],
    );

    await tester.tap(cell(0, 0));
    await tester.pump();
    expect(discIn(0, 0), findsOneWidget);

    await tester.tap(find.bySemanticsLabel('Undo'));
    await tester.pump();
    expect(discIn(0, 0), findsNothing);

    await _disposeTree(tester);
  });

  testWidgets('hint fills the empty cell, flags usedHint, and records it', (
    tester,
  ) async {
    // One empty cell at (0,1) whose solution value is 1 (ring).
    final p = puzzle(emptyCells: {(0, 1)});
    final user = MockUser();
    when(() => user.id).thenReturn('u1');
    when(
      () => solveRepo.recordSolve(
        puzzleId: any(named: 'puzzleId'),
        grid: any(named: 'grid'),
        durationMs: any(named: 'durationMs'),
        usedHint: any(named: 'usedHint'),
        localDate: any(named: 'localDate'),
      ),
    ).thenAnswer((_) async => const RecordSolveResult(ok: true));

    await pumpPlay(
      tester,
      load: dailyLoad(p),
      overrides: [
        currentUserProvider.overrideWithValue(user),
        solveRepositoryProvider.overrideWithValue(solveRepo),
      ],
    );

    await tester.tap(find.bySemanticsLabel('Hint'));
    await tester.pumpAndSettle();

    // Filling the only empty cell completes & solves the board → records with
    // usedHint:true, then hands off to the Win screen.
    final captured = verify(
      () => solveRepo.recordSolve(
        puzzleId: 'p-1',
        grid: any(named: 'grid'),
        durationMs: any(named: 'durationMs'),
        usedHint: captureAny(named: 'usedHint'),
        localDate: '2026-06-01',
      ),
    ).captured;
    expect(captured.single, isTrue);
    expect(find.byType(WinScreen), findsOneWidget);
  });

  testWidgets('completing the grid records the solve and shows Win', (
    tester,
  ) async {
    // Two empties: (0,0)→disc(0), (0,1)→ring(1).
    final p = puzzle(emptyCells: {(0, 0), (0, 1)});
    final user = MockUser();
    when(() => user.id).thenReturn('u1');
    when(
      () => solveRepo.recordSolve(
        puzzleId: any(named: 'puzzleId'),
        grid: any(named: 'grid'),
        durationMs: any(named: 'durationMs'),
        usedHint: any(named: 'usedHint'),
        localDate: any(named: 'localDate'),
      ),
    ).thenAnswer((_) async => const RecordSolveResult(ok: true));

    await pumpPlay(
      tester,
      load: dailyLoad(p),
      overrides: [
        currentUserProvider.overrideWithValue(user),
        solveRepositoryProvider.overrideWithValue(solveRepo),
      ],
    );

    await tester.tap(cell(0, 0)); // → disc
    await tester.pump();
    await tester.tap(cell(0, 1)); // → disc
    await tester.pump();
    await tester.tap(cell(0, 1)); // → ring → solved
    await tester.pumpAndSettle();

    verify(
      () => solveRepo.recordSolve(
        puzzleId: 'p-1',
        grid: any(named: 'grid'),
        durationMs: any(named: 'durationMs'),
        usedHint: false,
        localDate: '2026-06-01',
      ),
    ).called(1);
    expect(find.byType(WinScreen), findsOneWidget);
  });

  testWidgets('practice solves are NOT recorded', (tester) async {
    final p = puzzle(id: 'pr-1', emptyCells: {(0, 1)});
    final user = MockUser();
    when(() => user.id).thenReturn('u1');

    await pumpPlay(
      tester,
      load: PlayLoad(
        puzzle: p,
        kind: PlayKind.practice,
        localDate: '2026-06-01',
        puzzleId: null, // practice → never recorded
      ),
      overrides: [
        currentUserProvider.overrideWithValue(user),
        solveRepositoryProvider.overrideWithValue(solveRepo),
      ],
    );

    await tester.tap(find.bySemanticsLabel('Hint'));
    await tester.pumpAndSettle();

    verifyNever(
      () => solveRepo.recordSolve(
        puzzleId: any(named: 'puzzleId'),
        grid: any(named: 'grid'),
        durationMs: any(named: 'durationMs'),
        usedHint: any(named: 'usedHint'),
        localDate: any(named: 'localDate'),
      ),
    );
    expect(find.byType(WinScreen), findsOneWidget);
  });

  testWidgets('loading — spinner visible while the future is pending', (
    tester,
  ) async {
    final completer = Completer<PlayLoad>();

    await pumpPlayRaw(
      tester,
      overrides: [
        playLoadProvider.overrideWith((ref, args) => completer.future),
        currentUserProvider.overrideWithValue(null),
      ],
    );
    await tester.pump(); // one frame — future still pending

    // CircularProgressIndicator.adaptive() renders as CircularProgressIndicator
    // on Android/Linux and CupertinoActivityIndicator on iOS/macOS.
    expect(
      find.byWidgetPredicate(
        (w) =>
            w is CircularProgressIndicator || w is CupertinoActivityIndicator,
      ),
      findsOneWidget,
    );
    expect(find.text('Reload'), findsNothing);

    completer.completeError(Exception('teardown'));
  });

  testWidgets('error — _UnavailableView shown when the load throws', (
    tester,
  ) async {
    await pumpPlayRaw(
      tester,
      overrides: [
        playLoadProvider.overrideWith(
          (ref, args) => Future<PlayLoad>.error(Exception('unavailable')),
        ),
        currentUserProvider.overrideWithValue(null),
      ],
    );
    await tester.pumpAndSettle();

    expect(find.text('Reload'), findsOneWidget);
    expect(find.textContaining('unavailable'), findsOneWidget);
    expect(find.byType(PlayBoard), findsNothing);
  });

  testWidgets(
    'retry — tapping Reload invalidates the provider and re-loads the board',
    (tester) async {
      var attempt = 0;
      // Pre-complete the completer so the retry future resolves immediately,
      // landing straight in the data state without a loading-spinner frame that
      // would cause pumpAndSettle to spin indefinitely.
      final completer = Completer<PlayLoad>()..complete(dailyLoad(puzzle()));

      await pumpPlayRaw(
        tester,
        overrides: [
          playLoadProvider.overrideWith((ref, args) {
            if (attempt++ == 0) {
              return Future<PlayLoad>.error(Exception('unavailable'));
            }
            return completer.future;
          }),
          currentUserProvider.overrideWithValue(null),
        ],
      );
      await tester.pumpAndSettle(); // settle into error state

      expect(find.text('Reload'), findsOneWidget);
      expect(find.byType(PlayBoard), findsNothing);

      await tester.tap(find.text('Reload'));
      await tester.pumpAndSettle();

      // Provider was re-invoked and resolved: board is visible, error view is gone.
      expect(find.text('Reload'), findsNothing);
      expect(find.byType(PlayBoard), findsOneWidget);
    },
  );

  testWidgets('play hides the live timer and shows placed-count progress', (
    tester,
  ) async {
    await pumpPlay(
      tester,
      load: dailyLoad(emptyPuzzle()),
      overrides: [currentUserProvider.overrideWithValue(null)],
    );

    expect(find.text('0:00'), findsNothing);
    expect(find.text('0 / 36'), findsOneWidget);

    await tester.pump(const Duration(seconds: 2));
    expect(find.text('0:00'), findsNothing);

    await tester.tap(cell(0, 0));
    await tester.pump();
    expect(find.text('1 / 36'), findsOneWidget);
    expect(find.text('0:01'), findsNothing);

    await _disposeTree(tester); // cancel the running timer
  });

  testWidgets('restart returns the board to the starting givens', (
    tester,
  ) async {
    await pumpPlay(
      tester,
      load: dailyLoad(emptyPuzzle()),
      overrides: [currentUserProvider.overrideWithValue(null)],
    );

    await tester.tap(cell(0, 0));
    await tester.pump();
    expect(discIn(0, 0), findsOneWidget);
    expect(find.text('1 / 36'), findsOneWidget);

    await tester.tap(find.bySemanticsLabel('Restart'));
    await tester.pump();

    expect(discIn(0, 0), findsNothing);
    expect(ringIn(0, 0), findsNothing);
    expect(find.text('0 / 36'), findsOneWidget);

    await _disposeTree(tester);
  });
}

/// Unmounts the widget tree, disposing the autoDispose [PlayController] so its
/// `ref.onDispose` cancels the count-up timer — otherwise the test environment
/// fails on a pending periodic timer.
Future<void> _disposeTree(WidgetTester tester) async {
  await tester.pumpWidget(const SizedBox.shrink());
  await tester.pump();
}
