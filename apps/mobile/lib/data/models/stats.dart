import 'solve.dart';

/// Derived player statistics. Computed from `solves` rows — never denormalized
/// (project rule). Phase 11 builds the full Stats screen on top of this; the
/// streak rule here mirrors the web (bucket by the player's local day, falling
/// back to the UTC date of `solved_at` for legacy null-`local_date` rows, per
/// DECISIONS BE-3).
class Stats {
  const Stats({
    required this.totalSolved,
    required this.currentStreak,
    required this.longestStreak,
    this.fastestMs,
    this.averageMs,
  });

  final int totalSolved;
  final int currentStreak;
  final int longestStreak;
  final int? fastestMs;
  final int? averageMs;

  static const empty = Stats(totalSolved: 0, currentStreak: 0, longestStreak: 0);

  /// Derive stats from solve rows. [today] is the player's local day; defaults
  /// are injected by the caller (kept as a param so tests are deterministic).
  static Stats fromSolves(List<SolveRow> solves, {required DateTime today}) {
    if (solves.isEmpty) return empty;

    // Distinct local days (yyyy-MM-dd), normalised to midnight DateTimes.
    final days = <DateTime>{};
    for (final s in solves) {
      final iso = s.localDate ?? _utcDay(s.solvedAt);
      final parsed = DateTime.tryParse(iso);
      if (parsed != null) days.add(DateTime(parsed.year, parsed.month, parsed.day));
    }
    final sorted = days.toList()..sort();

    var longest = 0;
    var run = 0;
    DateTime? prev;
    for (final d in sorted) {
      if (prev != null && d.difference(prev).inDays == 1) {
        run += 1;
      } else {
        run = 1;
      }
      if (run > longest) longest = run;
      prev = d;
    }

    // Current streak: a run ending today or yesterday (so the streak survives
    // until the day's puzzle is missed).
    final t = DateTime(today.year, today.month, today.day);
    var current = 0;
    var cursor = sorted.contains(t)
        ? t
        : sorted.contains(t.subtract(const Duration(days: 1)))
            ? t.subtract(const Duration(days: 1))
            : null;
    final daySet = days;
    while (cursor != null && daySet.contains(cursor)) {
      current += 1;
      cursor = cursor.subtract(const Duration(days: 1));
    }

    final durations = solves.map((s) => s.durationMs).toList();
    final fastest = durations.reduce((a, b) => a < b ? a : b);
    final average =
        (durations.reduce((a, b) => a + b) / durations.length).round();

    return Stats(
      totalSolved: solves.length,
      currentStreak: current,
      longestStreak: longest,
      fastestMs: fastest,
      averageMs: average,
    );
  }

  static String _utcDay(DateTime dt) {
    final u = dt.toUtc();
    final mm = u.month.toString().padLeft(2, '0');
    final dd = u.day.toString().padLeft(2, '0');
    return '${u.year}-$mm-$dd';
  }
}
