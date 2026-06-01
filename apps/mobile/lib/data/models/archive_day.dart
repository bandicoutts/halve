import 'puzzle.dart';

/// A single day in the archive grid — one past daily puzzle plus whether the
/// current user solved it. Built by joining `puzzles` (date not null, ≤ today)
/// with the user's `solves` in memory (see PuzzleRepository.fetchArchive).
class ArchiveDay {
  const ArchiveDay({
    required this.puzzleId,
    required this.date,
    required this.difficulty,
    this.solved = false,
    this.durationMs,
  });

  final String puzzleId;

  /// `yyyy-MM-dd`.
  final String date;
  final Difficulty difficulty;
  final bool solved;

  /// Best solve duration if solved.
  final int? durationMs;

  /// Parse a `puzzles` row (`id`, `date`, `difficulty`). Returns null if the
  /// row is malformed or dateless (the archive only shows dated dailies).
  static ArchiveDay? tryFromRow(Map<String, Object?> row) {
    final id = row['id'];
    final date = row['date'];
    final diff = Difficulty.tryParse(row['difficulty']);
    if (id is! String || date is! String || diff == null) return null;
    return ArchiveDay(puzzleId: id, date: date, difficulty: diff);
  }

  ArchiveDay copyWith({bool? solved, int? durationMs}) => ArchiveDay(
        puzzleId: puzzleId,
        date: date,
        difficulty: difficulty,
        solved: solved ?? this.solved,
        durationMs: durationMs ?? this.durationMs,
      );
}
