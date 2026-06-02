/// On-device move validator — a pure-Dart port of `@parity/engine`
/// (`validators.ts` + `board.ts`). NO Flutter imports (engine-agnostic rule).
/// Reuses the pure model types from the data layer rather than redefining them.
///
/// This is the ONLY game logic ported to Dart — the generator/solver stay on
/// the backend. Keep these semantics in lockstep with the TS engine.
library;

import 'dart:math';

import '../data/models/puzzle.dart';

/// A cell coordinate `(row, col)`. Record value-equality lets a `Set` dedupe.
typedef Coord = (int row, int col);

/// The two cells an edge constrains: `(r1, c1, r2, c2)`.
/// `h` joins (r,c)-(r,c+1); `v` joins (r,c)-(r+1,c).
(int, int, int, int) edgeCells(Edge edge) {
  return edge.orientation == EdgeOrientation.h
      ? (edge.r, edge.c, edge.r, edge.c + 1)
      : (edge.r, edge.c, edge.r + 1, edge.c);
}

/// Every cell that currently breaks a rule. Used for UI highlighting and the
/// validity check. Empty cells never conflict. Mirrors `validators.ts`:
///   • adjacency — no three identical in a row/column run (marks all 3);
///   • balance   — no line may hold more than half of either symbol
///                 (marks ALL cells of the over-represented symbol in the line);
///   • edges     — `eq` must match / `ne` must differ, only when both filled.
Set<Coord> findViolations(Grid grid, List<Edge> edges) {
  final size = grid.length;
  final half = size ~/ 2;
  final bad = <Coord>{};
  void mark(int r, int c) => bad.add((r, c));

  // Adjacency.
  for (var r = 0; r < size; r++) {
    for (var c = 0; c < size; c++) {
      final v = grid[r][c];
      if (v == null) continue;
      if (c + 2 < size && grid[r][c + 1] == v && grid[r][c + 2] == v) {
        mark(r, c);
        mark(r, c + 1);
        mark(r, c + 2);
      }
      if (r + 2 < size && grid[r + 1][c] == v && grid[r + 2][c] == v) {
        mark(r, c);
        mark(r + 1, c);
        mark(r + 2, c);
      }
    }
  }

  // Balance — rows.
  for (var r = 0; r < size; r++) {
    for (final sym in const [0, 1]) {
      final cols = <int>[];
      for (var c = 0; c < size; c++) {
        if (grid[r][c] == sym) cols.add(c);
      }
      if (cols.length > half) {
        for (final c in cols) {
          mark(r, c);
        }
      }
    }
  }
  // Balance — columns.
  for (var c = 0; c < size; c++) {
    for (final sym in const [0, 1]) {
      final rows = <int>[];
      for (var r = 0; r < size; r++) {
        if (grid[r][c] == sym) rows.add(r);
      }
      if (rows.length > half) {
        for (final r in rows) {
          mark(r, c);
        }
      }
    }
  }

  // Edges.
  for (final edge in edges) {
    final (r1, c1, r2, c2) = edgeCells(edge);
    final a = _at(grid, r1, c1);
    final b = _at(grid, r2, c2);
    if (a == null || b == null) continue;
    final ok = edge.kind == EdgeKind.eq ? a == b : a != b;
    if (!ok) {
      mark(r1, c1);
      mark(r2, c2);
    }
  }

  return bad;
}

/// True when the grid has no empty cells.
bool isComplete(Grid grid) =>
    grid.every((row) => row.every((cell) => cell != null));

/// True when the grid (possibly partial) breaks no rule.
bool isValid(Grid grid, List<Edge> edges) =>
    findViolations(grid, edges).isEmpty;

/// True when the grid is fully filled and breaks no rule.
bool isSolved(Grid grid, List<Edge> edges) =>
    isComplete(grid) && isValid(grid, edges);

/// The tap cycle for a cell: empty → A(0) → B(1) → empty.
int? cycle(int? v) => switch (v) {
      null => 0,
      0 => 1,
      _ => null,
    };

/// A local hint: pick a RANDOM empty cell and reveal its solution value
/// (Phase-2 decision — hints are fully on-device, no endpoint). Returns null
/// when the grid is already complete. [random] is injectable for tests.
(int row, int col, int value)? localHint(
  Grid grid,
  Solution solution, {
  Random? random,
}) {
  final empties = <Coord>[];
  for (var r = 0; r < grid.length; r++) {
    for (var c = 0; c < grid[r].length; c++) {
      if (grid[r][c] == null) empties.add((r, c));
    }
  }
  if (empties.isEmpty) return null;
  final (r, c) = empties[(random ?? Random()).nextInt(empties.length)];
  return (r, c, solution[r][c]);
}

/// Would placing [val] at the empty cell (r,c) immediately break a rule?
/// A fast local prune (assumes (r,c) is currently empty). Mirrors
/// `wouldViolate` in `validators.ts`.
bool wouldViolate(Grid grid, int r, int c, int val, List<Edge> edges, int size) {
  // Triple through (r,c), horizontally.
  if (c >= 2 && grid[r][c - 1] == val && grid[r][c - 2] == val) return true;
  if (c >= 1 && c + 1 < size && grid[r][c - 1] == val && grid[r][c + 1] == val) {
    return true;
  }
  if (c + 2 < size && grid[r][c + 1] == val && grid[r][c + 2] == val) return true;
  // Triple through (r,c), vertically.
  if (r >= 2 && grid[r - 1][c] == val && grid[r - 2][c] == val) return true;
  if (r >= 1 && r + 1 < size && grid[r - 1][c] == val && grid[r + 1][c] == val) {
    return true;
  }
  if (r + 2 < size && grid[r + 1][c] == val && grid[r + 2][c] == val) return true;

  // Balance overflow on the row / column.
  final half = size ~/ 2;
  var rowCount = 0;
  for (var cc = 0; cc < size; cc++) {
    if (grid[r][cc] == val) rowCount++;
  }
  if (rowCount + 1 > half) return true;
  var colCount = 0;
  for (var rr = 0; rr < size; rr++) {
    if (grid[rr][c] == val) colCount++;
  }
  if (colCount + 1 > half) return true;

  // Edges touching (r,c) with a known neighbour.
  for (final edge in edges) {
    final (r1, c1, r2, c2) = edgeCells(edge);
    int? nv;
    if (r1 == r && c1 == c) {
      nv = _at(grid, r2, c2);
    } else if (r2 == r && c2 == c) {
      nv = _at(grid, r1, c1);
    } else {
      continue;
    }
    if (nv == null) continue;
    if (edge.kind == EdgeKind.eq ? val != nv : val == nv) return true;
  }

  return false;
}

/// Bounds-safe cell read (out-of-range → null), matching the TS `grid[r]?.[c]`.
int? _at(Grid grid, int r, int c) {
  if (r < 0 || r >= grid.length) return null;
  final row = grid[r];
  if (c < 0 || c >= row.length) return null;
  return row[c];
}
