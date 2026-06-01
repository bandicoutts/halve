import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'data/puzzle_cache.dart';
import 'data/supabase_client.dart';
import 'router/app_router.dart';
import 'screens/home/home_provider.dart';
import 'theme/theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialise Supabase if build-time creds are present; otherwise run as a
  // guest with no backend (keeps `flutter run` working until creds are wired).
  try {
    final ok = await initSupabase();
    debugPrint(ok
        ? 'Supabase initialised.'
        : 'Supabase credentials absent — running as guest (no backend).');
  } catch (e) {
    debugPrint('Supabase init failed (continuing as guest): $e');
  }

  // Persistent offline puzzle cache (D3). Falls back to in-memory if prefs fail.
  final overrides = <Override>[];
  try {
    final prefs = await SharedPreferences.getInstance();
    overrides.add(puzzleCacheProvider.overrideWithValue(PrefsPuzzleCache(prefs)));
  } catch (e) {
    debugPrint('SharedPreferences unavailable — using in-memory cache: $e');
  }

  runApp(ProviderScope(overrides: overrides, child: const HalveApp()));
}

class HalveApp extends StatefulWidget {
  const HalveApp({super.key});

  @override
  State<HalveApp> createState() => _HalveAppState();
}

class _HalveAppState extends State<HalveApp> {
  // Built once and held so navigation state survives rebuilds.
  final _router = createAppRouter();

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Halve',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.system, // overridable by Settings in Phase 13
      routerConfig: _router,
    );
  }
}
