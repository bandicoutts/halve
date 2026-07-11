import 'package:flutter/services.dart';

export 'prefs_keys.dart' show prefKeyHaptics;

/// Synchronous haptics gate — configure once at startup, update on settings change.
class HapticsService {
  HapticsService._();
  static final instance = HapticsService._();

  bool _enabled = true;

  void configure(bool enabled) => _enabled = enabled;

  Future<void> _fire(Future<void> Function() fn) async {
    if (_enabled) await fn();
  }

  /// Light impact: cell tap cycle.
  Future<void> onTap() => _fire(HapticFeedback.lightImpact);

  /// Selection click: bottom tab changes and similar mode switches.
  Future<void> onSelection() => _fire(HapticFeedback.selectionClick);

  /// Medium impact: puzzle solved.
  Future<void> onWin() => _fire(HapticFeedback.mediumImpact);

  /// Light impact: new violation appeared.
  Future<void> onError() => _fire(HapticFeedback.lightImpact);

  /// Light impact: a row or column just became fully filled.
  Future<void> onLineComplete() => _fire(HapticFeedback.lightImpact);
}

/// Convenience top-level wrappers (call-site API unchanged).
Future<void> hapticsOnTap() => HapticsService.instance.onTap();
Future<void> hapticsOnSelection() => HapticsService.instance.onSelection();
Future<void> hapticsOnWin() => HapticsService.instance.onWin();
Future<void> hapticsOnError() => HapticsService.instance.onError();
Future<void> hapticsOnLineComplete() =>
    HapticsService.instance.onLineComplete();
