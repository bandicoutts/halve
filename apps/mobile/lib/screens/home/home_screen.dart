import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/models.dart';
import '../../router/app_router.dart';
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';
import 'home_provider.dart';

/// Home — the "Today" tab. Loads today's puzzle, streak, and archive counts via
/// [homeDataProvider] and renders one of: normal (Play today), solved-today,
/// loading (skeletons), offline (cached puzzle + banner, or an unavailable
/// notice + reload), and empty (no puzzle yet). Mirrors the wireframe
/// `screens/home.jsx` (`Home` + its `variant` prop).
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(homeDataProvider);

    Widget body;
    if (async.isLoading && !async.hasValue) {
      body = const _LoadingBody();
    } else if (async.hasValue) {
      body = _LoadedBody(
        data: async.value!,
        onReload: () => ref.invalidate(homeDataProvider),
      );
    } else {
      // Provider catches its own failures into a HomeData; an AsyncError here
      // is unexpected — offer a reload.
      body = _ErrorBody(onReload: () => ref.invalidate(homeDataProvider));
    }

    return SafeScaffold(
      body: RefreshIndicator.adaptive(
        onRefresh: () => ref.refresh(homeDataProvider.future),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(
            context.hPagePad, AppSpacing.s2, context.hPagePad, AppSpacing.s5,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const _HomeHeader(),
              const SizedBox(height: AppSpacing.s5 + 2),
              body,
            ],
          ),
        ),
      ),
    );
  }
}

/// Logo wordmark + settings gear.
class _HomeHeader extends StatelessWidget {
  const _HomeHeader();

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return SizedBox(
      height: 40,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const HalveMark(size: 22),
              const SizedBox(width: AppSpacing.s2),
              Text(
                'Halve',
                style: AppTypography.h3.copyWith(
                  color: c.fg1,
                  fontWeight: FontWeight.w600,
                  fontVariations: const [FontVariation('wght', 600)],
                ),
              ),
            ],
          ),
          HalveIconButton(
            semanticLabel: 'Settings',
            size: 40,
            onPressed: () => context.push(Routes.settings),
            child: const Icon(Icons.settings_outlined),
          ),
        ],
      ),
    );
  }
}

/// Skeletonised Home while [homeDataProvider] resolves.
class _LoadingBody extends StatelessWidget {
  const _LoadingBody();

  @override
  Widget build(BuildContext context) {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Skeleton(height: 66, borderRadius: AppRadii.lgR),
        SizedBox(height: AppSpacing.s5 - 2),
        Align(
          alignment: Alignment.centerLeft,
          child: FractionallySizedBox(
            widthFactor: 0.52,
            child: Skeleton(height: 13, borderRadius: AppRadii.smR),
          ),
        ),
        SizedBox(height: AppSpacing.s3),
        Align(
          alignment: Alignment.centerLeft,
          child: FractionallySizedBox(
            widthFactor: 0.78,
            child: Skeleton(height: 42, borderRadius: AppRadii.mdR),
          ),
        ),
        SizedBox(height: AppSpacing.s5 - 2),
        Skeleton(height: 52, borderRadius: AppRadii.fullR),
      ],
    );
  }
}

class _ErrorBody extends StatelessWidget {
  const _ErrorBody({required this.onReload});

  final VoidCallback onReload;

  @override
  Widget build(BuildContext context) {
    return _LoadedBody(
      // Synthesize a minimal offline state so the layout is consistent.
      data: const HomeData(
        today: '',
        dateLabel: '',
        signedIn: false,
        offline: true,
      ),
      onReload: onReload,
    );
  }
}

/// The resolved Home, choosing its variant from [data].
class _LoadedBody extends StatelessWidget {
  const _LoadedBody({required this.data, required this.onReload});

  final HomeData data;
  final VoidCallback onReload;

  @override
  Widget build(BuildContext context) {
    final hasCache = data.puzzle != null;
    final offlineNoCache = data.offline && !hasCache;
    final emptyNoPuzzle = !data.offline && data.puzzle == null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // ── Streak band region ──────────────────────────────────────────
        _StreakRegion(data: data),
        const SizedBox(height: AppSpacing.s5 - 2),

        // ── Puzzle region ──────────────────────────────────────────────
        if (data.dateLabel.isNotEmpty) _MetaRow(data: data),
        const SizedBox(height: AppSpacing.s3 - 2),
        Text(
          "Today's puzzle",
          style: AppTypography.h1.copyWith(
            fontSize: 44,
            height: 1.04,
            letterSpacing: -1.1, // -0.025em
            color: context.halveColors.fg1,
          ),
        ),
        const SizedBox(height: AppSpacing.s5 - 2),

        if (offlineNoCache)
          _OfflineNotice(onReload: onReload)
        else if (emptyNoPuzzle)
          const _EmptyPuzzleNotice()
        else if (data.solvedToday)
          _SolvedBlock(durationMs: data.solvedTodayMs!)
        else ...[
          if (data.servedFromCache) ...[
            const _OfflineBanner(),
            const SizedBox(height: AppSpacing.s3),
          ],
          HalveButton(
            label: 'Play today',
            full: true,
            onPressed: () => context.push(Routes.play),
          ),
        ],

        // ── Keep playing ───────────────────────────────────────────────
        const SizedBox(height: AppSpacing.s6),
        _KeepPlaying(data: data),
        const SizedBox(height: AppSpacing.s6),
        const _HowToPlayFooter(),
      ],
    );
  }
}

/// Signed-in & streak>0 → flame band; signed-in & streak==0 → quiet nudge;
/// signed-out → nothing (matches the web HomeUserContent).
class _StreakRegion extends StatelessWidget {
  const _StreakRegion({required this.data});

  final HomeData data;

  @override
  Widget build(BuildContext context) {
    if (!data.signedIn) return const SizedBox.shrink();
    if (data.streak > 0) {
      return _StreakBand(
        streak: data.streak,
        last7: data.last7,
        solvedToday: data.solvedToday,
      );
    }
    return const _EmptyStreakBand();
  }
}

class _StreakBand extends StatelessWidget {
  const _StreakBand({
    required this.streak,
    required this.last7,
    required this.solvedToday,
  });

  final int streak;
  final List<bool> last7;
  final bool solvedToday;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s4, vertical: 14),
      decoration: BoxDecoration(
        color: c.surface,
        border: Border.all(color: c.hairline),
        borderRadius: AppRadii.lgR,
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(color: c.accentTint, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: const FlameIcon(size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text.rich(
                  TextSpan(children: [
                    TextSpan(
                      text: '$streak',
                      style: AppTypography.tabular(AppTypography.small).copyWith(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        fontVariations: const [FontVariation('wght', 600)],
                        color: c.accent,
                      ),
                    ),
                    TextSpan(
                      text: ' day streak',
                      style: AppTypography.small.copyWith(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        fontVariations: const [FontVariation('wght', 600)],
                        color: c.fg1,
                      ),
                    ),
                  ]),
                ),
                const SizedBox(height: 1),
                Text(
                  solvedToday ? 'Solved today — streak safe' : 'Solve today to keep it going',
                  style: AppTypography.label.copyWith(
                    letterSpacing: 0,
                    fontWeight: FontWeight.w400,
                    fontVariations: const [FontVariation('wght', 400)],
                    color: c.fg3,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.s3),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (var i = 0; i < last7.length; i++) ...[
                if (i > 0) const SizedBox(width: 5),
                Container(
                  width: 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: last7[i] ? c.accent : c.hairline2,
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

/// First-run: no streak yet — a quiet nudge instead of a 0-day band.
class _EmptyStreakBand extends StatelessWidget {
  const _EmptyStreakBand();

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s4, vertical: 14),
      decoration: BoxDecoration(
        color: c.surface,
        border: Border.all(color: c.hairline),
        borderRadius: AppRadii.lgR,
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(color: c.bgSunken, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: const HalveMark(size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Start your streak today',
                  style: AppTypography.small.copyWith(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    fontVariations: const [FontVariation('wght', 600)],
                    color: c.fg1,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  'Solve your first puzzle to begin.',
                  style: AppTypography.label.copyWith(
                    letterSpacing: 0,
                    fontWeight: FontWeight.w400,
                    fontVariations: const [FontVariation('wght', 400)],
                    color: c.fg3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// date · difficulty · #number — uppercase tracked eyebrow row.
class _MetaRow extends StatelessWidget {
  const _MetaRow({required this.data});

  final HomeData data;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final style = AppTypography.label.copyWith(color: c.fg3);

    final items = <String>[
      data.dateLabel.toUpperCase(),
      if (data.puzzle != null) _difficultyLabel(data.puzzle!.difficulty).toUpperCase(),
      if (data.archiveCount != null) '#${data.archiveCount}',
    ];

    final children = <Widget>[];
    for (var i = 0; i < items.length; i++) {
      if (i > 0) {
        children
          ..add(const SizedBox(width: 9))
          ..add(Text('·', style: style.copyWith(color: c.hairline2, letterSpacing: 0)))
          ..add(const SizedBox(width: 9));
      }
      children.add(Text(items[i], style: style));
    }

    return Row(mainAxisSize: MainAxisSize.min, children: children);
  }
}

/// Offline + no cache: an inline notice with a reload.
class _OfflineNotice extends StatelessWidget {
  const _OfflineNotice({required this.onReload});

  final VoidCallback onReload;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s4, vertical: 13),
          decoration: BoxDecoration(
            color: c.bgSunken,
            border: Border.all(color: c.hairline),
            borderRadius: AppRadii.lgR,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Icon(Icons.wifi_off_rounded, size: 16, color: c.fg3),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Puzzle unavailable — try again shortly.',
                  style: AppTypography.small.copyWith(color: c.fg3, height: 1.5),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.s3),
        HalveButton(
          label: 'Reload',
          variant: HalveButtonVariant.secondary,
          full: true,
          onPressed: onReload,
        ),
      ],
    );
  }
}

/// Offline but a cached puzzle is playable: a slim banner above the CTA.
class _OfflineBanner extends StatelessWidget {
  const _OfflineBanner();

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.wifi_off_rounded, size: 14, color: c.fg3),
        const SizedBox(width: 8),
        Text(
          'Offline — showing a saved puzzle',
          style: AppTypography.small.copyWith(color: c.fg3),
        ),
      ],
    );
  }
}

/// No puzzle row exists for today yet.
class _EmptyPuzzleNotice extends StatelessWidget {
  const _EmptyPuzzleNotice();

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s4, vertical: 13),
      decoration: BoxDecoration(
        color: c.bgSunken,
        border: Border.all(color: c.hairline),
        borderRadius: AppRadii.lgR,
      ),
      child: Text(
        "Today's puzzle isn't ready yet — check back soon.",
        style: AppTypography.small.copyWith(color: c.fg3, height: 1.5),
      ),
    );
  }
}

/// Solved-today: a calm confirmation in place of the CTA.
class _SolvedBlock extends StatelessWidget {
  const _SolvedBlock({required this.durationMs});

  final int durationMs;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Icon(Icons.check_circle_rounded, size: 22, color: c.correct),
            const SizedBox(width: AppSpacing.s2),
            Text.rich(
              TextSpan(children: [
                TextSpan(
                  text: 'Solved in ',
                  style: AppTypography.body.copyWith(
                    fontWeight: FontWeight.w500,
                    fontVariations: const [FontVariation('wght', 500)],
                    color: c.fg1,
                  ),
                ),
                TextSpan(
                  text: _formatMs(durationMs),
                  style: AppTypography.tabular(AppTypography.body).copyWith(
                    fontWeight: FontWeight.w600,
                    fontVariations: const [FontVariation('wght', 600)],
                    color: c.fg1,
                  ),
                ),
              ]),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.s1),
        Padding(
          padding: const EdgeInsets.only(left: 22 + AppSpacing.s2),
          child: Text(
            'Next puzzle at midnight',
            style: AppTypography.small.copyWith(color: c.fg3),
          ),
        ),
        const SizedBox(height: AppSpacing.s4),
        HalveButton(
          label: 'See your stats',
          variant: HalveButtonVariant.secondary,
          full: true,
          onPressed: () => context.go(Routes.stats),
        ),
      ],
    );
  }
}

/// "Keep playing" — Practice + Archive destination cards.
class _KeepPlaying extends StatelessWidget {
  const _KeepPlaying({required this.data});

  final HomeData data;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final count = data.archiveCount;
    final last = data.yesterdayDifficulty;
    final archiveSub = count == null
        ? 'Past puzzles'
        : last == null
            ? '$count puzzles'
            : '$count puzzles · last ${_difficultyLabel(last).toLowerCase()}';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.s3),
          child: Text('KEEP PLAYING', style: AppTypography.label.copyWith(color: c.fg3)),
        ),
        Row(
          children: [
            Expanded(
              child: _DestCard(
                motif: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SymbolDisc(size: 24),
                    SizedBox(width: 6),
                    SymbolRing(size: 24),
                  ],
                ),
                title: 'Practice',
                sub: 'Any difficulty',
                onTap: () => context.push(Routes.practice),
              ),
            ),
            const SizedBox(width: AppSpacing.s3),
            Expanded(
              child: _DestCard(
                motif: const HalveMark(size: 26),
                title: 'Archive',
                sub: archiveSub,
                onTap: () => context.go(Routes.archive),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _DestCard extends StatelessWidget {
  const _DestCard({
    required this.motif,
    required this.title,
    required this.sub,
    required this.onTap,
  });

  final Widget motif;
  final String title;
  final String sub;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minHeight: 124),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: c.surface,
          border: Border.all(color: c.hairline),
          borderRadius: AppRadii.xlR,
          boxShadow: context.halveShadows.sm,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: 30, child: Center(child: motif)),
                Icon(Icons.chevron_right_rounded, size: 20, color: c.fg3),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: AppTypography.h3.copyWith(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    fontVariations: const [FontVariation('wght', 600)],
                    color: c.fg1,
                    letterSpacing: -0.17,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  sub,
                  style: AppTypography.small.copyWith(fontSize: 12.5, color: c.fg3),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _HowToPlayFooter extends StatelessWidget {
  const _HowToPlayFooter();

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Center(
      child: GestureDetector(
        onTap: () => context.push(Routes.tutorial),
        behavior: HitTestBehavior.opaque,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.s2),
          child: Text(
            'How to play',
            style: AppTypography.small.copyWith(
              color: c.fg2,
              fontWeight: FontWeight.w500,
              fontVariations: const [FontVariation('wght', 500)],
            ),
          ),
        ),
      ),
    );
  }
}

String _difficultyLabel(Difficulty d) => switch (d) {
      Difficulty.easy => 'Easy',
      Difficulty.medium => 'Medium',
      Difficulty.hard => 'Hard',
    };

/// Format a duration in ms as `m:ss`.
String _formatMs(int ms) {
  final totalSeconds = (ms / 1000).round();
  final m = totalSeconds ~/ 60;
  final s = (totalSeconds % 60).toString().padLeft(2, '0');
  return '$m:$s';
}
