import '../local_date.dart';
import '../streak.dart';
import 'solve.dart';

/// Derived player statistics. Computed from `solves` rows — never denormalized
/// (project rule). The streak fields use [computeStreak] / [computeLongestStreak]
/// from `streak.dart` directly so they match the web math exactly (reconciled
/// in Phase 11 — the old DateTime-based logic was equivalent but untested
/// against the web reference functions).
class Stats {
  const Stats({
    required this.totalSolved,
    required this.currentStreak,
    required this.longestStreak,
    required this.last14Days,
    required this.timeDist,
    this.fastestMs,
    this.averageMs,
    this.since,
  });

  final int totalSolved;
  final int currentStreak;
  final int longestStreak;

  /// Boolean presence for the last 14 days, oldest → newest, ending at today.
  /// Powers the stats 14-day grid.
  final List<bool> last14Days;

  /// 6-bucket solve-time histogram: [<2m, 2–3, 3–4, 4–5, 5–6, 6+m].
  final List<int> timeDist;

  final int? fastestMs;
  final int? averageMs;

  /// Earliest solved day as `yyyy-MM-dd` (for "since [month] [year]" display).
  final String? since;

  static Stats emptyFor(String today) => Stats(
        totalSolved: 0,
        currentStreak: 0,
        longestStreak: 0,
        last14Days: computeLastDays([], today, 14),
        timeDist: [0, 0, 0, 0, 0, 0],
      );

  static const empty = Stats(
    totalSolved: 0,
    currentStreak: 0,
    longestStreak: 0,
    last14Days: [],
    timeDist: [0, 0, 0, 0, 0, 0],
  );

  /// Derive stats from solve rows. [today] is the player's local day as a
  /// `yyyy-MM-dd` string — injected so tests remain deterministic.
  ///
  /// Uses [computeStreak] / [computeLongestStreak] / [computeLastDays] from
  /// `streak.dart` (the web-mirroring functions) so the home streak band and
  /// the stats screen always agree.
  static Stats fromSolves(List<SolveRow> solves, {required String today}) {
    if (solves.isEmpty) return emptyFor(today);

    // Extract the canonical local day for each solve (local_date preferred,
    // UTC fallback for legacy rows — BE-3).
    final days = [for (final s in solves) solveDay(s)];

    final currentStreak = computeStreak(days, today);
    final longestStreak = computeLongestStreak(days);
    final last14Days = computeLastDays(days, today, 14);

    // Earliest day for "since [month] [year]" display.
    final sortedDays = days.toSet().toList()..sort();
    final since = sortedDays.first;

    // 6-bucket solve-time histogram (<2m, 2–3, 3–4, 4–5, 5–6, 6+m).
    final timeDist = [0, 0, 0, 0, 0, 0];
    for (final s in solves) {
      final secs = s.durationMs ~/ 1000;
      if (secs < 120) {
        timeDist[0]++;
      } else if (secs < 180) {
        timeDist[1]++;
      } else if (secs < 240) {
        timeDist[2]++;
      } else if (secs < 300) {
        timeDist[3]++;
      } else if (secs < 360) {
        timeDist[4]++;
      } else {
        timeDist[5]++;
      }
    }

    final durations = [for (final s in solves) s.durationMs];
    final fastest = durations.reduce((a, b) => a < b ? a : b);
    final average = (durations.reduce((a, b) => a + b) / durations.length).round();

    return Stats(
      totalSolved: solves.length,
      currentStreak: currentStreak,
      longestStreak: longestStreak,
      last14Days: last14Days,
      timeDist: timeDist,
      fastestMs: fastest,
      averageMs: average,
      since: since,
    );
  }
}
