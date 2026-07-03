import 'package:flutter_test/flutter_test.dart';
import 'package:halve/data/notification_primer.dart';
import 'package:halve/data/prefs_keys.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('defaults to eligible after a daily solve', () async {
    final store = NotificationPrimerStore(
      await SharedPreferences.getInstance(),
    );

    expect(store.shouldShowAfterDailySolve, isTrue);
    expect(store.shown, isFalse);
    expect(store.accepted, isFalse);
    expect(store.dismissed, isFalse);
  });

  test('accepted marks shown and accepted', () async {
    final prefs = await SharedPreferences.getInstance();
    final store = NotificationPrimerStore(prefs);

    await store.markAccepted();

    expect(store.shouldShowAfterDailySolve, isFalse);
    expect(prefs.getBool(prefKeyReminderPrimerShown), isTrue);
    expect(prefs.getBool(prefKeyReminderPrimerAccepted), isTrue);
  });

  test('dismissed marks shown and dismissed', () async {
    final prefs = await SharedPreferences.getInstance();
    final store = NotificationPrimerStore(prefs);

    await store.markDismissed();

    expect(store.shouldShowAfterDailySolve, isFalse);
    expect(prefs.getBool(prefKeyReminderPrimerShown), isTrue);
    expect(prefs.getBool(prefKeyReminderPrimerDismissed), isTrue);
  });
}
