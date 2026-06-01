/// Puzzle domain models, mirroring `@parity/engine` types and the
/// `puzzles.grid_spec` jsonb shape. The Dart side never generates puzzles
/// (no Dart generator) — it only parses what the backend stored.
///
/// Cells are `0 = A (solid disc)`, `1 = B (ring)`, `null = empty`, matching the
/// engine's `Sym`/`Cell` encoding.
library;

/// A working board cell.
typedef Cell = int?; // 0 | 1 | null

/// A board grid (may contain empties).
typedef Grid = List<List<Cell>>;

/// A complete solution grid (no empties).
typedef Solution = List<List<int>>;

enum Difficulty {
  easy,
  medium,
  hard;

  /// Parse the backend's lowercase string; returns null if unrecognised.
  static Difficulty? tryParse(Object? raw) {
    return switch (raw) {
      'easy' => Difficulty.easy,
      'medium' => Difficulty.medium,
      'hard' => Difficulty.hard,
      _ => null,
    };
  }

  /// Wire value (lowercase) sent to / received from the backend.
  String get wire => name;

  /// Number of difficulty dots shown in the archive (easy 1 … hard 3).
  int get dots => index + 1;
}

enum EdgeOrientation { h, v }

enum EdgeKind { eq, ne }

/// An `=`/`≠` constraint sign between two adjacent cells.
/// `h` links (r,c)-(r,c+1); `v` links (r,c)-(r+1,c).
class Edge {
  const Edge({
    required this.orientation,
    required this.r,
    required this.c,
    required this.kind,
  });

  final EdgeOrientation orientation;
  final int r;
  final int c;
  final EdgeKind kind;

  static Edge? tryFromJson(Object? raw) {
    if (raw is! Map) return null;
    final orientation = switch (raw['orientation']) {
      'h' => EdgeOrientation.h,
      'v' => EdgeOrientation.v,
      _ => null,
    };
    final kind = switch (raw['kind']) {
      'eq' => EdgeKind.eq,
      'ne' => EdgeKind.ne,
      _ => null,
    };
    final r = raw['r'];
    final c = raw['c'];
    if (orientation == null || kind == null || r is! int || c is! int) {
      return null;
    }
    return Edge(orientation: orientation, r: r, c: c, kind: kind);
  }

  Map<String, Object?> toJson() => {
        'orientation': orientation.name,
        'r': r,
        'c': c,
        'kind': kind.name,
      };

  @override
  bool operator ==(Object other) =>
      other is Edge &&
      other.orientation == orientation &&
      other.r == r &&
      other.c == c &&
      other.kind == kind;

  @override
  int get hashCode => Object.hash(orientation, r, c, kind);
}

/// A fully specified puzzle ready to play.
class Puzzle {
  const Puzzle({
    required this.id,
    required this.difficulty,
    required this.size,
    required this.givens,
    required this.solution,
    required this.edges,
  });

  final String id;
  final Difficulty difficulty;
  final int size;
  final Grid givens;
  final Solution solution;
  final List<Edge> edges;

  /// Builds a [Puzzle] from a backend row (`id`, `difficulty`, `grid_spec`).
  /// Returns null if anything is malformed — a faithful port of the web's
  /// `parseGridSpec` (apps/web/src/lib/grid-spec.ts): a corrupt row is treated
  /// the same as a missing one so the caller can fall back without crashing.
  static Puzzle? tryParse({
    required Object? id,
    required Object? difficulty,
    required Object? gridSpec,
    int size = 6,
  }) {
    if (id is! String) return null;
    final diff = Difficulty.tryParse(difficulty);
    if (diff == null) return null;
    if (gridSpec is! Map) return null;

    // solution: size×size of 0|1
    final solutionRaw = gridSpec['solution'];
    if (solutionRaw is! List || solutionRaw.length != size) return null;
    final solution = <List<int>>[];
    for (final row in solutionRaw) {
      if (row is! List || row.length != size) return null;
      final r = <int>[];
      for (final v in row) {
        if (v != 0 && v != 1) return null;
        r.add(v as int);
      }
      solution.add(r);
    }

    // givens: size×size of 0|1|null, and every non-null must agree with solution
    final givensRaw = gridSpec['givens'];
    if (givensRaw is! List || givensRaw.length != size) return null;
    final givens = <List<Cell>>[];
    for (var gr = 0; gr < size; gr++) {
      final row = givensRaw[gr];
      if (row is! List || row.length != size) return null;
      final out = <Cell>[];
      for (var gc = 0; gc < size; gc++) {
        final v = row[gc];
        if (v != 0 && v != 1 && v != null) return null;
        if (v != null && v != solution[gr][gc]) return null;
        out.add(v as Cell);
      }
      givens.add(out);
    }

    // edges: validated for shape, bounds, and consistency with the solution
    final edgesRaw = gridSpec['edges'];
    if (edgesRaw is! List) return null;
    final edges = <Edge>[];
    for (final raw in edgesRaw) {
      final e = Edge.tryFromJson(raw);
      if (e == null) return null;
      if (e.r < 0 || e.c < 0) return null;
      if (e.orientation == EdgeOrientation.h &&
          (e.r >= size || e.c >= size - 1)) {
        return null;
      }
      if (e.orientation == EdgeOrientation.v &&
          (e.r >= size - 1 || e.c >= size)) {
        return null;
      }
      final nr = e.orientation == EdgeOrientation.v ? e.r + 1 : e.r;
      final nc = e.orientation == EdgeOrientation.h ? e.c + 1 : e.c;
      final same = solution[e.r][e.c] == solution[nr][nc];
      if (e.kind == EdgeKind.eq && !same) return null;
      if (e.kind == EdgeKind.ne && same) return null;
      edges.add(e);
    }

    return Puzzle(
      id: id,
      difficulty: diff,
      size: size,
      givens: givens,
      solution: solution,
      edges: edges,
    );
  }

  /// Serialise back to the backend row shape (`id`, `difficulty`, `grid_spec`)
  /// for the offline cache (D3). Round-trips through [tryParse], so a cached
  /// payload is re-validated on read exactly like a fresh row.
  Map<String, Object?> toCacheMap() => {
        'id': id,
        'difficulty': difficulty.wire,
        'grid_spec': {
          'solution': solution,
          'givens': givens,
          'edges': [for (final e in edges) e.toJson()],
        },
      };
}
