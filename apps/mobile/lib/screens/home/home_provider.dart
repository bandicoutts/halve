import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/local_date.dart';
import '../../data/models/models.dart';
import '../../data/streak.dart';
import '../../providers/providers.dart';

/// Everything the Home screen needs, resolved in one pass. The screen derives
/// its visual variant (normal / solved / offline / empty) from these fields.
class HomeData {
  const HomeData({
    required this.today,
    required this.dateLabel,
    required this.signedIn,
    this.puzzle,
    this.archiveCount,
    this.yesterdayDifficulty,
    this.solvedTodayMs,
    this.streak = 0,
    this.last7 = const [],
    this.offline = false,
    this.servedFromCache = false,
  });

  /// The user's local day, `yyyy-MM-dd`.
  final String today;

  /// Human label, e.g. "Monday, June 1".
  final String dateLabel;

  final bool signedIn;

  /// Today's puzzle (may come from the offline cache). Null when the backend
  /// has no row for today (the "empty" state) or offline with no cache.
  final Puzzle? puzzle;

  /// Count of dated dailies up to & including today — drives both "Puzzle No."
  /// and the Archive card's "N puzzles" label. Null when unknown (offline).
  final int? archiveCount;

  /// Yesterday's difficulty, for the Archive card's "last `difficulty`".
  final Difficulty? yesterdayDifficulty;

  /// Best solve duration for today, in ms, if already solved. Drives the
  /// solved-today variant.
  final int? solvedTodayMs;

  /// Current streak (days) and the last-7-day presence row (oldest → today).
  final int streak;
  final List<bool> last7;

  /// True when the live fetch failed (no connection / no backend).
  final bool offline;

  /// True when [puzzle] was served from the offline cache rather than the
  /// network (shows the slim offline banner alongside a playable CTA).
  final bool servedFromCache;

  bool get solvedToday => solvedTodayMs != null;
}

/// Loads [HomeData]. Watches the repositories + cache + current user so it
/// re-runs on auth changes; widget tests override those providers.
final homeDataProvider = FutureProvider.autoDispose<HomeData>((ref) async {
  final today = localToday();
  final label = formatDateLabel(today);
  final cache = ref.watch(puzzleCacheProvider);
  final user = ref.watch(currentUserProvider);
  final signedIn = user != null;

  // Null in guest mode (no backend creds) — degrade to the cached puzzle.
  final puzzleRepo = ref.watch(puzzleRepositoryProvider);
  final solveRepo = ref.watch(solveRepositoryProvider);

  if (puzzleRepo == null) {
    final cachedPuzzle = cache.get(today);
    return HomeData(
      today: today,
      dateLabel: label,
      signedIn: signedIn,
      puzzle: cachedPuzzle,
      servedFromCache: cachedPuzzle != null,
      offline: true,
    );
  }

  try {
    // Fire all four calls concurrently — they are independent.
    final puzzleFuture = puzzleRepo.fetchDaily(today);
    final countFuture = puzzleRepo.fetchPuzzleCount(today);
    final yesterdayFuture =
        puzzleRepo.fetchYesterdayDifficulty(offsetDay(today, -1));
    final solveFuture = (signedIn && solveRepo != null)
        ? solveRepo.fetchSolves(user.id)
        : Future.value(<SolveRow>[]);

    final puzzle = await puzzleFuture;
    final archiveCount = await countFuture;
    final yDiff = await yesterdayFuture;
    final solves = await solveFuture;

    if (puzzle != null) {
      await cache.put(today, puzzle);
    }

    var streak = 0;
    var last7 = const <bool>[];
    int? solvedTodayMs;
    if (signedIn && solves.isNotEmpty) {
      final days = {for (final s in solves) solveDay(s)}.toList();
      streak = computeStreak(days, today);
      last7 = computeLastDays(days, today, 7);
      for (final s in solves) {
        if (solveDay(s) == today) {
          if (solvedTodayMs == null || s.durationMs < solvedTodayMs) {
            solvedTodayMs = s.durationMs;
          }
        }
      }
    }

    return HomeData(
      today: today,
      dateLabel: label,
      signedIn: signedIn,
      puzzle: puzzle,
      archiveCount: archiveCount,
      yesterdayDifficulty: yDiff,
      solvedTodayMs: solvedTodayMs,
      streak: streak,
      last7: last7,
    );
  } catch (e, st) {
    // Network / transport failure — fall back to the cached puzzle (D3).
    debugPrint('homeDataProvider fetch failed: $e\n$st');
    final cached = cache.get(today);
    return HomeData(
      today: today,
      dateLabel: label,
      signedIn: signedIn,
      puzzle: cached,
      servedFromCache: cached != null,
      offline: true,
    );
  }
});
