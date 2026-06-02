import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'models/models.dart';

/// Offline cache for daily puzzles (D3): the latest dailies are persisted so
/// the Home screen can serve today's puzzle (and recent days) without a
/// connection. Reads are synchronous so the Home provider can consult the
/// cache without an extra await on the offline path.
abstract interface class PuzzleCache {
  /// Persist [puzzle] under its [date] (`yyyy-MM-dd`), pruning old entries.
  Future<void> put(String date, Puzzle puzzle);

  /// The cached puzzle for [date], or null if absent / unparseable.
  Puzzle? get(String date);
}

/// [PuzzleCache] backed by [SharedPreferences]. Keeps the most recent
/// [maxEntries] dailies; older entries are evicted on write.
class PrefsPuzzleCache implements PuzzleCache {
  PrefsPuzzleCache(this._prefs);

  final SharedPreferences _prefs;

  static const _entryPrefix = 'puzzle_cache.';
  static const _indexKey = 'puzzle_cache.dates';
  static const maxEntries = 7;

  @override
  Future<void> put(String date, Puzzle puzzle) async {
    await _prefs.setString(
      '$_entryPrefix$date',
      jsonEncode(puzzle.toCacheMap()),
    );

    // Most-recently-cached first; de-dupe and cap.
    final dates = [date, ...?_prefs.getStringList(_indexKey)];
    final seen = <String>{};
    final kept = <String>[];
    for (final d in dates) {
      if (seen.add(d)) kept.add(d);
      if (kept.length >= maxEntries) break;
    }
    for (final d in dates) {
      if (!kept.contains(d)) await _prefs.remove('$_entryPrefix$d');
    }
    await _prefs.setStringList(_indexKey, kept);
  }

  @override
  Puzzle? get(String date) {
    final raw = _prefs.getString('$_entryPrefix$date');
    if (raw == null) return null;
    try {
      final map = jsonDecode(raw);
      if (map is! Map) return null;
      return Puzzle.tryParse(
        id: map['id'],
        difficulty: map['difficulty'],
        gridSpec: map['grid_spec'],
      );
    } catch (_) {
      return null;
    }
  }
}

/// In-memory [PuzzleCache] — the default before [SharedPreferences] is wired
/// (e.g. the boot smoke test) and the fake used in widget tests.
class InMemoryPuzzleCache implements PuzzleCache {
  final Map<String, Puzzle> _store = {};

  @override
  Future<void> put(String date, Puzzle puzzle) async => _store[date] = puzzle;

  @override
  Puzzle? get(String date) => _store[date];
}
