import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Must match settings_screen.dart.
const _hapticsKey = 'halve:haptics';

/// Light impact: cell tap cycle.
Future<void> hapticsOnTap() => _fire(HapticFeedback.lightImpact);

/// Medium impact: puzzle solved.
Future<void> hapticsOnWin() => _fire(HapticFeedback.mediumImpact);

/// Light impact: new violation appeared.
Future<void> hapticsOnError() => _fire(HapticFeedback.lightImpact);

Future<void> _fire(Future<void> Function() fn) async {
  final prefs = await SharedPreferences.getInstance();
  if (prefs.getBool(_hapticsKey) ?? true) await fn();
}
