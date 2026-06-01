import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'data/onboarding.dart';
import 'data/puzzle_cache.dart';
import 'data/supabase_client.dart';
import 'providers/providers.dart';
import 'router/app_router.dart';
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

  // Persistent offline puzzle cache + theme mode. Falls back to in-memory /
  // ThemeMode.system if prefs fail. Also reads the first-run gate flag to
  // pick the cold-start landing route.
  final overrides = <Override>[];
  var onboarded = false;
  try {
    final prefs = await SharedPreferences.getInstance();
    overrides.add(puzzleCacheProvider.overrideWithValue(PrefsPuzzleCache(prefs)));
    overrides.add(
      themeModeProvider.overrideWith((ref) => ThemeModeNotifier(prefs)),
    );
    onboarded = prefs.getBool(onboardedKey) ?? false;
  } catch (e) {
    debugPrint('SharedPreferences unavailable — using in-memory cache: $e');
  }

  runApp(ProviderScope(
    overrides: overrides,
    child: HalveApp(
      initialLocation: firstRunInitialLocation(onboarded: onboarded),
    ),
  ));
}

class HalveApp extends StatefulWidget {
  const HalveApp({super.key, this.initialLocation = Routes.home});

  /// The cold-start route — `/firstrun` for a fresh device, `/` otherwise.
  final String initialLocation;

  @override
  State<HalveApp> createState() => _HalveAppState();
}

class _HalveAppState extends State<HalveApp> {
  // Built once and held so navigation state survives rebuilds.
  late final _router = createAppRouter(initialLocation: widget.initialLocation);

  @override
  Widget build(BuildContext context) {
    // Consumer watches themeModeProvider so the MaterialApp rebuilds when the
    // user changes the theme in Settings, without rebuilding the entire widget.
    return Consumer(
      builder: (context, ref, _) {
        final themeMode = ref.watch(themeModeProvider);
        return MaterialApp.router(
          title: 'Halve',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.light(),
          darkTheme: AppTheme.dark(),
          themeMode: themeMode,
          routerConfig: _router,
        );
      },
    );
  }
}
