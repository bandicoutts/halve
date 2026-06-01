import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/local_date.dart';
import '../../data/models/models.dart';
import '../../data/puzzle_cache.dart';
import '../../data/repositories/puzzle_repository.dart';
import '../../data/repositories/solve_repository.dart';
import '../../data/streak.dart';
import '../../providers/providers.dart';

/// The offline cache. Defaults to an in-memory cache (no persistence) so the
/// app boots without [SharedPreferences]; `main.dart` overrides it with a
/// [PrefsPuzzleCache], and widget tests override it with a fake.
final puzzleCacheProvider = Provider<PuzzleCache>((ref) => InMemoryPuzzleCache());

/// Everything the Home screen needs, resolved in one pass. The screen derives
/// its visual variant (normal / solved / offline / empty) from these fields.
class HomeData {
  const HomeData({
    required this.today,
    required this.dateLabel,
    required this.signedIn,
    this.puzzle,
    this.puzzleNumber,
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

  /// Total dated dailies up to & including today — the "Puzzle No.". Null when
  /// unknown (offline).
  final int? puzzleNumber;

  /// Count of dated dailies (the Archive card's "N puzzles"). Null offline.
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

  // Reading the repos throws in guest mode (no backend creds). Treat that the
  // same as offline: serve a cached puzzle if we have one.
  PuzzleRepository? puzzleRepo;
  SolveRepository? solveRepo;
  try {
    puzzleRepo = ref.watch(puzzleRepositoryProvider);
    solveRepo = ref.watch(solveRepositoryProvider);
  } catch (_) {
    puzzleRepo = null;
  }

  if (puzzleRepo == null) {
    return HomeData(
      today: today,
      dateLabel: label,
      signedIn: signedIn,
      puzzle: cache.get(today),
      servedFromCache: cache.get(today) != null,
      offline: true,
    );
  }

  try {
    final puzzle = await puzzleRepo.fetchDaily(today);
    if (puzzle != null) {
      await cache.put(today, puzzle);
    }

    final archive = await puzzleRepo.fetchArchive(today);
    final yesterday = offsetDay(today, -1);
    Difficulty? yDiff;
    for (final d in archive) {
      if (d.date == yesterday) {
        yDiff = d.difficulty;
        break;
      }
    }

    var streak = 0;
    var last7 = const <bool>[];
    int? solvedTodayMs;
    if (signedIn && solveRepo != null) {
      final solves = await solveRepo.fetchSolves(user.id);
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
      puzzleNumber: archive.length,
      archiveCount: archive.length,
      yesterdayDifficulty: yDiff,
      solvedTodayMs: solvedTodayMs,
      streak: streak,
      last7: last7,
    );
  } catch (_) {
    // Network / transport failure — fall back to the cached puzzle (D3).
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
