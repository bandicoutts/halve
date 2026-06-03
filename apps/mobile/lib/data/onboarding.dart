import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'prefs_keys.dart';

/// First-run gate state — whether this device has completed (or skipped) the
/// onboarding tutorial. Persisted to `shared_preferences`; read once at cold
/// start to decide whether to land on `/firstrun` or Home. Behind a provider
/// so tests inject a fake.

abstract interface class OnboardingStore {
  Future<bool> isOnboarded();
  Future<void> setOnboarded();
}

/// Real implementation. Swallows a missing-plugin error (e.g. in widget tests
/// that don't set mock values) so the app degrades to "not onboarded".
class SharedPrefsOnboarding implements OnboardingStore {
  const SharedPrefsOnboarding();

  @override
  Future<bool> isOnboarded() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool(prefKeyOnboarded) ?? false;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<void> setOnboarded() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(prefKeyOnboarded, true);
    } catch (_) {
      // No persistence available — first-run simply shows again next launch.
    }
  }
}

final onboardingStoreProvider = Provider<OnboardingStore>(
  (ref) => const SharedPrefsOnboarding(),
);

/// The cold-start landing route: returning (onboarded) users go straight to
/// Home; first-timers see the onboarding flow. The literals mirror
/// `Routes.home` / `Routes.firstrun` (kept here to avoid a router import cycle).
String firstRunInitialLocation({required bool onboarded}) =>
    onboarded ? '/' : '/firstrun';
