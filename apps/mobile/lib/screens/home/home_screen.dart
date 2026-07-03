import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/local_date.dart';
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
      body: LayoutBuilder(
        builder: (ctx, constraints) {
          const topPad = AppSpacing.s4;
          const bottomPad = AppSpacing.s5;
          final isTablet = ctx.isTablet;
          final isLandscape =
              MediaQuery.orientationOf(ctx) == Orientation.landscape;
          final hPad = ctx.hPagePad;

          // Portrait tablet: ConstrainedBox(minHeight) + Column(center) vertically
          // centres the content block. constraints.maxHeight (confirmed 1095dp on
          // Pixel Tablet portrait) correctly excludes captionBar + HalveBottomNav
          // + shellBar; all MediaQuery padding is zero at this point (consumed by
          // outer shells). _LoadedBody uses mainAxisSize.min so the inner Column
          // sizes to content, leaving the outer Column free space to centre against.
          if (isTablet && !isLandscape) {
            return RefreshIndicator.adaptive(
              onRefresh: () => ref.refresh(homeDataProvider.future),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.fromLTRB(hPad, topPad, hPad, bottomPad),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight: constraints.maxHeight - topPad - bottomPad,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [body],
                  ),
                ),
              ),
            );
          }

          final inner = ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: constraints.maxHeight - topPad - bottomPad,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisAlignment: isTablet
                  ? MainAxisAlignment.spaceEvenly
                  : MainAxisAlignment.center,
              children: [body],
            ),
          );
          return RefreshIndicator.adaptive(
            onRefresh: () => ref.refresh(homeDataProvider.future),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.fromLTRB(hPad, topPad, hPad, bottomPad),
              child: inner,
            ),
          );
        },
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
        SizedBox(height: AppSpacing.s5),
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
        SizedBox(height: AppSpacing.s5),
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
    final c = context.halveColors;
    final isTablet = context.isTablet;
    final isLandscape =
        MediaQuery.orientationOf(context) == Orientation.landscape;

    // On tablet, constrain the CTA to a pill width that suits a large screen.
    Widget ctaButton(Widget btn) => isTablet
        ? Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 300),
              child: btn,
            ),
          )
        : btn;

    // Responsive gap helpers.
    double gap(double phone, {double portrait = -1, double landscape = -1}) {
      if (!isTablet) return phone;
      return isLandscape ? landscape : portrait;
    }

    // ── Primary block: heading + CTA + streak ─────────────────────────
    final primary = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (data.today.isNotEmpty) ...[
          isTablet ? Center(child: _MetaRow(data: data)) : _MetaRow(data: data),
          SizedBox(height: gap(AppSpacing.s3, portrait: 14, landscape: 10)),
        ],
        Text(
          formatShortDate(data.today),
          textAlign: isTablet ? TextAlign.center : TextAlign.start,
          style: AppTypography.h1.copyWith(
            fontSize: isTablet ? (isLandscape ? 52 : 62) : 44,
            height: 1.04,
            letterSpacing: isTablet ? -1.55 : -1.1,
            color: c.fg1,
          ),
        ),
        SizedBox(height: gap(AppSpacing.s5 - 2, portrait: 30, landscape: 22)),
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
          ctaButton(
            HalveButton(
              label: 'Play today',
              full: true,
              onPressed: () => context.push(Routes.play),
            ),
          ),
        ],
        // Streak band sits below the CTA — signed-in only, no gap when absent.
        if (data.signedIn) ...[
          SizedBox(height: gap(AppSpacing.s5 - 2, portrait: 28, landscape: 20)),
          _StreakRegion(data: data),
        ],
      ],
    );

    // ── Footer block: Keep playing + How to play ───────────────────────
    final footer = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _KeepPlaying(data: data),
        SizedBox(height: gap(AppSpacing.s6, portrait: 30, landscape: 22)),
        const _HowToPlayFooter(),
      ],
    );

    // mainAxisSize.min: size to content only, so the outer centering Column
    // (portrait tablet ConstrainedBox) retains free space to centre against.
    // Safe for phone too — in an unbounded scroll context max and min behave
    // identically (Column can't expand to infinity, falls back to content).
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        primary,
        SizedBox(height: gap(AppSpacing.s6, portrait: 30, landscape: 22)),
        footer,
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
        today: data.today,
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
    required this.today,
  });

  final int streak;
  final List<bool> last7;
  final bool solvedToday;
  final String today;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final isTablet = context.isTablet;
    final isLandscape =
        MediaQuery.orientationOf(context) == Orientation.landscape;
    final hPad = isTablet ? (isLandscape ? 18.0 : 24.0) : AppSpacing.s4;

    final streakTextRow = Row(
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
                solvedToday ? 'Solved today. Streak kept.' : 'Solve today to keep it going',
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
        if (!isTablet) ...[
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
      ],
    );

    return Container(
      padding: EdgeInsets.symmetric(horizontal: hPad, vertical: 14),
      decoration: BoxDecoration(
        color: c.surface,
        border: Border.all(color: c.hairline),
        borderRadius: AppRadii.lgR,
      ),
      child: isTablet
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                streakTextRow,
                const SizedBox(height: 14),
                _WeekCalendar(
                  last7: last7,
                  today: today,
                  solvedToday: solvedToday,
                  circleSize: isLandscape ? 32.0 : 38.0,
                ),
              ],
            )
          : streakTextRow,
    );
  }
}

/// Mon–Sun week calendar row shown inside the streak band on tablet.
class _WeekCalendar extends StatelessWidget {
  const _WeekCalendar({
    required this.last7,
    required this.today,
    required this.solvedToday,
    required this.circleSize,
  });

  final List<bool> last7;
  final String today;
  final bool solvedToday;
  final double circleSize;

  // last7 is oldest-first: index 0 = 6 days ago, index 6 = today.
  static const _dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        for (var i = 0; i < last7.length; i++)
          _DayCell(
            letter: _dayLetters[
                DateTime.parse(
                  // offsetDay(today, -(6-i)): i=0→6 days ago, i=6→today
                  _offsetDay(today, -(6 - i)),
                ).weekday -
                    1],
            solved: last7[i],
            isToday: i == last7.length - 1,
            circleSize: circleSize,
          ),
      ],
    );
  }

  static String _offsetDay(String date, int delta) {
    final parts = date.split('-');
    final d = DateTime(
      int.parse(parts[0]),
      int.parse(parts[1]),
      int.parse(parts[2]) + delta,
    );
    return '${d.year.toString().padLeft(4, '0')}-'
        '${d.month.toString().padLeft(2, '0')}-'
        '${d.day.toString().padLeft(2, '0')}';
  }
}

class _DayCell extends StatelessWidget {
  const _DayCell({
    required this.letter,
    required this.solved,
    required this.isToday,
    required this.circleSize,
  });

  final String letter;
  final bool solved;
  final bool isToday;
  final double circleSize;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;

    BoxDecoration circleDecoration;
    Widget? circleChild;

    if (solved) {
      // Solved (past or today): filled amber + checkmark.
      circleDecoration = BoxDecoration(
        color: c.accent,
        shape: BoxShape.circle,
      );
      circleChild = Icon(Icons.check_rounded, size: circleSize * 0.45, color: Colors.white);
    } else if (isToday) {
      // Today unsolved: amber outline ring with tint fill.
      circleDecoration = BoxDecoration(
        color: c.accentTint,
        shape: BoxShape.circle,
        border: Border.all(color: c.accent, width: 2),
      );
    } else {
      // Past missed: hairline ring, no fill.
      circleDecoration = BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: c.hairline2, width: 1),
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          letter,
          style: AppTypography.label.copyWith(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            fontVariations: const [FontVariation('wght', 600)],
            letterSpacing: 0.6,
            color: c.fg2,
          ),
        ),
        const SizedBox(height: 9),
        Container(
          width: circleSize,
          height: circleSize,
          decoration: circleDecoration,
          alignment: Alignment.center,
          child: circleChild,
        ),
      ],
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
      formatDayName(data.today).toUpperCase(),
      if (data.puzzle != null) data.puzzle!.difficulty.label.toUpperCase(),
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
	                  'Offline. No saved puzzle available.',
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
	          'Offline. Showing a saved puzzle',
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
        "Today's puzzle isn't ready yet. It usually arrives in the morning.",
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
                  text: formatMs(durationMs),
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
          label: 'Practice',
          variant: HalveButtonVariant.secondary,
          full: true,
          onPressed: () => context.push(Routes.practice),
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
            : '$count puzzles · last ${last.label.toLowerCase()}';

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
            SizedBox(width: context.isTablet ? 14 : AppSpacing.s3),
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
    final isTablet = context.isTablet;
    final isLandscape =
        MediaQuery.orientationOf(context) == Orientation.landscape;
    final minH = isTablet ? (isLandscape ? 128.0 : 172.0) : 124.0;
    final pad = isTablet ? (isLandscape ? 18.0 : 22.0) : 18.0;
    return TapFade(
      onTap: onTap,
      child: Container(
        constraints: BoxConstraints(minHeight: minH),
        padding: EdgeInsets.all(pad),
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
                const SizedBox(height: AppSpacing.s1),
                Text(
                  sub,
                  style: AppTypography.small.copyWith(fontSize: 12.5, color: c.fg3),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
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
      child: TapFade(
        onTap: () => context.push(Routes.tutorial),
        child: Container(
          constraints: const BoxConstraints(minHeight: 44),
          alignment: Alignment.center,
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s2),
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
