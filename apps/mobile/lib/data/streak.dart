import 'local_date.dart';

/// Streak + day-bucketing math for the daily puzzle — the Dart mirror of
/// `apps/web/src/lib/streak.ts`. Operates on lists of `yyyy-MM-dd` strings in
/// the user's LOCAL calendar day (see [solveDay] / [localToday]), never UTC
/// timestamps. Streaks/stats are DERIVED from solves here — never denormalized
/// (project rule).

/// Offset a `yyyy-MM-dd` string by [delta] days (no timezone conversion).
String offsetDay(String date, int delta) {
  final parts = date.split('-');
  final d = DateTime(
    int.parse(parts[0]),
    int.parse(parts[1]),
    int.parse(parts[2]) + delta,
  );
  return formatDay(d);
}

/// Current consecutive-day streak ending at (or just before) [today].
///
/// TODAY-SAFE: the streak isn't broken merely because today's puzzle isn't
/// solved yet — the user has until their local midnight. So if [today] is
/// absent but yesterday is present, counting starts at yesterday and the
/// streak stands. It collapses to 0 only once a full unsolved day has elapsed.
int computeStreak(List<String> days, String today) {
  final set = days.toSet();
  var cur = set.contains(today) ? today : offsetDay(today, -1);
  var streak = 0;
  while (set.contains(cur)) {
    streak++;
    cur = offsetDay(cur, -1);
  }
  return streak;
}

/// Longest run of consecutive solved days across the whole history.
/// Independent of "today" — purely a property of the solved-day set.
int computeLongestStreak(List<String> days) {
  if (days.isEmpty) return 0;
  final sorted = days.toSet().toList()..sort();
  var longest = 1;
  var cur = 1;
  for (var i = 1; i < sorted.length; i++) {
    final diff = DateTime.parse(sorted[i])
            .difference(DateTime.parse(sorted[i - 1]))
            .inDays;
    if (diff == 1) {
      cur++;
      if (cur > longest) longest = cur;
    } else if (diff > 1) {
      cur = 1;
    }
  }
  return longest;
}

/// Boolean presence map for the last [n] days, oldest → newest, ending at
/// [today] (so the final element is today). Powers the home 7-dot row.
List<bool> computeLastDays(List<String> days, String today, int n) {
  final set = days.toSet();
  return [for (var i = 0; i < n; i++) set.contains(offsetDay(today, -(n - 1 - i)))];
}
