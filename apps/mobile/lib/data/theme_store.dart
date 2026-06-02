import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const themeModeKey = 'halve:theme';

/// Persists the user's theme preference to shared_preferences and exposes it as
/// a [ThemeMode] via Riverpod. The MaterialApp watches this notifier and
/// rebuilds when the mode changes. Null prefs = in-memory only (test / guest
/// fallback).
class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier(this._prefs) : super(_load(_prefs));

  final SharedPreferences? _prefs;

  static ThemeMode _load(SharedPreferences? prefs) {
    if (prefs == null) return ThemeMode.system;
    return switch (prefs.getString(themeModeKey) ?? 'system') {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };
  }

  Future<void> setMode(ThemeMode mode) async {
    state = mode;
    final raw = switch (mode) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      _ => 'system',
    };
    await _prefs?.setString(themeModeKey, raw);
  }
}

/// Riverpod provider. Defaults to [ThemeMode.system] with no persistence (no
/// prefs). `main.dart` overrides with a [ThemeModeNotifier] backed by real
/// [SharedPreferences]; widget tests override with one backed by mock prefs.
final themeModeProvider =
    StateNotifierProvider<ThemeModeNotifier, ThemeMode>(
  (ref) => ThemeModeNotifier(null),
);
