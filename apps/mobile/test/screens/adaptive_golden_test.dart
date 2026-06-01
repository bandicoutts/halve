import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:halve/screens/archive/archive_screen.dart';
import 'package:halve/screens/archive/archive_provider.dart';
import 'package:halve/screens/home/home_screen.dart';
import 'package:halve/screens/home/home_provider.dart';
import 'package:halve/screens/play/play_board.dart';
import 'package:halve/theme/theme.dart';
import 'package:halve/widgets/widgets.dart';

// ─── Shared test widths ───────────────────────────────────────────────────────

const _phone = Size(390, 844);
const _tablet = Size(820, 1180);

// ─── Test helpers ─────────────────────────────────────────────────────────────

/// Set the logical viewport size for the current test. Resets automatically
/// via [addTearDown] so later tests start with the default size.
void _setSize(WidgetTester tester, Size size) {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);
}

Widget _themed({required Widget child}) => MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      home: child,
    );

// A never-resolving Future — keeps the screen in its loading/skeleton state.
Future<T> _never<T>() => Completer<T>().future;

// ─── Golden: HvContentBox centering ──────────────────────────────────────────

void main() {
  // Shared key for all golden captures.
  const captureKey = Key('golden-capture');

  group('HvContentBox', () {
    Widget harness(Size size) {
      return _themed(
        child: RepaintBoundary(
          key: captureKey,
          child: SizedBox(
            width: size.width,
            height: 120,
            child: HvContentBox(
              child: Container(color: const Color(0xFF4ADE80), height: 60),
            ),
          ),
        ),
      );
    }

    testWidgets('phone — full bleed (no centering)', (tester) async {
      _setSize(tester, _phone);
      await tester.pumpWidget(harness(_phone));
      await expectLater(
        find.byKey(captureKey),
        matchesGoldenFile('goldens/content_box_phone.png'),
      );
    });

    testWidgets('tablet — centered within 560 px', (tester) async {
      _setSize(tester, _tablet);
      await tester.pumpWidget(harness(_tablet));
      await expectLater(
        find.byKey(captureKey),
        matchesGoldenFile('goldens/content_box_tablet.png'),
      );
    });
  });

  // ─── Golden: Home loading skeleton ─────────────────────────────────────────

  group('Home skeleton', () {
    Widget pump(Size size) {
      return ProviderScope(
        overrides: [
          homeDataProvider.overrideWith((_) => _never<HomeData>()),
        ],
        child: _themed(child: const RepaintBoundary(key: captureKey, child: HomeScreen())),
      );
    }

    testWidgets('phone', (tester) async {
      _setSize(tester, _phone);
      await tester.pumpWidget(pump(_phone));
      await tester.pump(); // one frame: skeleton visible, provider pending
      await expectLater(
        find.byKey(captureKey),
        matchesGoldenFile('goldens/home_skeleton_phone.png'),
      );
    });

    testWidgets('tablet', (tester) async {
      _setSize(tester, _tablet);
      await tester.pumpWidget(pump(_tablet));
      await tester.pump();
      await expectLater(
        find.byKey(captureKey),
        matchesGoldenFile('goldens/home_skeleton_tablet.png'),
      );
    });
  });

  // ─── Golden: Play board at two sizes ───────────────────────────────────────
  //
  // PlayBoard is a pure widget (no providers). Test it directly at cell sizes
  // matching phone (~52 px) and tablet (~70 px) to verify grid/gap scaling.

  group('PlayBoard', () {
    // Checkerboard 6×6: no givens, no edges, no violations.
    final emptyGrid = [
      for (var r = 0; r < 6; r++) [for (var c = 0; c < 6; c++) null],
    ];
    // Cell = int?; 0 = symbol A, 1 = symbol B
    final solutionGrid = [
      for (var r = 0; r < 6; r++)
        [for (var c = 0; c < 6; c++) (r + c).isEven ? 0 : 1],
    ];

    Widget boardHarness(double cellSize) {
      return _themed(
        child: RepaintBoundary(
          key: captureKey,
          child: PlayBoard(
            cells: emptyGrid,
            givens: solutionGrid,
            edges: const [],
            violations: const {},
            cellSize: cellSize,
            gap: (cellSize * 0.16).floorToDouble().clamp(6, double.infinity),
          ),
        ),
      );
    }

    testWidgets('phone cell size (52 px)', (tester) async {
      _setSize(tester, _phone);
      await tester.pumpWidget(boardHarness(52));
      await tester.pumpAndSettle();
      await expectLater(
        find.byKey(captureKey),
        matchesGoldenFile('goldens/play_board_phone.png'),
      );
    });

    testWidgets('tablet cell size (70 px)', (tester) async {
      _setSize(tester, _tablet);
      await tester.pumpWidget(boardHarness(70));
      await tester.pumpAndSettle();
      await expectLater(
        find.byKey(captureKey),
        matchesGoldenFile('goldens/play_board_tablet.png'),
      );
    });
  });

  // ─── Golden: Archive loading spinner ───────────────────────────────────────

  group('Archive loading', () {
    Widget pump() {
      return ProviderScope(
        overrides: [
          archiveDataProvider.overrideWith((_) => _never<ArchiveData>()),
        ],
        child: _themed(child: const RepaintBoundary(key: captureKey, child: ArchiveScreen())),
      );
    }

    testWidgets('phone', (tester) async {
      _setSize(tester, _phone);
      await tester.pumpWidget(pump());
      await tester.pump();
      await expectLater(
        find.byKey(captureKey),
        matchesGoldenFile('goldens/archive_loading_phone.png'),
      );
    });

    testWidgets('tablet', (tester) async {
      _setSize(tester, _tablet);
      await tester.pumpWidget(pump());
      await tester.pump();
      await expectLater(
        find.byKey(captureKey),
        matchesGoldenFile('goldens/archive_loading_tablet.png'),
      );
    });
  });
}
