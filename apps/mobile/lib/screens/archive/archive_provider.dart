import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/local_date.dart';
import '../../data/models/models.dart';
import '../../data/repositories/puzzle_repository.dart';
import '../../data/repositories/solve_repository.dart';
import '../../providers/providers.dart';

/// A `(year, month)` pair — month is 1-based (1 = January). Record value
/// equality lets it key maps and compare directly.
typedef Ym = (int year, int month);

/// Everything the Archive grid needs: the dated dailies (with the signed-in
/// user's solved-state layered on), the available month range derived from the
/// data, and per-month solved/total counts. Streaks/solved-state stay DERIVED
/// from `solves` (never denormalized).
class ArchiveData {
  ArchiveData({
    required this.days,
    required this.today,
    this.offline = false,
  })  : byDate = {for (final d in days) d.date: d},
        months = _deriveMonths(days, today);

  /// All dated dailies up to & including today, ascending.
  final List<ArchiveDay> days;

  /// The player's local day, `yyyy-MM-dd`.
  final String today;

  /// True when the live fetch failed (guest mode / no connection).
  final bool offline;

  /// Lookup by `yyyy-MM-dd`.
  final Map<String, ArchiveDay> byDate;

  /// Available months, oldest → newest (today's month last).
  final List<Ym> months;

  bool get isEmpty => days.isEmpty;

  /// Today's `(year, month)`.
  Ym get currentMonth => _ymOfDate(today);

  /// `(solved, total)` for [ym].
  (int solved, int total) monthStats(Ym ym) {
    var solved = 0;
    var total = 0;
    for (final d in days) {
      if (_ymOfDate(d.date) == ym) {
        total++;
        if (d.solved) solved++;
      }
    }
    return (solved, total);
  }

  static List<Ym> _deriveMonths(List<ArchiveDay> days, String today) {
    if (days.isEmpty) return const [];
    final oldest = _ymOfDate(days.first.date);
    final current = _ymOfDate(today);
    return monthsBetween(oldest, current);
  }
}

/// Loads [ArchiveData] — `fetchArchive(today)` for the dated dailies, plus (when
/// signed in) `fetchSolves` joined in-memory via `withSolves`. A thrown repo /
/// guest mode (no creds) degrades to an empty, offline result.
final archiveDataProvider = FutureProvider.autoDispose<ArchiveData>((ref) async {
  final today = localToday();

  PuzzleRepository? puzzleRepo;
  SolveRepository? solveRepo;
  try {
    puzzleRepo = ref.watch(puzzleRepositoryProvider);
    solveRepo = ref.watch(solveRepositoryProvider);
  } catch (_) {
    puzzleRepo = null;
    solveRepo = null;
  }

  if (puzzleRepo == null) {
    return ArchiveData(days: const [], today: today, offline: true);
  }

  try {
    var days = await puzzleRepo.fetchArchive(today);
    final user = ref.watch(currentUserProvider);
    if (user != null && solveRepo != null) {
      final solves = await solveRepo.fetchSolves(user.id);
      days = puzzleRepo.withSolves(days, solves);
    }
    return ArchiveData(days: days, today: today);
  } catch (_) {
    return ArchiveData(days: const [], today: today, offline: true);
  }
});

// ── pure month helpers (top-level for unit testing) ──────────────────────

/// Inclusive list of months from [oldest] to [current], ascending.
List<Ym> monthsBetween(Ym oldest, Ym current) {
  final out = <Ym>[];
  var (y, m) = oldest;
  while (y < current.$1 || (y == current.$1 && m <= current.$2)) {
    out.add((y, m));
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

/// Days in [month] of [year] (month 1-based).
int daysInMonth(int year, int month) => DateTime(year, month + 1, 0).day;

/// Blank leading cells before day 1, for a Sunday-first grid (Sun = 0 … Sat = 6).
int firstWeekdayOffset(int year, int month) =>
    DateTime(year, month, 1).weekday % 7;

/// The previous month, or null if it would fall before [oldest].
Ym? prevMonth(Ym ym, Ym oldest) {
  if (ym == oldest) return null;
  var (y, m) = ym;
  m--;
  if (m < 1) {
    m = 12;
    y--;
  }
  return (y, m);
}

/// The next month, or null if it would pass [current].
Ym? nextMonth(Ym ym, Ym current) {
  if (ym == current) return null;
  var (y, m) = ym;
  m++;
  if (m > 12) {
    m = 1;
    y++;
  }
  return (y, m);
}

Ym _ymOfDate(String date) {
  final p = date.split('-');
  return (int.parse(p[0]), int.parse(p[1]));
}
