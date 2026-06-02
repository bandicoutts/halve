import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/providers.dart';
import '../../theme/app_radii.dart';
import '../../theme/app_spacing.dart';
import '../../theme/app_theme.dart';
import '../../theme/app_typography.dart';
import '../../theme/breakpoints.dart';
import '../../widgets/widgets.dart';
import 'stats_provider.dart';

// ─── Time format helper ───────────────────────────────────────────────────────

String _fmtMs(int? ms) {
  if (ms == null) return '—';
  final s = (ms / 1000).round();
  final m = s ~/ 60;
  return '$m:${(s % 60).toString().padLeft(2, '0')}';
}

// ─── Monogram avatar ─────────────────────────────────────────────────────────

class _Monogram extends StatelessWidget {
  // ignore: unused_element_parameter
  const _Monogram({required this.name, this.size = 48});

  final String name;
  final double size;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: c.accentTint,
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: AppTypography.tabular(
          AppTypography.h2.copyWith(
            color: c.accent,
            fontSize: size * 0.44,
            fontWeight: FontWeight.w600,
            height: 1,
          ),
        ),
      ),
    );
  }
}

// ─── Eyebrow label ───────────────────────────────────────────────────────────

class _Eyebrow extends StatelessWidget {
  const _Eyebrow(this.text, {this.trailing});

  final String text;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          text.toUpperCase(),
          style: AppTypography.label.copyWith(color: c.fg3),
        ),
        ?trailing,
      ],
    );
  }
}

// ─── Streak hero card ─────────────────────────────────────────────────────────

class _StreakHero extends StatelessWidget {
  const _StreakHero({required this.streak, required this.longestStreak});

  final int streak;
  final int longestStreak;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Container(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.s5, 22, AppSpacing.s5, 20),
      decoration: BoxDecoration(
        color: c.surface,
        border: Border.all(color: c.hairline),
        borderRadius: AppRadii.xlR,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  FlameIcon(size: 18, color: c.accent),
                  const SizedBox(width: AppSpacing.s2),
                  Text(
                    'Day streak',
                    style: AppTypography.label.copyWith(color: c.fg3),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.s1),
              Text(
                '$streak',
                key: const ValueKey('stat-streak'),
                style: AppTypography.tabular(
                  AppTypography.display.copyWith(
                    color: c.accent,
                    fontSize: 66,
                    height: 0.95,
                  ),
                ),
              ),
            ],
          ),
          const Spacer(),
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '$longestStreak',
                  key: const ValueKey('stat-longest'),
                  style: AppTypography.tabular(
                    AppTypography.h2.copyWith(color: c.fg2, height: 1),
                  ),
                ),
                const SizedBox(height: AppSpacing.s1 + 2),
                Text(
                  'Best ever',
                  style: AppTypography.label.copyWith(color: c.fg3),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── 14-day calendar grid ────────────────────────────────────────────────────

class _Cal14 extends StatelessWidget {
  const _Cal14({required this.days});

  final List<bool> days;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final safeDays = days.length >= 14
        ? days.sublist(days.length - 14)
        : [...List.filled(14 - days.length, false), ...days];
    final rows = [
      (label: 'Last week', cells: safeDays.sublist(0, 7)),
      (label: 'This week', cells: safeDays.sublist(7)),
    ];

    return Column(
      children: [
        for (var ri = 0; ri < rows.length; ri++)
          Padding(
            padding: EdgeInsets.only(top: ri == 0 ? 0 : AppSpacing.s2),
            child: Row(
              children: [
                SizedBox(
                  width: 76,
                  child: Text(
                    rows[ri].label,
                    style: AppTypography.label.copyWith(
                      color: c.fg3,
                      letterSpacing: 0.04,
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.s3),
                Expanded(
                  child: Row(
                    children: [
                      for (var i = 0; i < rows[ri].cells.length; i++)
                        Expanded(
                          child: Padding(
                            padding: EdgeInsets.only(
                                left: i == 0 ? 0 : AppSpacing.s1 + 2),
                            child: AspectRatio(
                              aspectRatio: 1,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: rows[ri].cells[i]
                                      ? c.accent
                                      : c.bgSunken,
                                  borderRadius: AppRadii.smR,
                                  border: Border.all(
                                    color: ri == 1 &&
                                            i == rows[ri].cells.length - 1
                                        ? c.fg1
                                        : rows[ri].cells[i]
                                            ? c.accent
                                            : c.hairline,
                                    width: ri == 1 &&
                                            i == rows[ri].cells.length - 1
                                        ? 2
                                        : 1,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

// ─── Solve-time area chart ────────────────────────────────────────────────────

const _distLabels = ['<2m', '2–3', '3–4', '4–5', '5–6', '6+m'];

class _AreaChart extends StatelessWidget {
  const _AreaChart({required this.dist});

  final List<int> dist;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return SizedBox(
      height: 132,
      child: CustomPaint(
        painter: _AreaPainter(
          dist: dist,
          accentColor: c.accent,
          accentTint: c.accentTint,
          hairline: c.hairline,
          fg3: c.fg3,
          surfaceColor: c.surface,
        ),
        size: Size.infinite,
      ),
    );
  }
}

class _AreaPainter extends CustomPainter {
  const _AreaPainter({
    required this.dist,
    required this.accentColor,
    required this.accentTint,
    required this.hairline,
    required this.fg3,
    required this.surfaceColor,
  });

  final List<int> dist;
  final Color accentColor;
  final Color accentTint;
  final Color hairline;
  final Color fg3;
  final Color surfaceColor;

  @override
  void paint(Canvas canvas, Size size) {
    const padX = 14.0;
    const padTop = 22.0;
    const padBot = 30.0;
    final W = size.width;
    final H = size.height;
    final n = dist.length;
    final maxVal = dist.fold(1, math.max<int>);
    final peakIdx = dist.indexOf(dist.reduce(math.max));
    final stepX = (W - padX * 2) / (n - 1);

    double xFor(int i) => padX + i * stepX;
    double yFor(int v) => padTop + (1 - v / maxVal) * (H - padTop - padBot);

    final pts = [for (var i = 0; i < n; i++) Offset(xFor(i), yFor(dist[i]))];

    // Baseline
    canvas.drawLine(
      Offset(padX, H - padBot),
      Offset(W - padX, H - padBot),
      Paint()
        ..color = hairline
        ..strokeWidth = 1,
    );

    // Catmull-rom smooth path
    final linePath = _smoothPath(pts);

    // Area fill
    final areaPath = Path.from(linePath)
      ..lineTo(pts.last.dx, H - padBot)
      ..lineTo(pts.first.dx, H - padBot)
      ..close();
    canvas.drawPath(areaPath, Paint()..color = accentTint);

    // Stroke
    canvas.drawPath(
      linePath,
      Paint()
        ..color = accentColor
        ..strokeWidth = 2.5
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round
        ..isAntiAlias = true,
    );

    // Peak dot (outer, surface ring, inner)
    canvas.drawCircle(pts[peakIdx], 4.5, Paint()..color = accentColor);
    canvas.drawCircle(pts[peakIdx], 3.0, Paint()..color = surfaceColor);
    canvas.drawCircle(pts[peakIdx], 2.0, Paint()..color = accentColor);

    // Labels
    final tp = TextPainter(textDirection: TextDirection.ltr);
    for (var i = 0; i < n; i++) {
      tp.text = TextSpan(
        text: _distLabels[i],
        style: TextStyle(
          fontFamily: 'SpaceGrotesk',
          fontSize: 10.5,
          fontWeight: i == peakIdx ? FontWeight.w700 : FontWeight.w500,
          color: i == peakIdx ? accentColor : fg3,
          letterSpacing: 0.02,
        ),
      );
      tp.layout();
      tp.paint(
          canvas, Offset(xFor(i) - tp.width / 2, H - padBot + 6));
    }
  }

  Path _smoothPath(List<Offset> pts) {
    final path = Path()..moveTo(pts[0].dx, pts[0].dy);
    for (var i = 0; i < pts.length - 1; i++) {
      final p0 = i > 0 ? pts[i - 1] : pts[i];
      final p1 = pts[i];
      final p2 = pts[i + 1];
      final p3 = i + 2 < pts.length ? pts[i + 2] : p2;
      final c1 = Offset(
          p1.dx + (p2.dx - p0.dx) / 6, p1.dy + (p2.dy - p0.dy) / 6);
      final c2 = Offset(
          p2.dx - (p3.dx - p1.dx) / 6, p2.dy - (p3.dy - p1.dy) / 6);
      path.cubicTo(c1.dx, c1.dy, c2.dx, c2.dy, p2.dx, p2.dy);
    }
    return path;
  }

  @override
  bool shouldRepaint(_AreaPainter old) =>
      old.dist != dist || old.accentColor != accentColor;
}

// ─── Divided stat tile (avg / best) ──────────────────────────────────────────

class _StatDivided extends StatelessWidget {
  const _StatDivided({required this.items});

  final List<({String value, String label, bool accent})> items;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Container(
      decoration: BoxDecoration(
        color: c.surface,
        border: Border.all(color: c.hairline),
        borderRadius: AppRadii.lgR,
      ),
      clipBehavior: Clip.antiAlias,
      child: Row(
        children: [
          for (var i = 0; i < items.length; i++)
            Expanded(
              child: Container(
                key: ValueKey('stat-tile-${items[i].label}'),
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.s3,
                  vertical: AppSpacing.s4,
                ),
                decoration: BoxDecoration(
                  border: i > 0
                      ? Border(left: BorderSide(color: c.hairline))
                      : null,
                ),
                child: Column(
                  children: [
                    Text(
                      items[i].value,
                      style: AppTypography.tabular(
                        AppTypography.h2.copyWith(
                          color: items[i].accent ? c.accent : c.fg1,
                          height: 1,
                          fontSize: 22,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.s2),
                    Text(
                      items[i].label,
                      style: AppTypography.label.copyWith(color: c.fg3),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ─── Sign-out icon ────────────────────────────────────────────────────────────

class _SignOutIcon extends StatelessWidget {
  const _SignOutIcon();

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: const Size(17, 17),
      painter: _SignOutPainter(color: context.halveColors.fg2),
    );
  }
}

class _SignOutPainter extends CustomPainter {
  _SignOutPainter({required this.color});
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / 24, size.height / 24);
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.75
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..isAntiAlias = true;

    // Door frame: M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4
    final door = Path()
      ..moveTo(9, 21)
      ..lineTo(5, 21)
      ..arcToPoint(const Offset(3, 19),
          radius: const Radius.circular(2), clockwise: false)
      ..lineTo(3, 5)
      ..arcToPoint(const Offset(5, 3),
          radius: const Radius.circular(2), clockwise: false)
      ..lineTo(9, 3);
    canvas.drawPath(door, paint);

    // Arrow
    final arrow = Path()
      ..moveTo(16, 17)
      ..lineTo(21, 12)
      ..lineTo(16, 7);
    canvas.drawPath(arrow, paint);

    // Shaft
    canvas.drawLine(const Offset(21, 12), const Offset(9, 12), paint);
  }

  @override
  bool shouldRepaint(_SignOutPainter old) => old.color != color;
}

// ─── Since-date formatter ─────────────────────────────────────────────────────

const _monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

String _fmtSince(String? iso) {
  if (iso == null) return '';
  final parts = iso.split('-');
  if (parts.length < 2) return '';
  final month = int.tryParse(parts[1]);
  final year = int.tryParse(parts[0]);
  if (month == null || year == null || month < 1 || month > 12) return '';
  return 'since ${_monthNames[month - 1]} $year';
}

// ─── Empty state ──────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s9),
      child: Column(
        children: [
          const HalveMark(size: 36),
          const SizedBox(height: AppSpacing.s4),
          Text(
            'Solve your first puzzle',
            style: AppTypography.h3.copyWith(color: c.fg1),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.s2),
          Text(
            'Your stats will appear here after your first solve.',
            style: AppTypography.body.copyWith(color: c.fg2),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

class _LoadingSkeleton extends StatelessWidget {
  const _LoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Skeleton(
                width: 48,
                height: 48,
                borderRadius: BorderRadius.circular(24)),
            const SizedBox(width: AppSpacing.s4),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Skeleton(width: 120, height: 18),
                SizedBox(height: 6),
                Skeleton(width: 80, height: 12),
              ],
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.s5),
        const Skeleton(height: 112),
        const SizedBox(height: AppSpacing.s5),
        const Skeleton(height: 64),
        const SizedBox(height: AppSpacing.s5),
        const Skeleton(height: 132),
        const SizedBox(height: AppSpacing.s4),
        const Skeleton(height: 72),
      ],
    );
  }
}

// ─── Signed-in record ────────────────────────────────────────────────────────

class _StatsRecord extends ConsumerWidget {
  const _StatsRecord({required this.data});

  final StatsData data;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.halveColors;
    final stats = data.stats!;
    final name = data.displayName ?? '';
    final since = _fmtSince(stats.since);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Identity row
        Row(
          children: [
            _Monogram(name: name),
            const SizedBox(width: AppSpacing.s4),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: AppTypography.h3.copyWith(
                    color: c.fg1,
                    fontSize: 23,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.01,
                  ),
                ),
                const SizedBox(height: 2),
                RichText(
                  text: TextSpan(
                    style: AppTypography.small.copyWith(color: c.fg3),
                    children: [
                      TextSpan(
                        text: '${stats.totalSolved}',
                        style: AppTypography.tabular(
                          AppTypography.small.copyWith(color: c.fg3),
                        ),
                      ),
                      const TextSpan(text: ' solved'),
                      if (since.isNotEmpty) TextSpan(text: ' · $since'),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.s5),

        // Streak hero
        _StreakHero(
          streak: stats.currentStreak,
          longestStreak: stats.longestStreak,
        ),

        if (!data.hasSolves)
          const _EmptyState()
        else ...[
          // Last 14 days
          const SizedBox(height: 28),
          const _Eyebrow('Last 14 days'),
          const SizedBox(height: 14),
          _Cal14(days: stats.last14Days),

          // Solve-time chart
          const SizedBox(height: 28),
          _Eyebrow(
            'Solve time',
            trailing: Text(
              'avg ${_fmtMs(stats.averageMs)}',
              style: AppTypography.label
                  .copyWith(color: c.fg3, letterSpacing: 0),
            ),
          ),
          const SizedBox(height: 14),
          _AreaChart(dist: stats.timeDist),

          // Avg + best time
          const SizedBox(height: AppSpacing.s4),
          _StatDivided(items: [
            (
              value: _fmtMs(stats.averageMs),
              label: 'Average',
              accent: false
            ),
            (
              value: _fmtMs(stats.fastestMs),
              label: 'Best time',
              accent: false
            ),
          ]),
        ],

        // Sign out
        const SizedBox(height: AppSpacing.s6),
        Center(
          child: HalveButton(
            label: 'Sign out',
            variant: HalveButtonVariant.secondary,
            leadingIcon: const _SignOutIcon(),
            onPressed: () async {
              final repo = ref.read(authRepositoryProvider);
              await repo.signOut();
              if (context.mounted) context.go('/');
            },
          ),
        ),
        const SizedBox(height: AppSpacing.s4),
      ],
    );
  }
}

// ─── Guest state ──────────────────────────────────────────────────────────────

class _StatsGuest extends StatelessWidget {
  const _StatsGuest();

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final mockDist = [12, 31, 58, 41, 22, 20];
    final mockDays = List.generate(14, (i) => i % 3 != 0);

    return Stack(
      children: [
        // Blurred mock backdrop
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: IgnorePointer(
            child: Opacity(
              opacity: 0.45,
              child: ShaderMask(
                shaderCallback: (bounds) => const LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.black, Colors.transparent],
                  stops: [0.0, 0.86],
                ).createShader(bounds),
                blendMode: BlendMode.dstIn,
                child: ImageFiltered(
                  imageFilter:
                      ui.ImageFilter.blur(sigmaX: 4, sigmaY: 4),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(
                        AppSpacing.s5, 14, AppSpacing.s5, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const _Monogram(name: 'D'),
                            const SizedBox(width: AppSpacing.s4),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'david',
                                  style: AppTypography.h3.copyWith(
                                    color: c.fg1,
                                    fontSize: 23,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '184 solved · since January 2026',
                                  style:
                                      AppTypography.small.copyWith(color: c.fg3),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.s5),
                        const _StreakHero(streak: 8, longestStreak: 23),
                        const SizedBox(height: AppSpacing.s5),
                        _Cal14(days: mockDays),
                        const SizedBox(height: AppSpacing.s5),
                        _AreaChart(dist: mockDist),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),

        // CTA
        Align(
          alignment: const Alignment(0, -0.1),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s5),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const HalveMark(size: 40),
                const SizedBox(height: 18),
                Text(
                  'Start your record',
                  style: AppTypography.h2.copyWith(
                    color: c.fg1,
                    height: 1.15,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),
                Text(
                  'Sign in to keep your streak, track your solve times, and build a history of every puzzle.',
                  style: AppTypography.small.copyWith(
                    color: c.fg2,
                    height: 1.5,
                    fontSize: 14.5,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 22),
                HalveButton(
                  label: 'Sign in',
                  full: true,
                  onPressed: () => context.push('/auth'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Error state ──────────────────────────────────────────────────────────────

class _ErrorState extends StatelessWidget {
  const _ErrorState();

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.s5),
        child: Text(
          'Could not load stats. Check your connection.',
          style: AppTypography.body.copyWith(color: c.fg3),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

// ─── Public screen ────────────────────────────────────────────────────────────

/// Stats tab: streak history, 14-day calendar, solve-time area chart.
/// Signed-out: blurred mock backdrop + "Start your record" sign-in prompt.
/// Signed-in, no solves: calm empty-state nudge.
class StatsScreen extends ConsumerWidget {
  const StatsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(statsDataProvider);

    return SafeScaffold(
      body: Column(
        children: [
          const HalveTopBar(title: 'Statistics'),
          Expanded(
            child: async.when(
              loading: () => Builder(builder: (context) {
                final hPad = context.hPagePad;
                return SingleChildScrollView(
                  padding: EdgeInsets.fromLTRB(
                      hPad, AppSpacing.s4, hPad, AppSpacing.s7),
                  child: const _LoadingSkeleton(),
                );
              }),
              error: (_, _) => const _ErrorState(),
              data: (data) {
                if (!data.signedIn) {
                  return const _StatsGuest();
                }
                return Builder(builder: (context) {
                  final hPad = context.hPagePad;
                  return SingleChildScrollView(
                    padding: EdgeInsets.fromLTRB(
                        hPad, AppSpacing.s4, hPad, AppSpacing.s7),
                    child: _StatsRecord(data: data),
                  );
                });
              },
            ),
          ),
        ],
      ),
    );
  }
}
