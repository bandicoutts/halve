import 'package:flutter_test/flutter_test.dart';
import 'package:halve/data/local_date.dart';
import 'package:halve/data/models/solve.dart';

void main() {
  test('formatDay zero-pads', () {
    expect(formatDay(DateTime(2026, 6, 1)), '2026-06-01');
    expect(formatDay(DateTime(2026, 12, 31)), '2026-12-31');
  });

  test('formatDateLabel renders "Weekday, Month D"', () {
    // 2026-06-01 is a Monday.
    expect(formatDateLabel('2026-06-01'), 'Monday, June 1');
    expect(formatDateLabel('2026-12-25'), 'Friday, December 25');
  });

  test('localToday matches formatDay(DateTime.now())', () {
    expect(localToday(), formatDay(DateTime.now()));
  });

  group('solveDay', () {
    test('prefers the stored local date', () {
      final row = SolveRow(
        solvedAt: DateTime.utc(2026, 6, 1, 23, 30),
        durationMs: 1000,
        usedHint: false,
        localDate: '2026-06-02',
      );
      expect(solveDay(row), '2026-06-02');
    });

    test('falls back to the UTC date of solvedAt (BE-3)', () {
      final row = SolveRow(
        solvedAt: DateTime.utc(2026, 6, 1, 23, 30),
        durationMs: 1000,
        usedHint: false,
        localDate: null,
      );
      expect(solveDay(row), '2026-06-01');
    });
  });
}
