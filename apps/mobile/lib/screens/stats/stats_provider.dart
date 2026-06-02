import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/local_date.dart';
import '../../data/models/models.dart';
import '../../providers/providers.dart';

/// Everything the Stats screen needs in one resolved value.
class StatsData {
  const StatsData({
    required this.signedIn,
    required this.today,
    this.stats,
    this.displayName,
  });

  final bool signedIn;

  /// The player's local day, `yyyy-MM-dd`.
  final String today;

  /// Null while loading or when signed out.
  final Stats? stats;

  /// Display name from auth metadata / profiles; null for guest.
  final String? displayName;

  bool get hasSolves => (stats?.totalSolved ?? 0) > 0;
}

/// Async provider for Stats screen data. Signed-out: returns a guest shell
/// (no stats). Signed-in: fetches solves + derives stats.
final statsDataProvider = FutureProvider<StatsData>((ref) async {
  final user = ref.watch(currentUserProvider);
  final today = localToday();

  if (user == null) {
    return StatsData(signedIn: false, today: today);
  }

  final createdAt = DateTime.tryParse(user.createdAt);

  final solveRepo = ref.watch(solveRepositoryProvider);
  if (solveRepo == null) {
    return StatsData(signedIn: true, today: today, stats: Stats.emptyFor(today, createdAt: createdAt));
  }

  final solves = await solveRepo.fetchSolves(user.id);
  final stats = Stats.fromSolves(solves, today: today, createdAt: createdAt);

  // Display name: profiles table first, then auth metadata, then email local-part.
  String? displayName;
  final profileRepo = ref.watch(profileRepositoryProvider);
  if (profileRepo != null) {
    displayName = await profileRepo.fetchDisplayName(user.id);
  }
  displayName ??= user.userMetadata?['display_name'] as String?;
  displayName ??= user.userMetadata?['name'] as String?;
  final email = user.email ?? '';
  displayName ??= email.split('@').first;

  return StatsData(
    signedIn: true,
    today: today,
    stats: stats,
    displayName: displayName,
  );
});
