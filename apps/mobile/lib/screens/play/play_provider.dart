import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/local_date.dart';
import '../../data/models/models.dart';
import '../../engine/validator.dart' as validator;
import '../../providers/providers.dart';

/// What the Play route was asked to open. Equality lets the [playLoadProvider]
/// family de-dupe so the same load isn't re-run on rebuild.
class PlayArgs {
  const PlayArgs({this.date, this.isPractice = false, this.difficulty});

  /// Archive day in `yyyy-MM-dd`; null means today's daily.
  final String? date;
  final bool isPractice;

  /// Practice difficulty (defaults to medium when [isPractice]).
  final Difficulty? difficulty;

  @override
  bool operator ==(Object other) =>
      other is PlayArgs &&
      other.date == date &&
      other.isPractice == isPractice &&
      other.difficulty == difficulty;

  @override
  int get hashCode => Object.hash(date, isPractice, difficulty);
}

enum PlayKind { daily, archive, practice }

/// Raised when there is genuinely no puzzle to play (no backend row, empty
/// practice pool, and no usable cache). The screen shows an unavailable notice.
class PlayUnavailable implements Exception {
  const PlayUnavailable();
}

/// The loaded puzzle plus the context the board + win hand-off need.
class PlayLoad {
  const PlayLoad({
    required this.puzzle,
    required this.kind,
    required this.localDate,
    required this.puzzleId,
    this.date,
    this.isOffline = false,
    this.puzzleNumber,
  });

  final Puzzle puzzle;
  final PlayKind kind;

  /// The player's local day (`yyyy-MM-dd`) — sent to `record_solve`.
  final String localDate;

  /// The DB row id to record against, or null when the solve must NOT be
  /// recorded (practice — Phase 0 decision: no `solves` write).
  final String? puzzleId;

  /// The archive day, when [kind] is archive.
  final String? date;

  /// True when the puzzle came from the offline cache rather than the network.
  final bool isOffline;

  /// Ordinal position of this puzzle in the published archive (1-based).
  /// Null for practice puzzles or when the count fetch failed.
  final int? puzzleNumber;
}

/// Loads the puzzle for [PlayArgs]:
///   • daily   — `fetchDaily(localToday)`, falling back to the offline cache;
///   • archive — `fetchByDate(date)`, falling back to the cache;
///   • practice— `fetchPracticePuzzle(difficulty)` (NOT cached, NOT recorded).
/// A genuinely missing puzzle throws [PlayUnavailable].
final playLoadProvider =
    FutureProvider.autoDispose.family<PlayLoad, PlayArgs>((ref, args) async {
  final today = localToday();
  final cache = ref.watch(puzzleCacheProvider);

  // Null in guest mode (no backend creds) — treat as offline.
  final repo = ref.watch(puzzleRepositoryProvider);

  if (args.isPractice) {
    final difficulty = args.difficulty ?? Difficulty.medium;
    if (repo == null) throw const PlayUnavailable();
    final puzzle = await repo.fetchPracticePuzzle(difficulty);
    if (puzzle == null) throw const PlayUnavailable();
    // Practice solves are never recorded (puzzleId stays null).
    return PlayLoad(
      puzzle: puzzle,
      kind: PlayKind.practice,
      localDate: today,
      puzzleId: null,
    );
  }

  final date = args.date ?? today;
  final kind = args.date == null ? PlayKind.daily : PlayKind.archive;

  PlayLoad cachedOrUnavailable() {
    final cached = cache.get(date);
    if (cached != null) {
      return PlayLoad(
        puzzle: cached,
        kind: kind,
        localDate: today,
        puzzleId: cached.id,
        date: args.date,
        isOffline: true,
      );
    }
    throw const PlayUnavailable();
  }

  if (repo == null) return cachedOrUnavailable();

  try {
    // Fire puzzle + count concurrently — independent queries.
    final puzzleFuture = repo.fetchByDate(date);
    final countFuture = repo.fetchPuzzleCount(date);

    final puzzle = await puzzleFuture;
    if (puzzle != null) {
      await cache.put(date, puzzle);
      // Count is best-effort: a failure hides the puzzle number but doesn't
      // block the board from loading.
      int? puzzleNumber;
      try {
        puzzleNumber = await countFuture;
      } catch (_) {}
      return PlayLoad(
        puzzle: puzzle,
        kind: kind,
        localDate: today,
        puzzleId: puzzle.id,
        date: args.date,
        puzzleNumber: puzzleNumber,
      );
    }
  } catch (e, st) {
    // Network / transport failure — serve the cache if we have it.
    debugPrint('playLoadProvider fetch failed: $e\n$st');
    return cachedOrUnavailable();
  }

  // fetch returned null → no row for this date. Try the cache, else unavailable.
  return cachedOrUnavailable();
});

/// The mutable game: the working grid, the undo stack, the hint flag, and a
/// count-up timer that starts on the first interaction and stops on solve.
/// A faithful port of the web `useGame` + `useTimer`, keyed by the loaded
/// [Puzzle] (givens are locked, solution drives hints + solve detection).
class PlayState {
  const PlayState({
    required this.grid,
    required this.history,
    required this.usedHint,
    required this.elapsedSeconds,
    required this.running,
    required this.solved,
  });

  PlayState.initial(Grid givens)
      : grid = _clone(givens),
        history = const [],
        usedHint = false,
        elapsedSeconds = 0,
        running = false,
        solved = false;

  final Grid grid;
  final List<Grid> history;
  final bool usedHint;
  final int elapsedSeconds;
  final bool running;
  final bool solved;

  bool get canUndo => history.isNotEmpty;

  PlayState copyWith({
    Grid? grid,
    List<Grid>? history,
    bool? usedHint,
    int? elapsedSeconds,
    bool? running,
    bool? solved,
  }) {
    return PlayState(
      grid: grid ?? this.grid,
      history: history ?? this.history,
      usedHint: usedHint ?? this.usedHint,
      elapsedSeconds: elapsedSeconds ?? this.elapsedSeconds,
      running: running ?? this.running,
      solved: solved ?? this.solved,
    );
  }
}

Grid _clone(Grid g) => [for (final row in g) List<Cell>.from(row)];

class PlayController extends AutoDisposeFamilyNotifier<PlayState, Puzzle> {
  Timer? _timer;

  @override
  PlayState build(Puzzle puzzle) {
    ref.onDispose(_stopTimer);
    return PlayState.initial(puzzle.givens);
  }

  Puzzle get _puzzle => arg;

  /// Cycle the cell at (r,c): empty → disc → ring → empty. Givens are locked.
  void tap(int r, int c) {
    if (state.solved) return;
    if (_puzzle.givens[r][c] != null) return; // locked given
    final next = _clone(state.grid);
    next[r][c] = validator.cycle(next[r][c]);
    _commit(next, usedHint: state.usedHint);
  }

  /// Reveal a random empty cell's solution value (fully on-device — Phase 2
  /// decision). Flags [PlayState.usedHint]. No-op when the grid is full.
  void hint() {
    if (state.solved) return;
    final h = validator.localHint(state.grid, _puzzle.solution);
    if (h == null) return;
    final next = _clone(state.grid);
    next[h.$1][h.$2] = h.$3;
    _commit(next, usedHint: true);
  }

  /// Revert the last move.
  void undo() {
    if (state.history.isEmpty) return;
    final prev = state.history.last;
    final solved = validator.isSolved(prev, _puzzle.edges);
    state = state.copyWith(
      grid: prev,
      history: state.history.sublist(0, state.history.length - 1),
      solved: solved,
    );
    if (solved) _stopTimer();
  }

  void _commit(Grid next, {required bool usedHint}) {
    _startTimer();
    final solved = validator.isSolved(next, _puzzle.edges);
    state = state.copyWith(
      grid: next,
      history: [...state.history, state.grid],
      usedHint: usedHint,
      solved: solved,
    );
    if (solved) _stopTimer();
  }

  void _startTimer() {
    if (_timer != null || state.solved) return;
    state = state.copyWith(running: true);
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      state = state.copyWith(elapsedSeconds: state.elapsedSeconds + 1);
    });
  }

  void _stopTimer() {
    _timer?.cancel();
    _timer = null;
    if (state.running) state = state.copyWith(running: false);
  }
}

final playControllerProvider =
    NotifierProvider.autoDispose.family<PlayController, PlayState, Puzzle>(
  PlayController.new,
);

/// Everything the Win screen (Phase 8) needs, handed off via `context.push`.
class PlayResult {
  const PlayResult({
    required this.kind,
    required this.difficulty,
    required this.durationMs,
    required this.formattedTime,
    required this.usedHint,
    required this.solution,
    required this.size,
    required this.localDate,
    this.puzzleId,
    this.date,
    this.saveResult,
  });

  final PlayKind kind;
  final Difficulty difficulty;
  final int durationMs;
  final String formattedTime;
  final bool usedHint;
  final Solution solution;
  final int size;

  /// The player's local day (`yyyy-MM-dd`) the solve belongs to — needed to
  /// re-call `record_solve` on the Win screen's network retry.
  final String localDate;

  final String? puzzleId;
  final String? date;

  /// The outcome of `record_solve`, or null when the solve wasn't recorded
  /// (practice, or a guest). Lets the Win screen offer a retry on
  /// [RecordSolveResult.isNetworkError].
  final RecordSolveResult? saveResult;
}

/// `m:ss` from whole seconds (mirrors the web timer format).
String formatDuration(int seconds) =>
    '${seconds ~/ 60}:${(seconds % 60).toString().padLeft(2, '0')}';
