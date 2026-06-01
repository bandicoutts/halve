import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'data/notification_service.dart';
import 'data/onboarding.dart';
import 'data/puzzle_cache.dart';
import 'data/supabase_client.dart';
import 'providers/providers.dart';
import 'router/app_router.dart';
import 'theme/theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Supabase (graceful: absent build-time creds → guest mode).
  try {
    final ok = await initSupabase();
    debugPrint(ok
        ? 'Supabase initialised.'
        : 'Supabase credentials absent — running as guest (no backend).');
  } catch (e) {
    debugPrint('Supabase init failed (continuing as guest): $e');
  }

  // Persistent offline puzzle cache + theme mode.
  final overrides = <Override>[];
  var onboarded = false;
  SharedPreferences? prefs;
  try {
    prefs = await SharedPreferences.getInstance();
    overrides.add(puzzleCacheProvider.overrideWithValue(PrefsPuzzleCache(prefs)));
    overrides.add(
      themeModeProvider.overrideWith((ref) => ThemeModeNotifier(prefs!)),
    );
    onboarded = prefs.getBool(onboardedKey) ?? false;
  } catch (e) {
    debugPrint('SharedPreferences unavailable — using in-memory cache: $e');
  }

  // Local notifications: init channel + timezone.
  await NotificationService.instance.init();

  // Reschedule daily reminder on every launch (survives app updates that wipe
  // pending notifications, and picks up time changes made since last launch).
  if (prefs != null) {
    await NotificationService.instance.rescheduleOnLaunch(prefs);
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

  final String initialLocation;

  @override
  State<HalveApp> createState() => _HalveAppState();
}

class _HalveAppState extends State<HalveApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _router = createAppRouter(initialLocation: widget.initialLocation);
    // Route to /play when the user taps a local notification.
    NotificationService.instance.routeStream.listen(_router.go);
  }

  @override
  Widget build(BuildContext context) {
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
