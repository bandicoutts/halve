import 'package:flutter_test/flutter_test.dart';
import 'package:halve/data/onboarding.dart';
import 'package:halve/data/prefs_keys.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('firstRunInitialLocation', () {
    test('fresh device → /firstrun', () {
      expect(firstRunInitialLocation(onboarded: false), '/firstrun');
    });

    test('returning device → Home', () {
      expect(firstRunInitialLocation(onboarded: true), '/');
    });
  });

  group('SharedPrefsOnboarding', () {
    test('defaults to not-onboarded, then persists the flag', () async {
      SharedPreferences.setMockInitialValues({});
      const store = SharedPrefsOnboarding();

      expect(await store.isOnboarded(), isFalse);
      await store.setOnboarded();
      expect(await store.isOnboarded(), isTrue);

      // Persisted under the web-parity key.
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool(prefKeyOnboarded), isTrue);
    });
  });
}
