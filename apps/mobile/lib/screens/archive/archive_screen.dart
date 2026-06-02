import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/local_date.dart';
import '../../router/app_router.dart';
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';
import 'archive_provider.dart';

const _weekdayInitials = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/// Archive — a month calendar of past dailies. Each day shows its solved /
/// missed / today / future state and 1–3 difficulty dots; tapping a playable
/// day opens that puzzle. Month navigation has three equivalent affordances
/// (chevrons, a month-picker sheet, horizontal swipe). Mirrors the wireframe
/// `Archive` + `MonthPickerSheet` and `HANDOFF.md` §5.
class ArchiveScreen extends ConsumerStatefulWidget {
  const ArchiveScreen({super.key});

  @override
  ConsumerState<ArchiveScreen> createState() => _ArchiveScreenState();
}

class _ArchiveScreenState extends ConsumerState<ArchiveScreen> {
  /// The viewed month; null until data loads (then defaults to today's month).
  Ym? _view;

  /// Deferred until first build after the frame to avoid eagerly starting the
  /// archiveDataProvider when IndexedStack builds all shell branches at launch.
  bool _activated = false;

  @override
  void initState() {
    super.initState();
    // Kick off the fetch one frame after mount so IndexedStack's initial
    // build of all branches doesn't fire the provider until the user
    // actually lands on this tab for the first time.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) setState(() => _activated = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_activated) {
      // Show the header + skeleton so there's no flash of blank content.
      return const SafeScaffold(
        body: Column(
          children: [_ArchiveHeader(), Expanded(child: SizedBox())],
        ),
      );
    }
    final async = ref.watch(archiveDataProvider);
    return SafeScaffold(
      body: Column(
        children: [
          const _ArchiveHeader(),
          Expanded(
            child: async.when(
              data: (data) => data.isEmpty
                  ? _EmptyArchive(
                      offline: data.offline,
                      onRefresh: _refresh,
                    )
                  : _ArchiveBody(
                      data: data,
                      view: _effectiveView(data),
                      onView: (ym) => setState(() => _view = ym),
                      onRefresh: _refresh,
                    ),
              loading: () =>
                  const Center(child: CircularProgressIndicator.adaptive()),
              error: (_, _) => _EmptyArchive(offline: true, onRefresh: _refresh),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _refresh() => ref.refresh(archiveDataProvider.future);

  /// The current view month, clamped to the available range.
  Ym _effectiveView(ArchiveData data) {
    final v = _view;
    if (v != null && data.months.contains(v)) return v;
    return data.currentMonth;
  }
}

class _ArchiveHeader extends StatelessWidget {
  const _ArchiveHeader();

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Padding(
      padding: EdgeInsets.fromLTRB(
          context.hPagePad, AppSpacing.s3, context.hPagePad, AppSpacing.s1),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          'Archive',
          style: AppTypography.h2.copyWith(
            fontWeight: FontWeight.w600,
            fontVariations: const [FontVariation('wght', 600)],
            color: c.fg1,
          ),
        ),
      ),
    );
  }
}

class _ArchiveBody extends StatelessWidget {
  const _ArchiveBody({
    required this.data,
    required this.view,
    required this.onView,
    required this.onRefresh,
  });

  final ArchiveData data;
  final Ym view;
  final ValueChanged<Ym> onView;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final oldest = data.months.first;
    final current = data.months.last;
    final prev = prevMonth(view, oldest);
    final next = nextMonth(view, current);

    final hPad = context.hPagePad;
    return GestureDetector(
      onHorizontalDragEnd: (d) {
        final v = d.primaryVelocity ?? 0;
        if (v < 0 && next != null) {
          onView(next);
        } else if (v > 0 && prev != null) {
          onView(prev);
        }
      },
      child: RefreshIndicator.adaptive(
        onRefresh: onRefresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(hPad, AppSpacing.s1, hPad, AppSpacing.s6),
          children: [
            _MonthNav(
              view: view,
              canPrev: prev != null,
              canNext: next != null,
              onPrev: prev == null ? null : () => onView(prev),
              onNext: next == null ? null : () => onView(next),
              onOpenPicker: () => _openPicker(context),
            ),
            const SizedBox(height: AppSpacing.s1),
            _MonthSummary(stats: data.monthStats(view)),
            const SizedBox(height: AppSpacing.s2),
            _MonthGrid(data: data, view: view),
            const SizedBox(height: AppSpacing.s4),
            const _Legend(),
          ],
        ),
      ),
    );
  }

  Future<void> _openPicker(BuildContext context) async {
    final picked = await showHalveBottomSheet<Ym>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _MonthPicker(data: data, selected: view),
    );
    if (picked != null) onView(picked);
  }
}

/// Prev / label / next month controls.
class _MonthNav extends StatelessWidget {
  const _MonthNav({
    required this.view,
    required this.canPrev,
    required this.canNext,
    required this.onPrev,
    required this.onNext,
    required this.onOpenPicker,
  });

  final Ym view;
  final bool canPrev;
  final bool canNext;
  final VoidCallback? onPrev;
  final VoidCallback? onNext;
  final VoidCallback onOpenPicker;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        HalveIconButton(
          semanticLabel: 'Previous month',
          size: 44,
          onPressed: onPrev,
          child: const Icon(Icons.chevron_left),
        ),
        GestureDetector(
          onTap: onOpenPicker,
          behavior: HitTestBehavior.opaque,
          child: Padding(
            padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.s3, vertical: AppSpacing.s2),
            child: Text(
              '${kMonthNames[view.$2 - 1]} ${view.$1}'.toUpperCase(),
              style: AppTypography.label.copyWith(
                fontSize: 13,
                letterSpacing: 0.52, // 0.04em
                color: c.fg1,
              ),
            ),
          ),
        ),
        HalveIconButton(
          semanticLabel: 'Next month',
          size: 44,
          onPressed: onNext,
          child: const Icon(Icons.chevron_right),
        ),
      ],
    );
  }
}

/// Centred "N / M SOLVED" stat strip for the viewed month. Mirrors the web's
/// MonthSummary row that sits between the nav and the calendar grid.
class _MonthSummary extends StatelessWidget {
  const _MonthSummary({required this.stats});

  final (int solved, int total) stats;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final (solved, total) = stats;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text.rich(
          TextSpan(children: [
            TextSpan(
              text: '$solved / $total',
              style: AppTypography.tabular(AppTypography.small).copyWith(
                fontWeight: FontWeight.w600,
                fontVariations: const [FontVariation('wght', 600)],
                color: c.fg1,
              ),
            ),
            const TextSpan(text: ' '),
            TextSpan(
              text: 'SOLVED',
              style: AppTypography.label.copyWith(color: c.fg3),
            ),
          ]),
        ),
      ],
    );
  }
}

/// The 7-column day grid for the viewed month.
class _MonthGrid extends StatelessWidget {
  const _MonthGrid({required this.data, required this.view});

  final ArchiveData data;
  final Ym view;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final (year, month) = view;
    final days = daysInMonth(year, month);
    final offset = firstWeekdayOffset(year, month);

    final cells = <Widget>[
      for (final w in _weekdayInitials)
        Center(
          child: Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.s1),
            child: Text(
              w,
              style: AppTypography.label.copyWith(
                fontSize: 11,
                letterSpacing: 0,
                color: c.fg3,
              ),
            ),
          ),
        ),
      for (var i = 0; i < offset; i++) const SizedBox.shrink(),
      for (var d = 1; d <= days; d++)
        _DayCell(
          date: _dateStr(year, month, d),
          day: d,
          data: data,
        ),
    ];

    return GridView.count(
      crossAxisCount: 7,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: AppSpacing.s2,
      crossAxisSpacing: AppSpacing.s2,
      childAspectRatio: 0.82, // ~56px tall cells
      children: cells,
    );
  }
}

enum _DayState { solved, missed, today, future }

class _DayCell extends StatelessWidget {
  const _DayCell({required this.date, required this.day, required this.data});

  final String date;
  final int day;
  final ArchiveData data;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final entry = data.byDate[date];
    final state = _state();

    final Color bg;
    final BoxBorder border;
    final Color numColor;
    switch (state) {
      case _DayState.solved:
        bg = c.accentTint;
        border = Border.all(color: c.accent, width: 1.5);
        numColor = c.accent;
      case _DayState.today:
        bg = Colors.transparent;
        border = Border.all(color: c.accent, width: 2);
        numColor = c.accent;
      case _DayState.missed:
      case _DayState.future:
        bg = Colors.transparent;
        border = Border.all(
          color: c.hairline2,
          width: 1,
          style: BorderStyle.solid, // dashed not supported natively; hairline
        );
        numColor = c.fg3;
    }

    final tappable = state == _DayState.today ||
        ((state == _DayState.solved || state == _DayState.missed) &&
            entry != null);

    final showDots =
        state != _DayState.future && entry != null; // past + today w/ a puzzle

    final cell = Opacity(
      opacity: state == _DayState.future ? 0.3 : 1,
      child: Container(
        key: ValueKey('arc-day-$date'),
        decoration: BoxDecoration(
          color: bg,
          border: border,
          borderRadius: AppRadii.mdR,
        ),
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '$day',
              style: AppTypography.tabular(AppTypography.label).copyWith(
                fontSize: 12,
                letterSpacing: 0,
                color: numColor,
              ),
            ),
            if (showDots)
              _DifficultyDots(
                count: entry.difficulty.dots,
                color: state == _DayState.solved ? c.fg1 : c.fg3,
              )
            else
              const SizedBox(height: 4),
          ],
        ),
      ),
    );

    if (!tappable) return cell;
    return GestureDetector(
      onTap: () => _open(context, state),
      behavior: HitTestBehavior.opaque,
      child: cell,
    );
  }

  _DayState _state() {
    if (date == data.today) return _DayState.today;
    final isPast = date.compareTo(data.today) < 0;
    if (!isPast) return _DayState.future;
    return (data.byDate[date]?.solved ?? false)
        ? _DayState.solved
        : _DayState.missed;
  }

  void _open(BuildContext context, _DayState state) {
    if (state == _DayState.today) {
      context.push(Routes.play);
    } else {
      context.push(Routes.playDate(date));
    }
  }
}

class _DifficultyDots extends StatelessWidget {
  const _DifficultyDots({required this.count, required this.color});

  final int count;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 4,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < count; i++) ...[
            if (i > 0) const SizedBox(width: 2.5),
            Container(
              width: 4,
              height: 4,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            ),
          ],
        ],
      ),
    );
  }
}

/// The inline state legend beneath the grid.
class _Legend extends StatelessWidget {
  const _Legend();

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    Widget swatch(Color? bg, BoxBorder border) => Container(
          width: 11,
          height: 11,
          decoration: BoxDecoration(
            color: bg,
            border: border,
            borderRadius: BorderRadius.circular(3),
          ),
        );

    final items = <(Widget, String)>[
      (swatch(c.accentTint, Border.all(color: c.accent, width: 1.5)), 'Solved'),
      (swatch(null, Border.all(color: c.hairline2)), 'Not solved'),
      (swatch(null, Border.all(color: c.accent, width: 2)), 'Today'),
      (
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (var i = 0; i < 3; i++) ...[
              if (i > 0) const SizedBox(width: 2.5),
              Container(
                width: 4,
                height: 4,
                decoration: BoxDecoration(color: c.fg3, shape: BoxShape.circle),
              ),
            ],
          ],
        ),
        'Difficulty'
      ),
    ];

    return Wrap(
      spacing: 14,
      runSpacing: 6,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        for (final (icon, label) in items)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              icon,
              const SizedBox(width: 5),
              Text(label,
                  style: AppTypography.small
                      .copyWith(fontSize: 11, color: c.fg3)),
            ],
          ),
      ],
    );
  }
}

/// The month-picker sheet: every available month, newest first, with a
/// solved/total count; the current view is accent-tinted.
class _MonthPicker extends StatelessWidget {
  const _MonthPicker({required this.data, required this.selected});

  final ArchiveData data;
  final Ym selected;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final months = data.months.reversed.toList();
    return ListView.builder(
      shrinkWrap: true,
      itemCount: months.length,
      itemBuilder: (context, i) {
        final ym = months[i];
        final (solved, total) = data.monthStats(ym);
        final isSel = ym == selected;
        return GestureDetector(
          onTap: () => Navigator.of(context).pop(ym),
          behavior: HitTestBehavior.opaque,
          child: Container(
            constraints: const BoxConstraints(minHeight: 52),
            color: isSel ? c.accentTint : Colors.transparent,
            padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.s5, vertical: 15),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${kMonthNames[ym.$2 - 1]} ${ym.$1}',
                  style: AppTypography.body.copyWith(
                    fontSize: 15,
                    fontWeight: isSel ? FontWeight.w600 : FontWeight.w400,
                    fontVariations: [FontVariation('wght', isSel ? 600 : 400)],
                    color: isSel ? c.accent : c.fg1,
                  ),
                ),
                Text.rich(
                  TextSpan(children: [
                    TextSpan(text: '$solved'),
                    TextSpan(
                        text: '/', style: TextStyle(color: c.hairline2)),
                    TextSpan(text: '$total'),
                  ]),
                  style: AppTypography.tabular(AppTypography.small).copyWith(
                    color: isSel ? c.accent : c.fg3,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _EmptyArchive extends StatelessWidget {
  const _EmptyArchive({required this.offline, required this.onRefresh});

  final bool offline;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    // CustomScrollView so RefreshIndicator.adaptive has a scrollable to attach to.
    return RefreshIndicator.adaptive(
      onRefresh: onRefresh,
      child: CustomScrollView(
        slivers: [
          SliverFillRemaining(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.s5),
                child: Text(
                  offline
                      ? "Can't load the archive right now — try again shortly."
                      : 'No puzzles yet — check back soon.',
                  textAlign: TextAlign.center,
                  style: AppTypography.small.copyWith(color: c.fg3, height: 1.5),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

String _dateStr(int year, int month, int day) =>
    '${year.toString().padLeft(4, '0')}-'
    '${month.toString().padLeft(2, '0')}-'
    '${day.toString().padLeft(2, '0')}';
