import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/haptics_service.dart';
import '../../data/local_date.dart';
import '../../data/models/models.dart';
import '../../providers/providers.dart';
import '../../router/app_router.dart';
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';
import 'play_board.dart';
import 'play_provider.dart';

/// The play board (Phase 7) — a full-screen route that lives OUTSIDE the tab
/// shell, so the bottom nav is simply absent here. Header is just back +
/// difficulty. Loads the daily, an archive day ([date]), or a practice puzzle
/// ([isPractice]); on solve it records (daily/archive only) and hands off to
/// the Win screen.
class PlayScreen extends ConsumerWidget {
  const PlayScreen({super.key, this.date, this.difficulty, this.isPractice = false});

  /// Archive day in `yyyy-MM-dd` (null = today's daily).
  final String? date;

  /// Practice difficulty (easy/medium/hard), when [isPractice].
  final String? difficulty;
  final bool isPractice;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final args = PlayArgs(
      date: date,
      isPractice: isPractice,
      difficulty: isPractice ? Difficulty.tryParse(difficulty) : null,
    );
    final async = ref.watch(playLoadProvider(args));

    // PopScope: on Android, the system back gesture/button navigates home when
    // Play was opened via context.go() (canPop=false). When opened via push
    // (archive day), canPop=true so predictive-back previews the previous screen.
    return PopScope(
      canPop: context.canPop(),
      onPopInvokedWithResult: (bool didPop, _) {
        if (!didPop) context.go(Routes.home);
      },
      child: SafeScaffold(
        safeBottom: true,
        body: async.when(
        data: (load) => _PlayView(load: load),
        loading: () => _ScaffoldedMessage(
          label: _fallbackLabel(args),
          child: const Expanded(
            child: Center(child: CircularProgressIndicator.adaptive()),
          ),
        ),
        error: (_, _) => _UnavailableView(
          label: _fallbackLabel(args),
          onReload: () => ref.invalidate(playLoadProvider(args)),
        ),
      ),
      ),
    );
  }

  String _fallbackLabel(PlayArgs args) {
    if (args.isPractice) {
      return 'Practice · ${(args.difficulty ?? Difficulty.medium).wire}';
    }
    return args.date == null ? 'Daily' : args.date!;
  }
}

/// A back-only top bar plus arbitrary body — used by the loading + error states.
class _ScaffoldedMessage extends StatelessWidget {
  const _ScaffoldedMessage({required this.label, required this.child});

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _PlayTopBar(label: label),
        child,
      ],
    );
  }
}

class _UnavailableView extends StatelessWidget {
  const _UnavailableView({required this.label, required this.onReload});

  final String label;
  final VoidCallback onReload;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return _ScaffoldedMessage(
      label: label,
      child: Expanded(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s5),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                "Couldn't load the puzzle.",
                textAlign: TextAlign.center,
                style: AppTypography.small.copyWith(color: c.fg3),
              ),
              const SizedBox(height: AppSpacing.s4),
              HalveButton(
                label: 'Reload',
                variant: HalveButtonVariant.secondary,
                onPressed: onReload,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The shared, flat top bar for the Play surface: back chevron + a centered
/// (iOS) / leading (Android) uppercase difficulty label, no trailing action.
/// [puzzleInfo] is an optional subtitle rendered below (e.g. "#153 · June 2").
class _PlayTopBar extends StatelessWidget {
  const _PlayTopBar({required this.label, this.puzzleInfo});

  final String label;
  final String? puzzleInfo;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        HalveTopBar(
          onBack: () => context.canPop() ? context.pop() : context.go(Routes.home),
          title: null,
          trailing: Padding(
            padding: const EdgeInsets.only(right: AppSpacing.s5),
            child: Text(
              label.toUpperCase(),
              style: AppTypography.label.copyWith(color: c.fg3),
            ),
          ),
        ),
        if (puzzleInfo != null)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.s1),
            child: Text(
              puzzleInfo!,
              style: AppTypography.small.copyWith(color: c.fg3),
              textAlign: TextAlign.center,
            ),
          ),
      ],
    );
  }
}

/// The live board once the puzzle has loaded.
class _PlayView extends ConsumerStatefulWidget {
  const _PlayView({required this.load});

  final PlayLoad load;

  @override
  ConsumerState<_PlayView> createState() => _PlayViewState();
}

class _PlayViewState extends ConsumerState<_PlayView> {
  bool _handledSolve = false;

  Puzzle get _puzzle => widget.load.puzzle;

  /// "#153 · June 2" for daily/archive; null for practice.
  String? _puzzleInfo(PlayLoad load) {
    if (load.kind == PlayKind.practice) return null;
    final date = load.date ?? load.localDate;
    final dateStr = formatShortDate(date);
    final num = load.puzzleNumber;
    return num != null ? '#$num · $dateStr' : dateStr;
  }

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final state = ref.watch(playControllerProvider(_puzzle));
    final controller = ref.read(playControllerProvider(_puzzle).notifier);

    // Fire the solve hand-off exactly once when the grid first becomes solved.
    // Also detect new violations for error haptics.
    ref.listen(playControllerProvider(_puzzle), (prev, next) {
      if (next.solved && !(prev?.solved ?? false)) {
        _onSolved(next);
        return;
      }
      if (prev != null && !next.solved) {
        if (prev.violations.isEmpty && next.violations.isNotEmpty) hapticsOnError();
        if (_filledLineCount(next.grid) > _filledLineCount(prev.grid)) {
          hapticsOnLineComplete();
        }
      }
    });

    final isTablet = context.isTablet;
    final reduceMotion = context.reduceMotion;
    return Column(
      children: [
        _PlayTopBar(
          label: _puzzle.difficulty.wire,
          puzzleInfo: _puzzleInfo(widget.load),
        ),
        if (widget.load.isOffline)
          Padding(
            padding: const EdgeInsets.fromLTRB(
                AppSpacing.s5, AppSpacing.s1, AppSpacing.s5, 0),
            child: Text(
              'Offline — playing a saved puzzle',
              textAlign: TextAlign.center,
              style: AppTypography.small.copyWith(color: c.fg3),
            ),
          ),
        // Board — sized to a centered square within the available space.
        // On tablet: board + controls are grouped and centred together so no
        // dead space accumulates below the grid.
        Expanded(
          child: TweenAnimationBuilder<double>(
            tween: Tween(begin: reduceMotion ? 0.0 : 8.0, end: 0.0),
            duration:
                reduceMotion ? Duration.zero : const Duration(milliseconds: 420),
            curve: const Cubic(0.34, 1.4, 0.5, 1),
            builder: (_, dy, child) =>
                Transform.translate(offset: Offset(0, dy), child: child),
            child: isTablet
              ? Padding(
                  padding: EdgeInsets.symmetric(horizontal: context.hPagePad),
                  child: LayoutBuilder(
                    builder: (ctx, constraints) {
                      // Reserve space for spacer + controls + HowToPlay below
                      // the board so the column never overflows on any tablet.
                      const maxSide = Breakpoints.contentWidthPortrait;
                      const controlsReserve = 132.0;
                      final side = math.min(
                          math.min(constraints.maxWidth,
                              constraints.maxHeight - controlsReserve),
                          maxSide);
                      final cellSize = (side / 6.8).floorToDouble();
                      final gap =
                          math.max(6.0, (cellSize * 0.16).floorToDouble());
                      final isLandscape =
                          MediaQuery.orientationOf(ctx) == Orientation.landscape;
                      return Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          PlayBoard(
                            cells: state.grid,
                            givens: _puzzle.givens,
                            edges: _puzzle.edges,
                            violations: state.violations,
                            cellSize: cellSize,
                            gap: gap,
                            readOnly: state.solved,
                            onCellTap: (r, c) {
                              hapticsOnTap();
                              controller.tap(r, c);
                            },
                          ),
                          const SizedBox(height: AppSpacing.s4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              _ControlButton(
                                label: 'Undo',
                                onPressed: state.canUndo && !state.solved
                                    ? controller.undo
                                    : null,
                                child: const UndoGlyph(),
                              ),
                              const SizedBox(width: AppSpacing.s7),
                              _ControlButton(
                                label: 'Hint',
                                onPressed:
                                    state.solved ? null : controller.hint,
                                child: const HintGlyph(),
                              ),
                            ],
                          ),
                          TapFade(
                            onTap: () => _showRules(context),
                            child: Container(
                              constraints:
                                  const BoxConstraints(minHeight: 44),
                              alignment: Alignment.center,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: AppSpacing.s2),
                              child: Text(
                                'Rules',
                                style:
                                    AppTypography.small.copyWith(color: c.fg2),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                )
              : Padding(
                  padding: EdgeInsets.fromLTRB(context.hPagePad, AppSpacing.s4,
                      context.hPagePad, AppSpacing.s4),
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      const maxSide = 480.0;
                      final side = math.min(
                          math.min(constraints.maxWidth, constraints.maxHeight),
                          maxSide);
                      // 6 cells + 5 gaps (gap ≈ 0.16·cell) → total ≈ 6.8·cell.
                      final cellSize = (side / 6.8).floorToDouble();
                      final gap =
                          math.max(6.0, (cellSize * 0.16).floorToDouble());
                      return Center(
                        child: PlayBoard(
                          cells: state.grid,
                          givens: _puzzle.givens,
                          edges: _puzzle.edges,
                          violations: state.violations,
                          cellSize: cellSize,
                          gap: gap,
                          readOnly: state.solved,
                          onCellTap: (r, c) {
                            hapticsOnTap();
                            controller.tap(r, c);
                          },
                        ),
                      );
                    },
                  ),
                ),
          ),
        ),
        // Controls and How to play — phone only; tablet renders these inside
        // the Expanded group above so they stay close to the board.
        if (!isTablet) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(
                AppSpacing.s5, AppSpacing.s1, AppSpacing.s5, AppSpacing.s2),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _ControlButton(
                  label: 'Undo',
                  onPressed:
                      state.canUndo && !state.solved ? controller.undo : null,
                  child: const UndoGlyph(),
                ),
                const SizedBox(width: AppSpacing.s7),
                _ControlButton(
                  label: 'Hint',
                  onPressed: state.solved ? null : controller.hint,
                  child: const HintGlyph(),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.s2),
            child: TapFade(
              onTap: () => _showRules(context),
              child: Container(
                constraints: const BoxConstraints(minHeight: 44),
                alignment: Alignment.center,
                padding:
                    const EdgeInsets.symmetric(horizontal: AppSpacing.s2),
                child: Text(
                  'Rules',
                  style: AppTypography.small.copyWith(color: c.fg2),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Future<void> _onSolved(PlayState state) async {
    if (_handledSolve) return;
    _handledSolve = true;

    hapticsOnWin();
    final reduceMotion = context.reduceMotion;
    final durationMs = math.max(1, state.elapsedSeconds * 1000);

    // Record the solve (daily/archive only; practice never records — Phase 0).
    // Guests silently skip (reading the repo throws in guest mode).
    final recordFuture = _record(durationMs: durationMs, usedHint: state.usedHint);

    // A brief beat on the solved board (the win-mark moment) before hand-off.
    await Future<void>.delayed(
        Duration(milliseconds: reduceMotion ? 0 : 520));
    final saveResult = await recordFuture;
    if (!mounted) return;

    context.push(
      Routes.win,
      extra: PlayResult(
        kind: widget.load.kind,
        difficulty: _puzzle.difficulty,
        durationMs: durationMs,
        formattedTime: formatDuration(state.elapsedSeconds),
        usedHint: state.usedHint,
        solution: _puzzle.solution,
        size: _puzzle.size,
        localDate: widget.load.localDate,
        puzzleId: widget.load.puzzleId,
        date: widget.load.date,
        saveResult: saveResult,
      ),
    );
  }

  /// Counts fully-filled rows + columns (all cells non-null). Used to detect
  /// the moment a line completes so we can fire a satisfying haptic beat.
  int _filledLineCount(Grid grid) {
    var count = 0;
    for (final row in grid) {
      if (row.every((c) => c != null)) count++;
    }
    if (grid.isNotEmpty) {
      for (var col = 0; col < grid[0].length; col++) {
        if (grid.every((row) => row[col] != null)) count++;
      }
    }
    return count;
  }

  void _showRules(BuildContext context) {
    showHalveBottomSheet<void>(
      context: context,
      builder: (_) => const _RulesSheet(),
    );
  }

  Future<RecordSolveResult?> _record({
    required int durationMs,
    required bool usedHint,
  }) async {
    final puzzleId = widget.load.puzzleId;
    if (puzzleId == null) return null; // practice — never recorded
    if (!ref.read(isSignedInProvider)) return null; // guest — silent no-op

    final state = ref.read(playControllerProvider(_puzzle));
    try {
      final repo = ref.read(solveRepositoryProvider);
      if (repo == null) return RecordSolveResult.networkFailure;
      return await repo.recordSolve(
        puzzleId: puzzleId,
        grid: state.grid,
        durationMs: durationMs,
        usedHint: usedHint,
        localDate: widget.load.localDate,
      );
    } catch (_) {
      return RecordSolveResult.networkFailure;
    }
  }
}

/// An icon control with its label beneath (Undo / Hint). Mirrors the web
/// `ControlButton`: a 48px [HalveIconButton] + an uppercase tracked label that
/// dims to the hairline color when disabled.
class _ControlButton extends StatelessWidget {
  const _ControlButton({
    required this.label,
    required this.child,
    this.onPressed,
  });

  final String label;
  final Widget child;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final disabled = onPressed == null;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        HalveIconButton(
          semanticLabel: label,
          onPressed: onPressed,
          child: child,
        ),
        const SizedBox(height: AppSpacing.s1 + 3),
        Text(
          label.toUpperCase(),
          style: AppTypography.micro.copyWith(
            color: disabled ? c.hairline2 : c.fg3,
          ),
        ),
      ],
    );
  }
}

/// Compact rules reference shown in a bottom sheet during play.
/// Three rules, each one sentence. Not a tutorial — a reminder.
class _RulesSheet extends StatelessWidget {
  const _RulesSheet();

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.s5,
        AppSpacing.s4,
        AppSpacing.s5,
        AppSpacing.s6,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('Rules', style: AppTypography.h3.copyWith(color: c.fg1)),
          const SizedBox(height: AppSpacing.s5),
          _RuleRow(
            motif: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SymbolDisc(size: 18),
                SizedBox(width: 5),
                SymbolRing(size: 18),
              ],
            ),
            heading: 'Two symbols',
            body: 'Fill every cell with a disc or a ring.',
            c: c,
          ),
          const SizedBox(height: AppSpacing.s4),
          _RuleRow(
            motif: Text(
              '3+3',
              style: AppTypography.label.copyWith(color: c.accent, letterSpacing: 0),
            ),
            heading: 'Balance',
            body: 'Each row and column must contain exactly 3 of each symbol.',
            c: c,
          ),
          const SizedBox(height: AppSpacing.s4),
          _RuleRow(
            motif: Text(
              '≤2',
              style: AppTypography.label.copyWith(color: c.accent, letterSpacing: 0),
            ),
            heading: 'No three in a row',
            body: 'No three identical symbols may appear side-by-side in any row or column.',
            c: c,
          ),
          const SizedBox(height: AppSpacing.s4),
          _RuleRow(
            motif: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('=', style: AppTypography.label.copyWith(color: c.accent, letterSpacing: 0)),
                const SizedBox(height: 2),
                Text('≠', style: AppTypography.label.copyWith(color: c.fg3, letterSpacing: 0)),
              ],
            ),
            heading: 'Edge clues',
            body: '= means the two neighbouring cells share a symbol. ≠ means they differ.',
            c: c,
          ),
        ],
      ),
    );
  }
}

class _RuleRow extends StatelessWidget {
  const _RuleRow({
    required this.motif,
    required this.heading,
    required this.body,
    required this.c,
  });

  final Widget motif;
  final String heading;
  final String body;
  final HalveColors c;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 36,
          child: Padding(
            padding: const EdgeInsets.only(top: 2),
            child: motif,
          ),
        ),
        const SizedBox(width: AppSpacing.s3),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                heading,
                style: AppTypography.small.copyWith(
                  fontWeight: FontWeight.w600,
                  fontVariations: const [FontVariation('wght', 600)],
                  color: c.fg1,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                body,
                style: AppTypography.small.copyWith(color: c.fg2, height: 1.5),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
