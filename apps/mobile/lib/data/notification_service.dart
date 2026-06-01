import 'dart:async';

import 'package:flutter/material.dart' show TimeOfDay;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest_all.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

import '../router/app_router.dart';

// ─── Constants ────────────────────────────────────────────────────────────────

const _channelId = 'daily_puzzle';
const _channelName = 'Daily puzzle';
const _reminderId = 1; // stable ID for the daily reminder slot

// Prefs keys — must match settings_screen.dart
const _reminderKey = 'halve:reminder';
const _reminderHourKey = 'halve:reminder_hour';
const _reminderAmpmKey = 'halve:reminder_ampm';

// ─── Background local-notification tap handler (top-level — required) ─────────

@pragma('vm:entry-point')
void onBackgroundNotificationTap(NotificationResponse response) {
  // Cannot navigate here (separate isolate). Navigation is handled when the
  // app resumes and routeStream emits via the foreground tap handler.
}

// ─── Public helper — pure function, easy to unit-test ─────────────────────────

/// Convert a 12-hour clock value to a [TimeOfDay].
/// [hour] is 1–12; [ampm] is `'am'` or `'pm'`.
///
/// 12 AM = midnight (00:00), 12 PM = noon (12:00).
TimeOfDay reminderTimeOfDay(int hour, String ampm) {
  assert(hour >= 1 && hour <= 12, 'hour must be 1–12, got $hour');
  final pm = ampm == 'pm';
  int h24;
  if (!pm && hour == 12) {
    h24 = 0; // 12 AM → midnight
  } else if (pm && hour != 12) {
    h24 = hour + 12; // 1 PM → 13, …, 11 PM → 23
  } else {
    h24 = hour; // 1–11 AM → 1–11; 12 PM → 12
  }
  return TimeOfDay(hour: h24, minute: 0);
}

// ─── NotificationService ──────────────────────────────────────────────────────

class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final _plugin = FlutterLocalNotificationsPlugin();

  // Emits route strings when the user taps a local notification.
  final _routeController = StreamController<String>.broadcast();
  Stream<String> get routeStream => _routeController.stream;

  // ── Init ────────────────────────────────────────────────────────────────────

  Future<void> init() async {
    tz_data.initializeTimeZones();
    try {
      final tzName = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(tzName));
    } catch (_) {
      // Fallback: leave tz.local as UTC (acceptable degradation).
    }

    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    // Don't request permissions at init — we ask on firstrun Accept tap.
    const ios = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    await _plugin.initialize(
      const InitializationSettings(android: android, iOS: ios),
      onDidReceiveNotificationResponse: _onNotificationTap,
      onDidReceiveBackgroundNotificationResponse: onBackgroundNotificationTap,
    );

    // Create the Android "Daily puzzle" channel (HIGH importance) once.
    await _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(const AndroidNotificationChannel(
          _channelId,
          _channelName,
          importance: Importance.high,
        ));
  }

  void _onNotificationTap(NotificationResponse response) {
    _routeController.add(Routes.play);
  }

  // ── Permission ──────────────────────────────────────────────────────────────

  /// Request OS notification permission. Called once on firstrun Accept.
  ///
  /// iOS: provisional authorization (quiet delivery — no banner/sound until the
  /// user upgrades to full permission via system settings). No aggressive prompt.
  /// Android 13+: system POST_NOTIFICATIONS dialog.
  Future<void> requestPermission() async {
    await _plugin
        .resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin>()
        ?.requestPermissions(
          alert: true,
          badge: true,
          sound: true,
          provisional: true,
        );
    await _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
  }

  // ── Daily reminder ──────────────────────────────────────────────────────────

  /// Schedule (or reschedule) the daily reminder. Replaces any existing slot.
  Future<void> scheduleDaily(int hour, String ampm) async {
    final time = reminderTimeOfDay(hour, ampm);
    await _plugin.zonedSchedule(
      _reminderId,
      'Halve',
      "Today's Halve puzzle is ready.",
      _nextOccurrence(time),
      const NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          _channelName,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@drawable/ic_notification',
        ),
        iOS: DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: false,
          presentSound: true,
        ),
      ),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.time,
    );
  }

  /// Cancel the daily reminder.
  Future<void> cancelReminder() => _plugin.cancel(_reminderId);

  /// On app launch: reschedule the reminder if the user has one set. This keeps
  /// the schedule alive after an app update (which clears pending notifications).
  Future<void> rescheduleOnLaunch(SharedPreferences prefs) async {
    final on = prefs.getBool(_reminderKey) ?? false;
    if (!on) return;
    final hour = prefs.getInt(_reminderHourKey) ?? 8;
    final ampm = prefs.getString(_reminderAmpmKey) ?? 'am';
    await scheduleDaily(hour, ampm);
  }

  tz.TZDateTime _nextOccurrence(TimeOfDay time) {
    final now = tz.TZDateTime.now(tz.local);
    var scheduled = tz.TZDateTime(
        tz.local, now.year, now.month, now.day, time.hour, 0);
    if (scheduled.isBefore(now)) {
      scheduled = scheduled.add(const Duration(days: 1));
    }
    return scheduled;
  }
}
