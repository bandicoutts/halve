import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'prefs_keys.dart';
import 'theme_store.dart';

/// Persists the post-first-solve reminder primer decision. The OS permission
/// prompt is only requested after the player accepts this in-app primer.
class NotificationPrimerStore {
  NotificationPrimerStore(this._prefs);

  final SharedPreferences? _prefs;
  bool _memoryShown = false;
  bool _memoryAccepted = false;
  bool _memoryDismissed = false;

  bool get shown => _prefs?.getBool(prefKeyReminderPrimerShown) ?? _memoryShown;
  bool get accepted =>
      _prefs?.getBool(prefKeyReminderPrimerAccepted) ?? _memoryAccepted;
  bool get dismissed =>
      _prefs?.getBool(prefKeyReminderPrimerDismissed) ?? _memoryDismissed;

  bool get shouldShowAfterDailySolve => !shown && !accepted && !dismissed;

  Future<void> markAccepted() async {
    _memoryShown = true;
    _memoryAccepted = true;
    await _prefs?.setBool(prefKeyReminderPrimerShown, true);
    await _prefs?.setBool(prefKeyReminderPrimerAccepted, true);
  }

  Future<void> markDismissed() async {
    _memoryShown = true;
    _memoryDismissed = true;
    await _prefs?.setBool(prefKeyReminderPrimerShown, true);
    await _prefs?.setBool(prefKeyReminderPrimerDismissed, true);
  }
}

final notificationPrimerStoreProvider = Provider<NotificationPrimerStore>(
  (ref) => NotificationPrimerStore(ref.watch(sharedPreferencesProvider)),
);
