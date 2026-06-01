import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:halve/data/models/models.dart';
import 'package:halve/data/puzzle_cache.dart';
import 'package:halve/data/repositories/puzzle_repository.dart';
import 'package:halve/data/repositories/solve_repository.dart';
import 'package:halve/main.dart';
import 'package:halve/providers/providers.dart';
import 'package:halve/screens/home/home_provider.dart';
import 'package:halve/widgets/widgets.dart';
import 'package:mocktail/mocktail.dart';

class MockPuzzleRepository extends Mock implements PuzzleRepository {}

class MockSolveRepository extends Mock implements SolveRepository {}

Puzzle _samplePuzzle() => Puzzle.tryParse(
      id: 'p-today',
      difficulty: 'medium',
      gridSpec: {
        'solution': [for (var r = 0; r < 6; r++) [for (var c = 0; c < 6; c++) (r + c) % 2]],
        'givens': [for (var r = 0; r < 6; r++) [for (var c = 0; c < 6; c++) null]],
        'edges': const <Map<String, Object?>>[],
      },
    )!;

void main() {
  // Boot the real app with deterministic Home data so the daily CTA renders
  // (otherwise Home would be in its offline/guest state with no "Play today").
  Future<void> pumpApp(WidgetTester tester) async {
    final puzzleRepo = MockPuzzleRepository();
    final solveRepo = MockSolveRepository();
    when(() => puzzleRepo.fetchDaily(any())).thenAnswer((_) async => _samplePuzzle());
    when(() => puzzleRepo.fetchByDate(any())).thenAnswer((_) async => _samplePuzzle());
    when(() => puzzleRepo.fetchArchive(any())).thenAnswer((_) async => <ArchiveDay>[]);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          puzzleRepositoryProvider.overrideWithValue(puzzleRepo),
          solveRepositoryProvider.overrideWithValue(solveRepo),
          currentUserProvider.overrideWithValue(null),
          puzzleCacheProvider.overrideWithValue(InMemoryPuzzleCache()),
        ],
        child: const HalveApp(),
      ),
    );
    await tester.pumpAndSettle();
  }

  // The nav label, disambiguated from any same-named card on the Home screen.
  Finder navLabel(String label) => find.descendant(
        of: find.byType(HalveBottomNav),
        matching: find.text(label),
      );

  testWidgets('bottom tabs switch branches', (tester) async {
    await pumpApp(tester);

    // Starts on Home.
    expect(find.text("Today's puzzle"), findsOneWidget);
    expect(find.byType(HalveBottomNav), findsOneWidget);

    // Switch to Archive (empty fetch → the Archive screen's empty notice).
    await tester.tap(navLabel('Archive'));
    await tester.pumpAndSettle();
    expect(find.textContaining('No puzzles yet'), findsOneWidget);

    // Switch to Stats.
    await tester.tap(navLabel('Stats'));
    await tester.pumpAndSettle();
    expect(find.text('Your stats'), findsOneWidget);

    // The tab bar stays mounted across branch switches.
    expect(find.byType(HalveBottomNav), findsOneWidget);
  });

  testWidgets('Play route hides the tab bar', (tester) async {
    await pumpApp(tester);

    await tester.tap(find.text('Play today'));
    await tester.pumpAndSettle();

    // The play board has loaded (timer at zero) — not the placeholder.
    expect(find.text('0:00'), findsOneWidget);
    // Play is a full-screen route outside the shell → no bottom nav.
    expect(find.byType(HalveBottomNav), findsNothing);

    // Back returns to the shell (tab bar reappears).
    await tester.tap(find.bySemanticsLabel('Back'));
    await tester.pumpAndSettle();
    expect(find.byType(HalveBottomNav), findsOneWidget);
  });
}
