import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:halve/data/local_date.dart';
import 'package:halve/data/models/models.dart';
import 'package:halve/data/puzzle_cache.dart';
import 'package:halve/data/repositories/puzzle_repository.dart';
import 'package:halve/data/repositories/solve_repository.dart';
import 'package:halve/data/streak.dart';
import 'package:halve/providers/providers.dart';
import 'package:halve/screens/home/home_screen.dart';
import 'package:halve/theme/theme.dart';
import 'package:halve/widgets/widgets.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class MockPuzzleRepository extends Mock implements PuzzleRepository {}

class MockSolveRepository extends Mock implements SolveRepository {}

class MockUser extends Mock implements User {}

/// A valid 6×6 puzzle (the validator/solver rules aren't checked by tryParse —
/// only structural validity is). Checkerboard solution, no givens, no edges.
Puzzle samplePuzzle({
  String id = 'p-today',
  Difficulty difficulty = Difficulty.medium,
}) {
  return Puzzle.tryParse(
    id: id,
    difficulty: difficulty.wire,
    gridSpec: {
      'solution': [for (var r = 0; r < 6; r++) [for (var c = 0; c < 6; c++) (r + c) % 2]],
      'givens': [for (var r = 0; r < 6; r++) [for (var c = 0; c < 6; c++) null]],
      'edges': const <Map<String, Object?>>[],
    },
  )!;
}

SolveRow solveOn(String day, {int durationMs = 95000}) => SolveRow(
      solvedAt: DateTime.parse('${day}T12:00:00Z'),
      durationMs: durationMs,
      usedHint: false,
      localDate: day,
    );

Future<void> pumpHome(
  WidgetTester tester, {
  required List<Override> overrides,
}) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: overrides,
      child: MaterialApp(
        theme: AppTheme.light(),
        home: const HomeScreen(),
      ),
    ),
  );
}

void main() {
  final today = localToday();
  final yesterday = offsetDay(today, -1);

  late MockPuzzleRepository puzzleRepo;
  late MockSolveRepository solveRepo;

  setUp(() {
    puzzleRepo = MockPuzzleRepository();
    solveRepo = MockSolveRepository();
  });

  List<Override> baseOverrides({
    required User? user,
    PuzzleCache? cache,
  }) =>
      [
        puzzleRepositoryProvider.overrideWithValue(puzzleRepo),
        solveRepositoryProvider.overrideWithValue(solveRepo),
        currentUserProvider.overrideWithValue(user),
        puzzleCacheProvider.overrideWithValue(cache ?? InMemoryPuzzleCache()),
      ];

  void stubArchive() {
    when(() => puzzleRepo.fetchArchive(any())).thenAnswer(
      (_) async => [
        ArchiveDay(puzzleId: 'p-yest', date: yesterday, difficulty: Difficulty.hard),
        ArchiveDay(puzzleId: 'p-today', date: today, difficulty: Difficulty.medium),
      ],
    );
  }

  testWidgets('normal — Play today CTA, no streak band when signed out',
      (tester) async {
    when(() => puzzleRepo.fetchDaily(any())).thenAnswer((_) async => samplePuzzle());
    stubArchive();

    await pumpHome(tester, overrides: baseOverrides(user: null));
    await tester.pumpAndSettle();

    expect(find.text("Today's puzzle"), findsOneWidget);
    expect(find.text('Play today'), findsOneWidget);
    expect(find.byType(FlameIcon), findsNothing); // no streak band signed-out
    // Archive card subtitle reflects count + yesterday's difficulty.
    expect(find.textContaining('· last hard'), findsOneWidget);
  });

  testWidgets('solved-today — confirmation block + stats CTA, no Play today',
      (tester) async {
    final user = MockUser();
    when(() => user.id).thenReturn('u1');
    when(() => puzzleRepo.fetchDaily(any())).thenAnswer((_) async => samplePuzzle());
    stubArchive();
    when(() => solveRepo.fetchSolves('u1'))
        .thenAnswer((_) async => [solveOn(today, durationMs: 95000)]);

    await pumpHome(tester, overrides: baseOverrides(user: user));
    await tester.pumpAndSettle();

    expect(find.text('Next puzzle at midnight'), findsOneWidget);
    expect(find.text('See your stats'), findsOneWidget);
    expect(find.text('Play today'), findsNothing);
    expect(find.textContaining('1:35', findRichText: true), findsOneWidget);
  });

  testWidgets('streak band — flame + "N day streak" when signed-in & streak>0',
      (tester) async {
    final user = MockUser();
    when(() => user.id).thenReturn('u1');
    when(() => puzzleRepo.fetchDaily(any())).thenAnswer((_) async => samplePuzzle());
    stubArchive();
    when(() => solveRepo.fetchSolves('u1')).thenAnswer(
      (_) async => [
        solveOn(offsetDay(today, -2)),
        solveOn(offsetDay(today, -1)),
        solveOn(today),
      ],
    );

    await pumpHome(tester, overrides: baseOverrides(user: user));
    await tester.pumpAndSettle();

    expect(find.byType(FlameIcon), findsOneWidget);
    expect(find.textContaining('day streak', findRichText: true), findsOneWidget);
  });

  testWidgets('empty streak band — first-run nudge when signed-in & streak==0',
      (tester) async {
    final user = MockUser();
    when(() => user.id).thenReturn('u1');
    when(() => puzzleRepo.fetchDaily(any())).thenAnswer((_) async => samplePuzzle());
    stubArchive();
    when(() => solveRepo.fetchSolves('u1')).thenAnswer((_) async => <SolveRow>[]);

    await pumpHome(tester, overrides: baseOverrides(user: user));
    await tester.pumpAndSettle();

    expect(find.text('Start your streak today'), findsOneWidget);
    expect(find.byType(FlameIcon), findsNothing);
    expect(find.text('Play today'), findsOneWidget);
  });

  testWidgets('loading — skeletons while the future is pending', (tester) async {
    final completer = Completer<Puzzle?>();
    when(() => puzzleRepo.fetchDaily(any())).thenAnswer((_) => completer.future);
    stubArchive();

    await pumpHome(tester, overrides: baseOverrides(user: null));
    await tester.pump(); // one frame — future still pending

    expect(find.byType(Skeleton), findsWidgets);

    completer.complete(samplePuzzle());
    await tester.pumpAndSettle();
    expect(find.byType(Skeleton), findsNothing);
  });

  testWidgets('offline, no cache — unavailable notice + reload', (tester) async {
    when(() => puzzleRepo.fetchDaily(any())).thenThrow(Exception('no network'));

    await pumpHome(tester, overrides: baseOverrides(user: null));
    await tester.pumpAndSettle();

    expect(find.text('Puzzle unavailable — try again shortly.'), findsOneWidget);
    expect(find.text('Reload'), findsOneWidget);
    expect(find.text('Play today'), findsNothing);
  });

  testWidgets('offline, with cache — playable CTA + offline banner',
      (tester) async {
    final cache = InMemoryPuzzleCache();
    await cache.put(today, samplePuzzle());
    when(() => puzzleRepo.fetchDaily(any())).thenThrow(Exception('no network'));

    await pumpHome(tester, overrides: baseOverrides(user: null, cache: cache));
    await tester.pumpAndSettle();

    expect(find.text('Offline — showing a saved puzzle'), findsOneWidget);
    expect(find.text('Play today'), findsOneWidget);
  });

  testWidgets('empty — no puzzle row for today', (tester) async {
    when(() => puzzleRepo.fetchDaily(any())).thenAnswer((_) async => null);
    when(() => puzzleRepo.fetchArchive(any())).thenAnswer((_) async => <ArchiveDay>[]);

    await pumpHome(tester, overrides: baseOverrides(user: null));
    await tester.pumpAndSettle();

    expect(find.textContaining("isn't ready yet"), findsOneWidget);
    expect(find.text('Play today'), findsNothing);
  });
}
