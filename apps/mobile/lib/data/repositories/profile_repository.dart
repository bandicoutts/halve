import 'package:supabase_flutter/supabase_flutter.dart';

/// Reads the `profiles` table. One row per authenticated user, created by the
/// `on_auth_user_created` database trigger. Used to surface the display name
/// the user may have set — auth metadata is the fallback when this is null.
class ProfileRepository {
  ProfileRepository(this._client);

  final SupabaseClient _client;

  /// Returns the stored `display_name` for [userId], or null if none is set.
  Future<String?> fetchDisplayName(String userId) async {
    final row = await _client
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .maybeSingle();
    final name = row?['display_name'] as String?;
    return (name != null && name.isNotEmpty) ? name : null;
  }

  /// Upserts the `display_name` for [userId] in the `profiles` table.
  Future<void> updateDisplayName(String userId, String name) async {
    await _client
        .from('profiles')
        .upsert({'id': userId, 'display_name': name});
  }
}
