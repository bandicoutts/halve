import 'package:flutter_test/flutter_test.dart';
import 'package:halve/data/streak.dart';

void main() {
  group('offsetDay', () {
    test('shifts within a month', () {
      expect(offsetDay('2026-06-15', -1), '2026-06-14');
      expect(offsetDay('2026-06-15', 1), '2026-06-16');
    });

    test('rolls across month and year boundaries', () {
      expect(offsetDay('2026-03-01', -1), '2026-02-28');
      expect(offsetDay('2026-01-01', -1), '2025-12-31');
      expect(offsetDay('2025-12-31', 1), '2026-01-01');
    });
  });

  group('computeStreak', () {
    test('is 0 with no solves', () {
      expect(computeStreak([], '2026-06-01'), 0);
    });

    test('counts a run ending today', () {
      final days = ['2026-05-30', '2026-05-31', '2026-06-01'];
      expect(computeStreak(days, '2026-06-01'), 3);
    });

    test('is TODAY-SAFE: survives on yesterday when today is unsolved', () {
      final days = ['2026-05-30', '2026-05-31'];
      expect(computeStreak(days, '2026-06-01'), 2);
    });

    test('collapses to 0 once a full unsolved day elapses', () {
      final days = ['2026-05-29', '2026-05-30'];
      expect(computeStreak(days, '2026-06-01'), 0);
    });

    test('ignores order and duplicates', () {
      final days = ['2026-06-01', '2026-05-31', '2026-06-01', '2026-05-30'];
      expect(computeStreak(days, '2026-06-01'), 3);
    });
  });

  group('computeLongestStreak', () {
    test('finds the longest run regardless of today', () {
      final days = [
        '2026-05-01', '2026-05-02', '2026-05-03', // run of 3
        '2026-05-10', // gap
        '2026-05-20', '2026-05-21', // run of 2
      ];
      expect(computeLongestStreak(days), 3);
    });

    test('is 0 when empty, 1 for a single day', () {
      expect(computeLongestStreak([]), 0);
      expect(computeLongestStreak(['2026-06-01']), 1);
    });
  });

  group('computeLastDays', () {
    test('marks only the present days, oldest → today', () {
      final last7 = computeLastDays(['2026-06-01', '2026-05-30'], '2026-06-01', 7);
      expect(last7.length, 7);
      expect(last7.last, isTrue); // today (index 6)
      expect(last7[5], isFalse); // yesterday — not solved
      expect(last7[4], isTrue); // two days ago — solved
      expect(last7.where((d) => d).length, 2);
    });
  });
}
