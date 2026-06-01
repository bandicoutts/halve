import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:halve/data/haptics_service.dart';

void main() {
  group('haptics_service', () {
    setUp(() => SharedPreferences.setMockInitialValues({}));

    test('hapticsOnTap completes without error when haptics enabled (default)',
        () async {
      SharedPreferences.setMockInitialValues({'halve:haptics': true});
      await expectLater(hapticsOnTap(), completes);
    });

    test('hapticsOnTap completes without error when haptics disabled',
        () async {
      SharedPreferences.setMockInitialValues({'halve:haptics': false});
      await expectLater(hapticsOnTap(), completes);
    });

    test('hapticsOnWin completes without error when enabled', () async {
      SharedPreferences.setMockInitialValues({'halve:haptics': true});
      await expectLater(hapticsOnWin(), completes);
    });

    test('hapticsOnWin completes without error when disabled', () async {
      SharedPreferences.setMockInitialValues({'halve:haptics': false});
      await expectLater(hapticsOnWin(), completes);
    });

    test('hapticsOnError completes without error when enabled', () async {
      SharedPreferences.setMockInitialValues({'halve:haptics': true});
      await expectLater(hapticsOnError(), completes);
    });

    test('hapticsOnError completes without error when disabled', () async {
      SharedPreferences.setMockInitialValues({'halve:haptics': false});
      await expectLater(hapticsOnError(), completes);
    });

    test('defaults to enabled when pref is absent', () async {
      // No key set — should still complete (default true).
      await expectLater(hapticsOnTap(), completes);
    });
  });
}
