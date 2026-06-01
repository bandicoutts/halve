import 'dart:math';

import 'package:flutter_test/flutter_test.dart';
import 'package:halve/data/models/puzzle.dart';
import 'package:halve/engine/validator.dart';

// The valid, balanced, no-three 6×6 solution fixture from the engine's
// validators.test.ts — used to cross-check parity with the TS source.
final List<List<int?>> solution = [
  [0, 1, 1, 0, 1, 0],
  [1, 0, 0, 1, 0, 1],
  [0, 1, 0, 1, 1, 0],
  [1, 0, 1, 0, 0, 1],
  [1, 1, 0, 0, 1, 0],
  [0, 0, 1, 1, 0, 1],
];

List<List<int?>> clone(List<List<int?>> g) => [for (final r in g) [...r]];

Solution get solved => [for (final r in solution) [for (final v in r) v!]];

void main() {
  group('findViolations / isValid / isSolved', () {
    test('passes a valid complete solution', () {
      expect(findViolations(solution, const []), isEmpty);
      expect(isValid(solution, const []), isTrue);
      expect(isSolved(solution, const []), isTrue);
    });

    test('flags three-in-a-row horizontally (all 3 marked)', () {
      final g = clone(solution);
      g[0] = [0, 0, 0, 1, 1, 0];
      final bad = findViolations(g, const []);
      expect(bad.contains((0, 0)), isTrue);
      expect(bad.contains((0, 1)), isTrue);
      expect(bad.contains((0, 2)), isTrue);
      expect(isValid(g, const []), isFalse);
    });

    test('flags three-in-a-column vertically', () {
      final g = clone(solution);
      g[0][0] = 0;
      g[1][0] = 0;
      g[2][0] = 0; // column 0 rows 0..2 all 0
      final bad = findViolations(g, const []);
      expect(bad.contains((0, 0)), isTrue);
      expect(bad.contains((1, 0)), isTrue);
      expect(bad.contains((2, 0)), isTrue);
    });

    test('flags an unbalanced row — every cell of the over-symbol marked', () {
      final g = clone(solution);
      g[0] = [0, 1, 0, 0, 1, 0]; // four 0s, no triple
      final bad = findViolations(g, const []);
      expect(bad.contains((0, 0)), isTrue);
      expect(bad.contains((0, 2)), isTrue);
      expect(bad.contains((0, 3)), isTrue);
      expect(bad.contains((0, 5)), isTrue);
    });

    test('respects eq / ne edges (only when both filled)', () {
      // (0,0)=0 and (0,1)=1 → opposite in the solution.
      const eqEdge = Edge(orientation: EdgeOrientation.h, r: 0, c: 0, kind: EdgeKind.eq);
      const neEdge = Edge(orientation: EdgeOrientation.h, r: 0, c: 0, kind: EdgeKind.ne);
      expect(isValid(solution, const [neEdge]), isTrue); // differ → ne ok
      final bad = findViolations(solution, const [eqEdge]); // differ → eq broken
      expect(bad.contains((0, 0)), isTrue);
      expect(bad.contains((0, 1)), isTrue);
    });

    test('ignores an edge where a cell is still empty', () {
      final g = clone(solution);
      g[0][1] = null;
      const eqEdge = Edge(orientation: EdgeOrientation.h, r: 0, c: 0, kind: EdgeKind.eq);
      expect(findViolations(g, const [eqEdge]), isEmpty);
    });

    test('combined violations accumulate', () {
      final g = clone(solution);
      g[0] = [0, 0, 0, 0, 1, 0]; // triple AND unbalanced (five 0s)
      final bad = findViolations(g, const []);
      for (final c in [0, 1, 2, 3, 5]) {
        expect(bad.contains((0, c)), isTrue, reason: 'cell 0-$c should be flagged');
      }
    });

    test('isSolved is false for an incomplete grid', () {
      final g = clone(solution);
      g[0][0] = null;
      expect(isComplete(g), isFalse);
      expect(isSolved(g, const []), isFalse);
      expect(isValid(g, const []), isTrue); // partial but rule-clean
    });
  });

  group('wouldViolate', () {
    List<List<int?>> empty() =>
        [for (var i = 0; i < 6; i++) List<int?>.filled(6, null)];

    test('rejects a value that completes a triple', () {
      final g = empty();
      g[0][0] = 0;
      g[0][1] = 0;
      expect(wouldViolate(g, 0, 2, 0, const [], 6), isTrue);
      expect(wouldViolate(g, 0, 2, 1, const [], 6), isFalse);
    });

    test('rejects a value that overflows line balance', () {
      final g = empty();
      g[0][0] = 0;
      g[0][2] = 0;
      g[0][4] = 0; // three 0s (half = 3)
      expect(wouldViolate(g, 0, 1, 0, const [], 6), isTrue);
      expect(wouldViolate(g, 0, 1, 1, const [], 6), isFalse);
    });

    test('rejects a value that breaks an edge with a known neighbour', () {
      final g = empty();
      g[0][0] = 0;
      const eq = Edge(orientation: EdgeOrientation.h, r: 0, c: 0, kind: EdgeKind.eq);
      expect(wouldViolate(g, 0, 1, 1, const [eq], 6), isTrue); // must equal 0
      expect(wouldViolate(g, 0, 1, 0, const [eq], 6), isFalse);
    });
  });

  group('cycle', () {
    test('empty → A(0) → B(1) → empty', () {
      expect(cycle(null), 0);
      expect(cycle(0), 1);
      expect(cycle(1), isNull);
    });
  });

  group('localHint', () {
    test('returns the solution value for an empty cell only', () {
      final g = clone(solution);
      g[2][3] = null; // the only empty cell
      final hint = localHint(g, solved, random: Random(1));
      expect(hint, isNotNull);
      final (r, c, value) = hint!;
      expect((r, c), (2, 3));
      expect(value, solution[2][3]);
    });

    test('returns null when the grid is complete', () {
      expect(localHint(solution, solved, random: Random(1)), isNull);
    });

    test('only ever picks an empty cell (fuzzed)', () {
      final g = clone(solution);
      g[0][0] = null;
      g[3][4] = null;
      g[5][1] = null;
      final emptySet = {(0, 0), (3, 4), (5, 1)};
      for (var seed = 0; seed < 50; seed++) {
        final (r, c, _) = localHint(g, solved, random: Random(seed))!;
        expect(emptySet.contains((r, c)), isTrue);
      }
    });
  });
}
