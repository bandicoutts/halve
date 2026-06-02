import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const themeModeKey = 'halve:theme';

/// Provides the [SharedPreferences] instance used by [ThemeModeNotifier].
/// Defaults to null (in-memory / no persistence). `main.dart` overrides this
/// with the real instance; widget tests override with a mock.
final sharedPreferencesProvider = Provider<SharedPreferences?>((ref) => null);

/// Persists the user's theme preference to shared_preferences and exposes it as
/// a [ThemeMode] via Riverpod. The MaterialApp watches this notifier and
/// rebuilds when the mode changes. Null prefs = in-memory only (test / guest
/// fallback).
class ThemeModeNotifier extends Notifier<ThemeMode> {
  static ThemeMode _load(SharedPreferences? prefs) {
    if (prefs == null) return ThemeMode.system;
    return switch (prefs.getString(themeModeKey) ?? 'system') {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };
  }

  @override
  ThemeMode build() => _load(ref.read(sharedPreferencesProvider));

  Future<void> setMode(ThemeMode mode) async {
    state = mode;
    final raw = switch (mode) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      _ => 'system',
    };
    await ref.read(sharedPreferencesProvider)?.setString(themeModeKey, raw);
  }
}

/// Riverpod provider. Defaults to [ThemeMode.system] with no persistence (no
/// prefs). `main.dart` overrides [sharedPreferencesProvider] with real
/// [SharedPreferences]; widget tests override it with mock prefs.
final themeModeProvider =
    NotifierProvider<ThemeModeNotifier, ThemeMode>(ThemeModeNotifier.new);
