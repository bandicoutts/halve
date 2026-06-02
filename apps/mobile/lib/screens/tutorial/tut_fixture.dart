import '../../data/models/models.dart';

/// The tutorial's hand-authored 4×4 — each row and column exactly halved, with
/// a unique deduction-only solution and four `=`/`≠` edge clues. A faithful
/// port of `TUT4` in the wireframe `teach-board.jsx`. Small enough to teach the
/// three rules (no crowding, half-and-half, read the edges) in one board.
abstract final class Tut4 {
  static const int n = 4;

  static const Solution solution = [
    [0, 0, 1, 1],
    [1, 1, 0, 0],
    [0, 1, 1, 0],
    [1, 0, 0, 1],
  ];

  /// `null` = the player fills it in; otherwise a locked given.
  static const Grid givens = [
    [0, 0, null, 1],
    [null, 1, 0, null],
    [0, null, 1, null],
    [1, null, null, 1],
  ];

  static const List<Edge> edges = [
    Edge(orientation: EdgeOrientation.h, r: 0, c: 2, kind: EdgeKind.eq), // 1 = 1
    Edge(orientation: EdgeOrientation.v, r: 0, c: 0, kind: EdgeKind.ne), // 0 ≠ 1
    Edge(orientation: EdgeOrientation.h, r: 2, c: 1, kind: EdgeKind.eq), // 1 = 1
    Edge(orientation: EdgeOrientation.v, r: 2, c: 3, kind: EdgeKind.ne), // 0 ≠ 1
  ];

  /// The single forced opening move the guided step walks the player through.
  static const ({int r, int c, int val}) guide = (r: 1, c: 0, val: 1);
}
