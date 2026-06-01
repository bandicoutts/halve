import 'package:flutter_test/flutter_test.dart';
import 'package:halve/data/models/models.dart';

/// A well-formed 6×6 grid_spec consistent with [_solution].
const _solution = [
  [0, 0, 1, 1, 0, 1],
  [1, 1, 0, 0, 1, 0],
  [0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0],
  [0, 1, 1, 0, 1, 0],
  [1, 0, 0, 1, 0, 1],
];

Map<String, Object?> validSpec({List<Map<String, Object?>>? edges}) => {
      'solution': _solution,
      'givens': [
        [0, null, null, null, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
      ],
      // (0,0)=(0,1)=0 → eq · (0,1)=0,(0,2)=1 → ne · (0,0)=0,(1,0)=1 → ne(v)
      'edges': edges ??
          [
            {'orientation': 'h', 'r': 0, 'c': 0, 'kind': 'eq'},
            {'orientation': 'h', 'r': 0, 'c': 1, 'kind': 'ne'},
            {'orientation': 'v', 'r': 0, 'c': 0, 'kind': 'ne'},
          ],
    };

void main() {
  group('Puzzle.tryParse', () {
    test('parses a valid row', () {
      final p = Puzzle.tryParse(
        id: 'abc',
        difficulty: 'medium',
        gridSpec: validSpec(),
      );
      expect(p, isNotNull);
      expect(p!.id, 'abc');
      expect(p.difficulty, Difficulty.medium);
      expect(p.size, 6);
      expect(p.solution[0], [0, 0, 1, 1, 0, 1]);
      expect(p.givens[0][0], 0);
      expect(p.givens[0][1], isNull);
      expect(p.edges.length, 3);
      expect(p.edges.first,
          const Edge(orientation: EdgeOrientation.h, r: 0, c: 0, kind: EdgeKind.eq));
    });

    test('rejects unknown difficulty', () {
      expect(
        Puzzle.tryParse(id: 'a', difficulty: 'extreme', gridSpec: validSpec()),
        isNull,
      );
    });

    test('rejects non-string id', () {
      expect(
        Puzzle.tryParse(id: 42, difficulty: 'easy', gridSpec: validSpec()),
        isNull,
      );
    });

    test('rejects a solution of the wrong size', () {
      final spec = validSpec()..['solution'] = _solution.sublist(0, 5);
      expect(Puzzle.tryParse(id: 'a', difficulty: 'easy', gridSpec: spec), isNull);
    });

    test('rejects a given that disagrees with the solution', () {
      final givens = [
        [1, null, null, null, null, null], // solution[0][0] is 0
        for (var i = 0; i < 5; i++) [null, null, null, null, null, null],
      ];
      final spec = validSpec()..['givens'] = givens;
      expect(Puzzle.tryParse(id: 'a', difficulty: 'easy', gridSpec: spec), isNull);
    });

    test('rejects an out-of-bounds edge', () {
      final spec = validSpec(edges: [
        {'orientation': 'h', 'r': 0, 'c': 5, 'kind': 'ne'}, // c must be < 5 for h
      ]);
      expect(Puzzle.tryParse(id: 'a', difficulty: 'easy', gridSpec: spec), isNull);
    });

    test('rejects an edge inconsistent with the solution', () {
      // (0,0)=(0,1)=0 are equal, so an "ne" edge there is a contradiction.
      final spec = validSpec(edges: [
        {'orientation': 'h', 'r': 0, 'c': 0, 'kind': 'ne'},
      ]);
      expect(Puzzle.tryParse(id: 'a', difficulty: 'easy', gridSpec: spec), isNull);
    });

    test('rejects a non-map grid_spec', () {
      expect(Puzzle.tryParse(id: 'a', difficulty: 'easy', gridSpec: 'nope'), isNull);
    });
  });

  group('Edge', () {
    test('json round-trips', () {
      const e = Edge(orientation: EdgeOrientation.v, r: 2, c: 3, kind: EdgeKind.ne);
      final round = Edge.tryFromJson(e.toJson());
      expect(round, e);
    });

    test('rejects malformed json', () {
      expect(Edge.tryFromJson({'orientation': 'x', 'r': 0, 'c': 0, 'kind': 'eq'}),
          isNull);
      expect(Edge.tryFromJson({'orientation': 'h', 'r': '0', 'c': 0, 'kind': 'eq'}),
          isNull);
    });
  });

  group('Difficulty', () {
    test('dots map easy→1 … hard→3', () {
      expect(Difficulty.easy.dots, 1);
      expect(Difficulty.medium.dots, 2);
      expect(Difficulty.hard.dots, 3);
    });
  });

  group('SolveRow.fromRow', () {
    test('parses a row', () {
      final s = SolveRow.fromRow({
        'puzzle_id': 'p1',
        'solved_at': '2026-06-01T10:00:00Z',
        'duration_ms': 167000,
        'used_hint': false,
        'local_date': '2026-06-01',
      });
      expect(s.durationMs, 167000);
      expect(s.usedHint, isFalse);
      expect(s.localDate, '2026-06-01');
      expect(s.puzzleId, 'p1');
    });
  });

  group('ArchiveDay', () {
    test('parses a dated row; withSolves marks solved', () {
      final day = ArchiveDay.tryFromRow(
          {'id': 'p1', 'date': '2026-05-31', 'difficulty': 'hard'});
      expect(day, isNotNull);
      expect(day!.difficulty, Difficulty.hard);
      expect(day.solved, isFalse);

      final solved = day.copyWith(solved: true, durationMs: 90000);
      expect(solved.solved, isTrue);
      expect(solved.durationMs, 90000);
    });

    test('rejects a dateless row', () {
      expect(
        ArchiveDay.tryFromRow({'id': 'p1', 'date': null, 'difficulty': 'easy'}),
        isNull,
      );
    });
  });

  group('Stats.fromSolves', () {
    SolveRow on(String day) => SolveRow(
          solvedAt: DateTime.parse('${day}T12:00:00Z'),
          durationMs: 120000,
          usedHint: false,
          localDate: day,
        );

    test('empty', () {
      final result = Stats.fromSolves([], today: '2026-06-01');
      expect(result.totalSolved, 0);
      expect(result.currentStreak, 0);
      expect(result.longestStreak, 0);
    });

    test('counts a 3-day current streak ending today', () {
      final stats = Stats.fromSolves(
        [on('2026-05-30'), on('2026-05-31'), on('2026-06-01')],
        today: '2026-06-01',
      );
      expect(stats.totalSolved, 3);
      expect(stats.currentStreak, 3);
      expect(stats.longestStreak, 3);
    });

    test('a gap breaks the current streak but not the longest', () {
      final stats = Stats.fromSolves(
        [
          on('2026-05-20'), on('2026-05-21'), on('2026-05-22'), // longest = 3
          on('2026-05-31'), on('2026-06-01'), // current = 2
        ],
        today: '2026-06-01',
      );
      expect(stats.longestStreak, 3);
      expect(stats.currentStreak, 2);
    });

    // Reconcile Stats.fromSolves against the web-mirroring computeStreak /
    // computeLongestStreak functions in streak.dart (Phase 11).
    test('fromSolves currentStreak matches computeStreak (TODAY-SAFE)', () {
      final solves = [on('2026-05-30'), on('2026-05-31')];
      // today not solved yet — streak should survive
      final stats = Stats.fromSolves(solves, today: '2026-06-01');
      expect(stats.currentStreak, 2);
    });

    test('fromSolves currentStreak collapses once a full day elapses', () {
      final solves = [on('2026-05-29'), on('2026-05-30')];
      final stats = Stats.fromSolves(solves, today: '2026-06-01');
      expect(stats.currentStreak, 0);
    });

    test('fromSolves longestStreak over disjoint runs', () {
      final solves = [
        on('2026-04-01'), on('2026-04-02'), on('2026-04-03'), on('2026-04-04'),
        on('2026-05-10'), on('2026-05-11'),
      ];
      final stats = Stats.fromSolves(solves, today: '2026-06-01');
      expect(stats.longestStreak, 4);
    });

    test('fromSolves last14Days length is 14', () {
      final solves = [on('2026-06-01')];
      final stats = Stats.fromSolves(solves, today: '2026-06-01');
      expect(stats.last14Days.length, 14);
      expect(stats.last14Days.last, isTrue); // today solved
    });

    test('fromSolves timeDist buckets 6 bins', () {
      final mixed = [
        // <2m (90s)
        SolveRow(solvedAt: DateTime.parse('2026-06-01T12:00:00Z'), durationMs: 90000, usedHint: false, localDate: '2026-06-01'),
        // 2–3m (150s)
        SolveRow(solvedAt: DateTime.parse('2026-05-31T12:00:00Z'), durationMs: 150000, usedHint: false, localDate: '2026-05-31'),
        // 6+m (400s)
        SolveRow(solvedAt: DateTime.parse('2026-05-30T12:00:00Z'), durationMs: 400000, usedHint: false, localDate: '2026-05-30'),
      ];
      final stats = Stats.fromSolves(mixed, today: '2026-06-01');
      expect(stats.timeDist.length, 6);
      expect(stats.timeDist[0], 1); // <2m
      expect(stats.timeDist[1], 1); // 2–3m
      expect(stats.timeDist[5], 1); // 6+m
      expect(stats.timeDist[2] + stats.timeDist[3] + stats.timeDist[4], 0);
    });

    test('fromSolves since is the earliest local_date', () {
      final solves = [on('2026-03-15'), on('2026-05-01'), on('2026-06-01')];
      final stats = Stats.fromSolves(solves, today: '2026-06-01');
      expect(stats.since, '2026-03-15');
    });
  });
}
