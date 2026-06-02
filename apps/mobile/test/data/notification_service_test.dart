import 'package:flutter/material.dart' show TimeOfDay;
import 'package:flutter_test/flutter_test.dart';
import 'package:halve/data/notification_service.dart';

void main() {
  group('reminderTimeOfDay', () {
    // ── AM values ─────────────────────────────────────────────────────────────

    test('12 AM is midnight (00:00)', () {
      final t = reminderTimeOfDay(12, 'am');
      expect(t, const TimeOfDay(hour: 0, minute: 0));
    });

    test('1 AM', () {
      final t = reminderTimeOfDay(1, 'am');
      expect(t, const TimeOfDay(hour: 1, minute: 0));
    });

    test('6 AM', () {
      final t = reminderTimeOfDay(6, 'am');
      expect(t, const TimeOfDay(hour: 6, minute: 0));
    });

    test('11 AM', () {
      final t = reminderTimeOfDay(11, 'am');
      expect(t, const TimeOfDay(hour: 11, minute: 0));
    });

    // ── PM values ─────────────────────────────────────────────────────────────

    test('12 PM is noon (12:00)', () {
      final t = reminderTimeOfDay(12, 'pm');
      expect(t, const TimeOfDay(hour: 12, minute: 0));
    });

    test('1 PM', () {
      final t = reminderTimeOfDay(1, 'pm');
      expect(t, const TimeOfDay(hour: 13, minute: 0));
    });

    test('6 PM', () {
      final t = reminderTimeOfDay(6, 'pm');
      expect(t, const TimeOfDay(hour: 18, minute: 0));
    });

    test('8 PM (common default)', () {
      final t = reminderTimeOfDay(8, 'pm');
      expect(t, const TimeOfDay(hour: 20, minute: 0));
    });

    test('11 PM', () {
      final t = reminderTimeOfDay(11, 'pm');
      expect(t, const TimeOfDay(hour: 23, minute: 0));
    });

    // ── Default settings value ─────────────────────────────────────────────────

    test('default reminder (8 am) maps to 08:00', () {
      final t = reminderTimeOfDay(8, 'am');
      expect(t, const TimeOfDay(hour: 8, minute: 0));
    });

    // ── Full clock coverage (AM 1–12 + PM 1–12) ───────────────────────────────

    test('all 24 clock values round-trip without collision', () {
      final seen = <int>{};
      for (int h = 1; h <= 12; h++) {
        final am = reminderTimeOfDay(h, 'am');
        final pm = reminderTimeOfDay(h, 'pm');
        expect(seen.add(am.hour), isTrue, reason: '$h am collides');
        expect(seen.add(pm.hour), isTrue, reason: '$h pm collides');
      }
      expect(seen.length, 24);
    });

    test('minutes are always zero', () {
      for (int h = 1; h <= 12; h++) {
        expect(reminderTimeOfDay(h, 'am').minute, 0);
        expect(reminderTimeOfDay(h, 'pm').minute, 0);
      }
    });
  });
}
