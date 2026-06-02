import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../providers/providers.dart';

/// Data the settings screen needs beyond what shared_preferences provides locally.
class SettingsData {
  const SettingsData({
    required this.isSignedIn,
    this.email,
    this.displayName,
    this.version,
  });

  final bool isSignedIn;
  final String? email;

  /// Fetched from the `profiles` table; falls back to auth metadata then email
  /// local-part. Null when not signed in.
  final String? displayName;

  /// App version string from [PackageInfo] — e.g. "1.0.0 (1)".
  final String? version;

  /// The label to show in the Account row header.
  String get accountLabel => displayName ?? email ?? 'Account';
}

final settingsDataProvider = FutureProvider.autoDispose<SettingsData>((ref) async {
  final isSignedIn = ref.watch(isSignedInProvider);
  final user = ref.watch(currentUserProvider);

  String? displayName;
  if (isSignedIn && user != null) {
    // Try the profiles table first; fall back to auth metadata.
    final profileRepo = ref.watch(profileRepositoryProvider);
    if (profileRepo != null) {
      displayName = await profileRepo.fetchDisplayName(user.id);
    }
    displayName ??= user.userMetadata?['display_name'] as String?;
    displayName ??= user.userMetadata?['name'] as String?;
  }

  String? version;
  try {
    final info = await PackageInfo.fromPlatform();
    version = info.buildNumber.isNotEmpty
        ? '${info.version} (${info.buildNumber})'
        : info.version;
  } catch (_) {}

  return SettingsData(
    isSignedIn: isSignedIn,
    email: user?.email,
    displayName: displayName,
    version: version,
  );
});
