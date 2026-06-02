import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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

  // Edge-to-edge on Android: app renders behind the status bar and gesture
  // navigation bar. SafeArea widgets in the Dart layer guard content insets.
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

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

  // Notification init (timezone DB + platform channel) is deferred to after
  // runApp so it doesn't delay the first frame. The routeStream tap handler in
  // HalveApp listens to the same singleton, so notifications that arrive
  // before init completes are queued and handled once the stream is ready.
  runApp(ProviderScope(
    overrides: overrides,
    child: HalveApp(
      initialLocation: firstRunInitialLocation(onboarded: onboarded),
      prefsFuture: prefs,
    ),
  ));
}

class HalveApp extends StatefulWidget {
  const HalveApp({
    super.key,
    this.initialLocation = Routes.home,
    this.prefsFuture,
  });

  final String initialLocation;

  /// Passed through so notification reschedule can run post-first-frame
  /// without a second SharedPreferences.getInstance() call.
  final SharedPreferences? prefsFuture;

  @override
  State<HalveApp> createState() => _HalveAppState();
}

class _HalveAppState extends State<HalveApp> {
  late final GoRouter _router;

  // Cached once — ThemeData construction is non-trivial; don't rebuild on
  // every Consumer rebuild triggered by theme-mode changes.
  static final _lightTheme = AppTheme.light();
  static final _darkTheme = AppTheme.dark();

  @override
  void initState() {
    super.initState();
    _router = createAppRouter(initialLocation: widget.initialLocation);
    NotificationService.instance.routeStream.listen(_router.go);

    // Init and reschedule notifications after the first frame so startup
    // latency (initializeTimeZones + platform channels) doesn't block paint.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(_initNotifications());
    });
  }

  Future<void> _initNotifications() async {
    try {
      await NotificationService.instance.init();
      final prefs = widget.prefsFuture;
      if (prefs != null) {
        await NotificationService.instance.rescheduleOnLaunch(prefs);
      }
    } catch (e) {
      debugPrint('Notification init failed (non-fatal): $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer(
      builder: (context, ref, _) {
        final themeMode = ref.watch(themeModeProvider);
        return MaterialApp.router(
          title: 'Halve',
          debugShowCheckedModeBanner: false,
          theme: _lightTheme,
          darkTheme: _darkTheme,
          themeMode: themeMode,
          routerConfig: _router,
        );
      },
    );
  }
}
