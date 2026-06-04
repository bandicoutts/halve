import 'models/solve.dart';

/// Local-day helpers — the Dart mirror of `apps/web/src/lib/local-date.ts`.
///
/// "Today" and every streak bucket are the user's LOCAL calendar day
/// (`yyyy-MM-dd`), never a UTC timestamp — so the served daily puzzle's date
/// matches the day the user actually experienced (EPIC-B). All functions here
/// are pure and timezone-explicit so they're deterministic in tests.

const kMonthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// DateTime.weekday is 1=Monday … 7=Sunday.
const _weekdays = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

/// Format a [DateTime]'s calendar date as `yyyy-MM-dd` (no timezone shift —
/// uses the date fields as-is).
String formatDay(DateTime d) {
  final y = d.year.toString().padLeft(4, '0');
  final m = d.month.toString().padLeft(2, '0');
  final dd = d.day.toString().padLeft(2, '0');
  return '$y-$m-$dd';
}

/// "Today" as the device-local `yyyy-MM-dd`.
/// Accepts an optional [now] for testing streak logic without mocking the clock.
String localToday([DateTime? now]) => formatDay(now ?? DateTime.now());

/// Human label for a `yyyy-MM-dd` string, e.g. "Monday, June 1". Mirrors the
/// web `formatDateLabel`. Built without `intl` (no extra dep) — month/weekday
/// names are fixed English, matching the web output.
String formatDateLabel(String date) {
  final dt = _parse(date);
  if (dt == null) return date;
  return '${_weekdays[dt.weekday - 1]}, ${kMonthNames[dt.month - 1]} ${dt.day}';
}

/// Short human label for a `yyyy-MM-dd` string, e.g. "June 2".
String formatShortDate(String date) {
  final dt = _parse(date);
  if (dt == null) return date;
  return '${kMonthNames[dt.month - 1]} ${dt.day}';
}

/// Day-of-week name for a `yyyy-MM-dd` string, e.g. "Wednesday".
String formatDayName(String date) {
  final dt = _parse(date);
  if (dt == null) return '';
  return _weekdays[dt.weekday - 1];
}

/// The best day string for a solve row: prefer the stored local date, falling
/// back to the UTC date of `solved_at` for legacy null-`local_date` rows
/// (BE-3). Mirrors the web `solveDay`.
String solveDay(SolveRow row) => row.localDate ?? formatDay(row.solvedAt.toUtc());

/// Format a solve duration in milliseconds as `m:ss` (e.g. `"1:24"`).
/// Uses rounding so the displayed time matches the win-screen value.
String formatMs(int ms) {
  final totalSeconds = (ms / 1000).round();
  final m = totalSeconds ~/ 60;
  final s = (totalSeconds % 60).toString().padLeft(2, '0');
  return '$m:$s';
}

DateTime? _parse(String date) {
  final parts = date.split('-');
  if (parts.length != 3) return null;
  final y = int.tryParse(parts[0]);
  final m = int.tryParse(parts[1]);
  final d = int.tryParse(parts[2]);
  if (y == null || m == null || d == null) return null;
  return DateTime(y, m, d);
}
