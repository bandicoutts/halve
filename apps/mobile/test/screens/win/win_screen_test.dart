import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:halve/data/models/models.dart';
import 'package:halve/data/prefs_keys.dart';
import 'package:halve/data/repositories/solve_repository.dart';
import 'package:halve/providers/providers.dart';
import 'package:halve/screens/play/play_provider.dart';
import 'package:halve/screens/win/win_provider.dart';
import 'package:halve/screens/win/win_screen.dart';
import 'package:halve/theme/theme.dart';
import 'package:halve/widgets/widgets.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class MockSolveRepository extends Mock implements SolveRepository {}

class MockUser extends Mock implements User {}

/// A checkerboard 6×6 solution `(r + c) % 2` → 18 discs (0) + 18 rings (1).
Solution checkerboard() => [
      for (var r = 0; r < 6; r++) [for (var c = 0; c < 6; c++) (r + c) % 2],
    ];

PlayResult result({
  PlayKind kind = PlayKind.daily,
  Difficulty difficulty = Difficulty.medium,
  String formattedTime = '1:23',
  int durationMs = 83000,
  bool usedHint = false,
  String localDate = '2026-06-01',
  String? date,
  String? puzzleId = 'p-1',
  RecordSolveResult? saveResult,
}) {
  return PlayResult(
    kind: kind,
    difficulty: difficulty,
    durationMs: durationMs,
    formattedTime: formattedTime,
    usedHint: usedHint,
    solution: checkerboard(),
    size: 6,
    localDate: localDate,
    date: date,
    puzzleId: puzzleId,
    saveResult: saveResult,
  );
}

Future<void> pumpWin(
  WidgetTester tester, {
  required PlayResult res,
  WinInfo info = const WinInfo(),
  User? user,
  SolveRepository? solveRepo,
}) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        winInfoProvider.overrideWith((ref, arg) async => info),
        currentUserProvider.overrideWithValue(user),
        if (solveRepo != null)
          solveRepositoryProvider.overrideWithValue(solveRepo),
      ],
      child: MediaQuery(
        data: const MediaQueryData(disableAnimations: true),
        child: MaterialApp(
          theme: AppTheme.light(),
          home: WinScreen(result: res),
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    registerFallbackValue(<List<int?>>[]);
  });

  testWidgets('keepsake renders the full solution as Disc/Ring cells',
      (tester) async {
    await pumpWin(
      tester,
      res: result(),
      info: const WinInfo(dayNo: 42, streak: 5),
      user: null,
    );

    // 18 discs (0) + 18 rings (1) for the checkerboard.
    expect(find.byType(SymbolDisc), findsNWidgets(18));
    expect(find.byType(SymbolRing), findsNWidgets(18));
    // Identity + time.
    expect(find.text('PUZZLE NO. 42'), findsOneWidget);
    expect(find.text('1:23'), findsOneWidget);
    expect(find.text('Solved in'), findsOneWidget);
  });

  testWidgets('metadata line shows difficulty + streak', (tester) async {
    await pumpWin(
      tester,
      res: result(),
      info: const WinInfo(dayNo: 42, streak: 5),
      user: null,
    );

    expect(find.text('Medium'), findsOneWidget);
    // The streak count + "-day streak" live in a Text.rich span.
    expect(find.textContaining('day streak'), findsWidgets);
  });

  testWidgets('signed-out nudge appears at streak ≥ 3', (tester) async {
    await pumpWin(
      tester,
      res: result(),
      info: const WinInfo(dayNo: 42, streak: 5),
      user: null,
    );

    expect(find.textContaining('lives on this device'), findsOneWidget);
    expect(find.bySemanticsLabel('Dismiss'), findsOneWidget);
  });

  testWidgets('no nudge below streak 3', (tester) async {
    await pumpWin(
      tester,
      res: result(),
      info: const WinInfo(dayNo: 42, streak: 2),
      user: null,
    );

    expect(find.textContaining('lives on this device'), findsNothing);
  });

  testWidgets('dismissing the nudge persists to shared_preferences',
      (tester) async {
    await pumpWin(
      tester,
      res: result(),
      info: const WinInfo(dayNo: 42, streak: 5),
      user: null,
    );

    expect(find.textContaining('lives on this device'), findsOneWidget);
    await tester.ensureVisible(find.bySemanticsLabel('Dismiss'));
    await tester.tap(find.bySemanticsLabel('Dismiss'));
    await tester.pumpAndSettle();

    // Gone from the UI…
    expect(find.textContaining('lives on this device'), findsNothing);
    // …and persisted.
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getBool(prefKeyStreakNudgeDismissed), isTrue);
  });

  testWidgets('nudge stays hidden when already dismissed', (tester) async {
    SharedPreferences.setMockInitialValues({prefKeyStreakNudgeDismissed: true});
    await pumpWin(
      tester,
      res: result(),
      info: const WinInfo(dayNo: 42, streak: 5),
      user: null,
    );

    expect(find.textContaining('lives on this device'), findsNothing);
  });

  testWidgets('signed-in shows the green Synced dot, no nudge', (tester) async {
    final user = MockUser();
    when(() => user.id).thenReturn('u1');
    await pumpWin(
      tester,
      res: result(saveResult: const RecordSolveResult(ok: true)),
      info: const WinInfo(dayNo: 42, streak: 5),
      user: user,
    );

    expect(find.text('Synced'), findsOneWidget);
    expect(find.textContaining('lives on this device'), findsNothing);
  });

  testWidgets('network save failure shows Retry and re-calls recordSolve',
      (tester) async {
    final user = MockUser();
    when(() => user.id).thenReturn('u1');
    final solveRepo = MockSolveRepository();
    when(() => solveRepo.recordSolve(
          puzzleId: any(named: 'puzzleId'),
          grid: any(named: 'grid'),
          durationMs: any(named: 'durationMs'),
          usedHint: any(named: 'usedHint'),
          localDate: any(named: 'localDate'),
        )).thenAnswer((_) async => const RecordSolveResult(ok: true));

    await pumpWin(
      tester,
      res: result(saveResult: RecordSolveResult.networkFailure),
      info: const WinInfo(dayNo: 42, streak: 5),
      user: user,
      solveRepo: solveRepo,
    );

    expect(find.text('Retry'), findsOneWidget);

    await tester.ensureVisible(find.text('Retry'));
    await tester.tap(find.text('Retry'));
    await tester.pumpAndSettle();

    verify(() => solveRepo.recordSolve(
          puzzleId: 'p-1',
          grid: any(named: 'grid'),
          durationMs: 83000,
          usedHint: false,
          localDate: '2026-06-01',
        )).called(1);
    // A successful retry clears the prompt.
    expect(find.text('Retry'), findsNothing);
  });

  testWidgets('practice eyebrow + no streak/nudge', (tester) async {
    await pumpWin(
      tester,
      res: result(kind: PlayKind.practice, puzzleId: null),
      info: const WinInfo(),
      user: null,
    );

    expect(find.text('PRACTICE'), findsOneWidget);
    expect(find.text('-day streak'), findsNothing);
    expect(find.textContaining('lives on this device'), findsNothing);
  });

  group('buildShareText (spoiler-free payload)', () {
    test('dated daily with a streak matches the canonical format', () {
      expect(
        buildShareText(
            dayNo: 42, time: '1:23', difficulty: 'Medium', streak: 5),
        'Halve No. 42 · 1:23 · Medium · streak 5'
        '\nNo spoilers — play at halve.today',
      );
    });

    test('omits the streak segment when zero', () {
      expect(
        buildShareText(dayNo: 42, time: '1:23', difficulty: 'Hard', streak: 0),
        'Halve No. 42 · 1:23 · Hard\nNo spoilers — play at halve.today',
      );
    });

    test('practice (no dayNo) drops the puzzle number', () {
      expect(
        buildShareText(dayNo: null, time: '0:45', difficulty: 'Easy'),
        'Halve · 0:45 · Easy\nNo spoilers — play at halve.today',
      );
    });
  });
}
