import 'package:flutter_test/flutter_test.dart';
import 'package:halve/data/models/models.dart';
import 'package:halve/data/puzzle_cache.dart';
import 'package:shared_preferences/shared_preferences.dart';

Puzzle _puzzle(String id) {
  return Puzzle.tryParse(
    id: id,
    difficulty: 'medium',
    gridSpec: {
      'solution': [
        for (var r = 0; r < 6; r++) [for (var c = 0; c < 6; c++) (r + c) % 2],
      ],
      'givens': [
        for (var r = 0; r < 6; r++) [for (var c = 0; c < 6; c++) null],
      ],
      'edges': const <Map<String, Object?>>[],
    },
  )!;
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('PrefsPuzzleCache keeps only the latest configured entries', () async {
    final cache = PrefsPuzzleCache(await SharedPreferences.getInstance());

    for (var day = 1; day <= 8; day++) {
      final date = '2026-06-${day.toString().padLeft(2, '0')}';
      await cache.put(date, _puzzle('p-$day'));
    }

    expect(cache.get('2026-06-01'), isNull);
    for (var day = 2; day <= 8; day++) {
      final date = '2026-06-${day.toString().padLeft(2, '0')}';
      expect(cache.get(date), isNotNull, reason: date);
    }
  });

  test('InMemoryPuzzleCache round-trips a puzzle', () async {
    final cache = InMemoryPuzzleCache();
    final puzzle = _puzzle('p-1');

    await cache.put('2026-06-01', puzzle);

    expect(cache.get('2026-06-01'), same(puzzle));
  });
}
