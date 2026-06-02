import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../../data/local_date.dart';
import '../../data/models/models.dart';
import '../../providers/providers.dart';
import '../../router/app_router.dart';
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';
import '../play/play_provider.dart';
import 'win_provider.dart';

/// The Win keepsake — the core-loop peak. Renders the solved board as a framed
/// keepsake, the solve time, the puzzle ordinal + streak, an optional
/// sign-in-to-keep-your-streak nudge (signed-out), a network-retry affordance
/// when the solve failed to save, and the native share sheet. Mirrors the
/// wireframe `HalveWin` + `ShareSheet` (`app/screens/play.jsx`) and the web
/// `WinScreen.tsx`. Consumes the [PlayResult] handed off via `context.push`.
class WinScreen extends ConsumerStatefulWidget {
  const WinScreen({super.key, this.result});

  final PlayResult? result;

  @override
  ConsumerState<WinScreen> createState() => _WinScreenState();
}

class _WinScreenState extends ConsumerState<WinScreen> {
  /// The one-time nudge dismissal, seeded from `shared_preferences`.
  bool _dismissed = false;

  /// The latest save outcome (initialised from the hand-off, updated on retry).
  RecordSolveResult? _saveResult;
  bool _retrying = false;

  @override
  void initState() {
    super.initState();
    _saveResult = widget.result?.saveResult;
    _loadDismissed();
  }

  Future<void> _loadDismissed() async {
    final dismissed = await ref.read(streakNudgePrefsProvider).isDismissed();
    if (mounted && dismissed) setState(() => _dismissed = true);
  }

  Future<void> _dismissNudge() async {
    setState(() => _dismissed = true);
    await ref.read(streakNudgePrefsProvider).setDismissed();
  }

  Future<void> _retrySave() async {
    final r = widget.result;
    if (r == null || r.puzzleId == null || _retrying) return;
    setState(() => _retrying = true);
    RecordSolveResult result;
    try {
      final repo = ref.read(solveRepositoryProvider);
      // A solved grid equals the solution, so we can re-record from the result.
      result = repo == null
          ? RecordSolveResult.networkFailure
          : await repo.recordSolve(
              puzzleId: r.puzzleId!,
              grid: r.solution,
              durationMs: r.durationMs,
              usedHint: r.usedHint,
              localDate: r.localDate,
            );
    } catch (_) {
      result = RecordSolveResult.networkFailure;
    }
    if (!mounted) return;
    setState(() {
      _saveResult = result;
      _retrying = false;
    });
  }

  void _share(WinInfo? info) {
    final r = widget.result!;
    final text = buildShareText(
      dayNo: r.kind == PlayKind.practice ? null : info?.dayNo,
      time: r.formattedTime,
      difficulty: r.difficulty.label,
      streak: info?.streak,
    );
    // Fire the platform-native share sheet (the #1 native growth lever).
    Share.share(text);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final r = widget.result;

    // Defensive: a deep link / refresh with no result → offer the way home.
    if (r == null) {
      return SafeScaffold(
        safeBottom: true,
        body: Center(
          child: HalveButton(
            label: 'Back to today',
            onPressed: () => context.go(Routes.home),
          ),
        ),
      );
    }

    final query = WinQuery(kind: r.kind, date: r.date);
    final info = ref.watch(winInfoProvider(query)).valueOrNull;
    final signedIn = ref.watch(isSignedInProvider);
    final reduceMotion = context.reduceMotion;

    final dayNo = r.kind == PlayKind.practice ? null : info?.dayNo;
    final streak = info?.streak ?? 0;

    final eyebrow = r.kind == PlayKind.practice
        ? 'Practice'
        : dayNo != null
            ? 'Puzzle No. $dayNo'
            : 'Halve';

    final keepsakeDate = r.date ??
        (r.kind == PlayKind.practice ? null : localToday());

    final showStreakMeta = r.kind == PlayKind.daily && streak > 0;
    final synced = signedIn && (_saveResult?.ok ?? false);
    final showNudge = !signedIn &&
        r.kind == PlayKind.daily &&
        streak >= 3 &&
        !_dismissed;
    final showRetry = _saveResult?.isNetworkError ?? false;

    return SafeScaffold(
      safeBottom: true,
      body: Column(
        children: [
          _WinTopBar(onClose: () => context.go(Routes.home)),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(
                  AppSpacing.s5, AppSpacing.s1, AppSpacing.s5, AppSpacing.s5),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 384),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Mark — a single confident swell on entry.
                      Center(
                        child: _WinMark(reduceMotion: reduceMotion),
                      ),
                      const SizedBox(height: AppSpacing.s4),
                      Center(
                        child: Text(
                          eyebrow.toUpperCase(),
                          style: AppTypography.label.copyWith(
                            letterSpacing: 1.68, // 0.14em at 12px
                            color: c.fg3,
                          ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.s3),
                      Center(
                        child: Text(
                          'Solved in',
                          style: AppTypography.small.copyWith(color: c.fg3),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.s1),
                      Center(
                        child: Text(
                          r.formattedTime,
                          style: AppTypography.tabular(AppTypography.display)
                              .copyWith(color: c.fg1),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.s6),
                      // Keepsake card — settles up into place.
                      _Settle(
                        reduceMotion: reduceMotion,
                        child: _KeepsakeCard(
                          solution: r.solution,
                          gridSize: r.size,
                          date: keepsakeDate,
                          reduceMotion: reduceMotion,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.s4),
                      _MetaLine(
                        difficulty: r.difficulty.label,
                        streak: showStreakMeta ? streak : null,
                        synced: synced,
                      ),
                      if (showNudge) ...[
                        const SizedBox(height: AppSpacing.s4),
                        _StreakNudge(
                          streak: streak,
                          reduceMotion: reduceMotion,
                          onTap: () => context.push(Routes.auth),
                          onDismiss: _dismissNudge,
                        ),
                      ],
                      if (showRetry) ...[
                        const SizedBox(height: AppSpacing.s4),
                        _SaveRetry(
                          retrying: _retrying,
                          onRetry: _retrySave,
                        ),
                      ],
                      const SizedBox(height: AppSpacing.s6),
                      HalveButton(
                        label: 'Share result',
                        full: true,
                        leadingIcon: const ShareGlyph(),
                        onPressed: () => _share(info),
                      ),
                      const SizedBox(height: AppSpacing.s3),
                      HalveButton(
                        label: _secondaryLabel(r.kind),
                        variant: HalveButtonVariant.secondary,
                        full: true,
                        onPressed: () => context.go(_secondaryRoute(r.kind)),
                      ),
                      if (r.kind == PlayKind.daily) ...[
                        const SizedBox(height: AppSpacing.s4),
                        _Countdown(),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _secondaryLabel(PlayKind kind) => switch (kind) {
        PlayKind.daily => 'See your stats',
        PlayKind.archive => 'Back to archive',
        PlayKind.practice => 'New puzzle',
      };

  String _secondaryRoute(PlayKind kind) => switch (kind) {
        PlayKind.daily => Routes.stats,
        PlayKind.archive => Routes.archive,
        PlayKind.practice => Routes.practice,
      };
}

/// Close (×) left, centered "COMPLETE" eyebrow, balancing spacer right.
class _WinTopBar extends StatelessWidget {
  const _WinTopBar({required this.onClose});

  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Padding(
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.s2, vertical: AppSpacing.s1),
      child: SizedBox(
        height: 52,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Text(
              'COMPLETE',
              style: AppTypography.label.copyWith(
                letterSpacing: 1.2, // 0.1em
                color: c.fg3,
              ),
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: HalveIconButton(
                semanticLabel: 'Close',
                size: 44,
                onPressed: onClose,
                child: const Icon(Icons.close),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The master mark, scaling up from 0.7 → 1 with a confident back-out swell.
class _WinMark extends StatelessWidget {
  const _WinMark({required this.reduceMotion});

  final bool reduceMotion;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: reduceMotion ? 1.0 : 0.7, end: 1.0),
      duration:
          reduceMotion ? Duration.zero : const Duration(milliseconds: 600),
      curve: const Cubic(0.34, 1.56, 0.64, 1), // back-out
      builder: (_, scale, child) =>
          Transform.scale(scale: scale, child: child),
      child: const HalveMark(size: 46),
    );
  }
}

/// Translates a child up by 10px into place (the keepsake "settle").
class _Settle extends StatelessWidget {
  const _Settle({required this.child, required this.reduceMotion});

  final Widget child;
  final bool reduceMotion;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: reduceMotion ? 0.0 : 10.0, end: 0.0),
      duration:
          reduceMotion ? Duration.zero : const Duration(milliseconds: 500),
      curve: const Cubic(0.34, 1.4, 0.5, 1),
      builder: (_, dy, child) =>
          Transform.translate(offset: Offset(0, dy), child: child),
      child: child,
    );
  }
}

/// The framed solved board: a "Halve" logo + date header above the solution
/// grid, rendered as Disc/Ring cells with a staggered pop.
class _KeepsakeCard extends StatelessWidget {
  const _KeepsakeCard({
    required this.solution,
    required this.gridSize,
    required this.date,
    required this.reduceMotion,
  });

  final Solution solution;
  final int gridSize;
  final String? date;
  final bool reduceMotion;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 18),
      decoration: BoxDecoration(
        color: c.surface,
        border: Border.all(color: c.hairline),
        borderRadius: AppRadii.xlR,
        boxShadow: context.halveShadows.md,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Logo lockup (compact wordmark).
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const HalveMark(size: 15),
                  const SizedBox(width: 6),
                  Text(
                    'Halve',
                    style: AppTypography.small.copyWith(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      fontVariations: const [FontVariation('wght', 600)],
                      color: c.fg1,
                      letterSpacing: -0.13,
                    ),
                  ),
                ],
              ),
              if (date != null)
                Text(
                  formatKeepsakeDate(date!),
                  style: AppTypography.label.copyWith(
                    letterSpacing: 0,
                    color: c.fg3,
                  ),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.s4 - 2),
          _SolvedBoard(
            solution: solution,
            gridSize: gridSize,
            reduceMotion: reduceMotion,
          ),
        ],
      ),
    );
  }
}

/// The solution rendered as sunken Disc/Ring cells with a staggered cell-pop
/// (per-cell opacity 0.45→1, scale 0.82→1), mirroring the web `SolvedBoard`.
class _SolvedBoard extends StatefulWidget {
  const _SolvedBoard({
    required this.solution,
    required this.gridSize,
    required this.reduceMotion,
  });

  final Solution solution;
  final int gridSize;
  final bool reduceMotion;

  @override
  State<_SolvedBoard> createState() => _SolvedBoardState();
}

class _SolvedBoardState extends State<_SolvedBoard>
    with SingleTickerProviderStateMixin {
  static const _gap = 7.0;
  static const _baseMs = 400.0;

  late final AnimationController _controller;
  late final double _totalMs;

  @override
  void initState() {
    super.initState();
    final n = widget.gridSize;
    final maxDelay = (n - 1) * 16 + (n - 1) * 20;
    _totalMs = maxDelay + _baseMs;
    _controller = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: _totalMs.round()),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_controller.status == AnimationStatus.dismissed) {
      if (widget.reduceMotion) {
        _controller.value = 1.0;
      } else {
        _controller.forward();
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  double _cellPop(int index) {
    final delay = (index % widget.gridSize) * 16 + (index ~/ widget.gridSize) * 20;
    final begin = delay / _totalMs;
    final end = ((delay + _baseMs) / _totalMs).clamp(0.0, 1.0);
    // Clamp to [0,1]: the cubic has y1=1.4 which intentionally overshoots for
    // the scale pop, but Opacity asserts opacity ≤ 1.0 so we must cap it here.
    return const Cubic(0.34, 1.4, 0.5, 1).transform(
      ((_controller.value - begin) / (end - begin)).clamp(0.0, 1.0),
    ).clamp(0.0, 1.0);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final n = widget.gridSize;
    final flat = [for (final row in widget.solution) ...row];

    return LayoutBuilder(
      builder: (context, constraints) {
        final cell = (((constraints.maxWidth - _gap * (n - 1)) / n))
            .clamp(0.0, 46.0)
            .floorToDouble();
        return AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            return Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (var rIdx = 0; rIdx < n; rIdx++) ...[
                  if (rIdx > 0) const SizedBox(height: _gap),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      for (var cIdx = 0; cIdx < n; cIdx++) ...[
                        if (cIdx > 0) const SizedBox(width: _gap),
                        Builder(builder: (context) {
                          final index = rIdx * n + cIdx;
                          final v = _cellPop(index);
                          return Opacity(
                            opacity: 0.45 + 0.55 * v,
                            child: Transform.scale(
                              scale: 0.82 + 0.18 * v,
                              child: Container(
                                width: cell,
                                height: cell,
                                decoration: BoxDecoration(
                                  color: c.bgSunken,
                                  borderRadius: AppRadii.smR,
                                ),
                                alignment: Alignment.center,
                                child: flat[index] == 0
                                    ? SymbolDisc(size: cell * 0.62)
                                    : SymbolRing(size: cell * 0.62),
                              ),
                            ),
                          );
                        }),
                      ],
                    ],
                  ),
                ],
              ],
            );
          },
        );
      },
    );
  }
}

/// `<difficulty> · <N>-day streak · ● Synced` — segments shown conditionally.
class _MetaLine extends StatelessWidget {
  const _MetaLine({
    required this.difficulty,
    required this.streak,
    required this.synced,
  });

  final String difficulty;
  final int? streak;
  final bool synced;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final base = AppTypography.small.copyWith(color: c.fg3);
    final dot = Text('·',
        style: base.copyWith(color: c.hairline2, letterSpacing: 0));

    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: AppSpacing.s2,
      runSpacing: AppSpacing.s1,
      children: [
        Text(difficulty, style: base),
        if (streak != null) ...[
          dot,
          Text.rich(
            TextSpan(children: [
              TextSpan(
                text: '$streak',
                style: AppTypography.tabular(base).copyWith(
                  color: c.accent,
                  fontWeight: FontWeight.w600,
                  fontVariations: const [FontVariation('wght', 600)],
                ),
              ),
              TextSpan(text: '-day streak', style: base),
            ]),
          ),
        ],
        if (synced) ...[
          dot,
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 6,
                height: 6,
                decoration:
                    BoxDecoration(color: c.correct, shape: BoxShape.circle),
              ),
              const SizedBox(width: AppSpacing.s1),
              Text('Synced', style: base),
            ],
          ),
        ],
      ],
    );
  }
}

/// Signed-out, streak ≥ 3, never dismissed: a tappable row inviting sign-in,
/// plus a 44×44 dismiss × that persists the dismissal forever.
class _StreakNudge extends StatelessWidget {
  const _StreakNudge({
    required this.streak,
    required this.reduceMotion,
    required this.onTap,
    required this.onDismiss,
  });

  final int streak;
  final bool reduceMotion;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final base = AppTypography.small.copyWith(color: c.fg2, height: 1.45);
    return Container(
      decoration: BoxDecoration(
        color: c.surface,
        border: Border.all(color: c.hairline),
        borderRadius: AppRadii.lgR,
      ),
      child: Row(
        children: [
          Expanded(
            child: TapFade(
              onTap: onTap,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 13, 4, 13),
                child: Row(
                  children: [
                    Expanded(
                      child: Text.rich(
                        TextSpan(children: [
                          const TextSpan(text: 'Your '),
                          TextSpan(
                            text: '$streak',
                            style: AppTypography.tabular(base).copyWith(
                              fontWeight: FontWeight.w600,
                              fontVariations: const [FontVariation('wght', 600)],
                            ),
                          ),
                          const TextSpan(
                            text: '-day streak lives on this device — '
                                'sign in to keep it safe',
                          ),
                        ]),
                        style: base,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.s2),
                    Icon(Icons.chevron_right, size: 18, color: c.fg3),
                  ],
                ),
              ),
            ),
          ),
          Semantics(
            button: true,
            label: 'Dismiss',
            child: TapFade(
              onTap: onDismiss,
              child: SizedBox(
                width: 44,
                height: 44,
                child: Icon(Icons.close, size: 14, color: c.fg3),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// "Couldn't save — Retry" affordance when the solve insert failed on the
/// network. Re-runs `record_solve`; `alreadySolved` counts as success.
class _SaveRetry extends StatelessWidget {
  const _SaveRetry({required this.retrying, required this.onRetry});

  final bool retrying;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: c.surface,
        border: Border.all(color: c.hairline),
        borderRadius: AppRadii.lgR,
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              "Couldn't save your result — check your connection.",
              style: AppTypography.small.copyWith(color: c.fg2),
            ),
          ),
          const SizedBox(width: AppSpacing.s3),
          TapFade(
            onTap: retrying ? null : onRetry,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: retrying
                  ? SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation(c.accent),
                      ),
                    )
                  : Text(
                      'Retry',
                      style: AppTypography.small.copyWith(
                        color: c.accent,
                        fontWeight: FontWeight.w600,
                        fontVariations: const [FontVariation('wght', 600)],
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

/// "Next puzzle in 9h 12m" — daily only, computed at build time.
class _Countdown extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final remaining = formatCountdownToMidnight(DateTime.now());
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text('Next puzzle in',
            style: AppTypography.small.copyWith(color: c.fg3)),
        const SizedBox(width: AppSpacing.s2),
        Text(
          remaining,
          style: AppTypography.tabular(AppTypography.small).copyWith(
            color: c.fg2,
            fontWeight: FontWeight.w600,
            fontVariations: const [FontVariation('wght', 600)],
          ),
        ),
      ],
    );
  }
}
