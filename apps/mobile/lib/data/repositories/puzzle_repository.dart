import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/models.dart';

/// Reads puzzles from Supabase. There is NO client-side daily generation (no
/// Dart generator) — offline support relies on a cache (Phase 6), never on
/// regeneration. Mirrors the web query shapes.
class PuzzleRepository {
  PuzzleRepository(this._client);

  final SupabaseClient _client;

  /// Today's daily, keyed by the player's local day (`yyyy-MM-dd`). Returns
  /// null if there's no row for that date or the stored spec is malformed.
  Future<Puzzle?> fetchDaily(String localDate) async {
    final row = await _client
        .from('puzzles')
        .select('id, difficulty, grid_spec')
        .eq('date', localDate)
        .maybeSingle();
    if (row == null) return null;
    return Puzzle.tryParse(
      id: row['id'],
      difficulty: row['difficulty'],
      gridSpec: row['grid_spec'],
    );
  }

  /// A specific archive day's puzzle.
  Future<Puzzle?> fetchByDate(String date) => fetchDaily(date);

  /// Count of dated dailies published up to and including [date]. Used to
  /// derive the ordinal puzzle number shown in the board header.
  Future<int?> fetchPuzzleCount(String date) async {
    final rows = await _client
        .from('puzzles')
        .select('id')
        .not('date', 'is', null)
        .lte('date', date);
    return (rows as List).length;
  }

  /// All dated puzzles up to and including [today], ascending — the archive
  /// grid. Solved state is layered on separately (see [withSolves]).
  Future<List<ArchiveDay>> fetchArchive(String today) async {
    final rows = await _client
        .from('puzzles')
        .select('id, date, difficulty')
        .not('date', 'is', null)
        .lte('date', today)
        .order('date', ascending: true);
    final days = [
      for (final row in rows) ArchiveDay.tryFromRow(row),
    ].whereType<ArchiveDay>().toList();
    return days;
  }

  /// Marks archive days solved by intersecting with the user's solves in
  /// memory (avoids a giant `.in_(puzzleId)` URL — see the web archive note).
  List<ArchiveDay> withSolves(List<ArchiveDay> days, List<SolveRow> solves) {
    final best = <String, int>{};
    for (final s in solves) {
      final id = s.puzzleId;
      if (id == null) continue;
      final cur = best[id];
      if (cur == null || s.durationMs < cur) best[id] = s.durationMs;
    }
    return [
      for (final d in days)
        best.containsKey(d.puzzleId)
            ? d.copyWith(solved: true, durationMs: best[d.puzzleId])
            : d,
    ];
  }

  /// A puzzle from the shared dateless practice pool via the
  /// `get_practice_puzzle` RPC. [seq] selects a stable slot for cross-platform
  /// parity; null rotates deterministically by UTC day. Returns null if the
  /// pool is empty (the caller shows the "practice unavailable" fallback).
  Future<Puzzle?> fetchPracticePuzzle(Difficulty difficulty, {int? seq}) async {
    final result = await _client.rpc(
      'get_practice_puzzle',
      params: practicePuzzleParams(difficulty, seq: seq),
    );
    if (result is! List || result.isEmpty) return null;
    final row = result.first;
    if (row is! Map) return null;
    return Puzzle.tryParse(
      id: row['id'],
      difficulty: row['difficulty'],
      gridSpec: row['grid_spec'],
    );
  }

  /// The RPC param map for `get_practice_puzzle` (extracted for testing).
  static Map<String, Object?> practicePuzzleParams(
    Difficulty difficulty, {
    int? seq,
  }) =>
      {
        'p_difficulty': difficulty.wire,
        'p_seq': ?seq,
      };
}
