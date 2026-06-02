import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../data/local_date.dart';
import '../../data/streak.dart';
import '../../providers/providers.dart';
import '../play/play_provider.dart';

/// What the Win screen needs to resolve asynchronously: the puzzle ordinal
/// ("Puzzle No.") and the current daily streak. Keyed for the family so the
/// fetch de-dupes across rebuilds.
class WinQuery {
  const WinQuery({required this.kind, this.date});

  final PlayKind kind;

  /// Archive day in `yyyy-MM-dd`; null for today's daily.
  final String? date;

  @override
  bool operator ==(Object other) =>
      other is WinQuery && other.kind == kind && other.date == date;

  @override
  int get hashCode => Object.hash(kind, date);
}

/// The resolved Win metadata. Both fields degrade gracefully (null / 0) when
/// offline, a guest, or practice — the screen renders without them.
class WinInfo {
  const WinInfo({this.dayNo, this.streak = 0});

  /// The puzzle's archive ordinal (1-based), or null when unknown / practice.
  final int? dayNo;

  /// Current consecutive-day daily streak (derived from `solves`).
  final int streak;
}

/// Resolves [WinInfo] for the finished puzzle:
///   • dayNo  — daily → the count of dated dailies ≤ today (matches Home's
///     "Puzzle No."); archive → that date's 1-based position; practice → null.
///   • streak — signed-in → `computeStreak` over the user's solve days;
///     guest → 0 (no on-device guest solve log yet — see build log).
/// All failures are swallowed to a best-effort [WinInfo]; the Win screen never
/// blocks on this.
final winInfoProvider =
    FutureProvider.autoDispose.family<WinInfo, WinQuery>((ref, q) async {
  if (q.kind == PlayKind.practice) return const WinInfo();

  final today = localToday();

  // Null in guest mode (no backend creds) — degrade to WinInfo defaults.
  final puzzleRepo = ref.watch(puzzleRepositoryProvider);
  final solveRepo = ref.watch(solveRepositoryProvider);

  int? dayNo;
  if (puzzleRepo != null) {
    try {
      if (q.kind == PlayKind.daily) {
        dayNo = await puzzleRepo.fetchPuzzleCount(today);
      } else if (q.date != null) {
        dayNo = await puzzleRepo.fetchPuzzleCount(q.date!);
      }
    } catch (e, st) {
      debugPrint('winInfoProvider fetch failed: $e\n$st');
      dayNo = null;
    }
  }

  var streak = 0;
  final user = ref.watch(currentUserProvider);
  if (user != null && solveRepo != null) {
    try {
      final solves = await solveRepo.fetchSolves(user.id);
      final days = {for (final s in solves) solveDay(s)}.toList();
      streak = computeStreak(days, today);
    } catch (e, st) {
      debugPrint('winInfoProvider streak fetch failed: $e\n$st');
      streak = 0;
    }
  }

  return WinInfo(dayNo: dayNo, streak: streak);
});

/// Persists the one-time "sign in to keep your streak" nudge dismissal. Behind
/// a provider so tests inject a fake; the default reads/writes
/// `shared_preferences` and degrades to a no-op when the plugin is unavailable
/// (e.g. in widget tests that don't set mock values).
abstract interface class StreakNudgePrefs {
  Future<bool> isDismissed();
  Future<void> setDismissed();
}

/// The `shared_preferences` key for the dismissed flag (parity with the web
/// `localStorage` key in `app/HANDOFF.md`).
const streakNudgeDismissedKey = 'halve:streak-nudge-dismissed';

class SharedPrefsStreakNudge implements StreakNudgePrefs {
  const SharedPrefsStreakNudge();

  @override
  Future<bool> isDismissed() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool(streakNudgeDismissedKey) ?? false;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<void> setDismissed() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(streakNudgeDismissedKey, true);
    } catch (_) {
      // No persistence available — the nudge simply reappears next session.
    }
  }
}

final streakNudgePrefsProvider = Provider<StreakNudgePrefs>(
  (ref) => const SharedPrefsStreakNudge(),
);

/// The spoiler-free share payload — matches the web `ShareSheet` `SHARE_TEXT`.
/// Never includes the solved grid. For a dated puzzle with a streak:
/// `Halve No. 42 · 1:23 · Medium · streak 5\nNo spoilers — play at halve.today`.
String buildShareText({
  int? dayNo,
  required String time,
  required String difficulty,
  int? streak,
}) {
  const tail = '\nNo spoilers — play at halve.today';
  if (dayNo != null) {
    final streakPart = (streak != null && streak > 0) ? ' · streak $streak' : '';
    return 'Halve No. $dayNo · $time · $difficulty$streakPart$tail';
  }
  return 'Halve · $time · $difficulty$tail';
}

/// "June 1, 2026" from a `yyyy-MM-dd` string (mirrors the web keepsake date).
String formatKeepsakeDate(String iso) {
  final short = formatShortDate(iso); // e.g. "June 1"
  final parts = iso.split('-');
  if (parts.length != 3) return iso;
  final y = int.tryParse(parts[0]);
  if (y == null) return iso;
  return '$short, $y';
}

/// Whole minutes/hours until the player's next local midnight, formatted like
/// "9h 12m" (or "12m" within the final hour). Static, computed at build time.
String formatCountdownToMidnight(DateTime now) {
  final nextMidnight = DateTime(now.year, now.month, now.day + 1);
  final remaining = nextMidnight.difference(now);
  final totalMinutes = remaining.inMinutes;
  final h = totalMinutes ~/ 60;
  final m = totalMinutes % 60;
  return h > 0 ? '${h}h ${m}m' : '${m}m';
}
