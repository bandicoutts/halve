import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'router/app_router.dart';
import 'theme/theme.dart';

/// Supabase project credentials, injected at build time via
/// `--dart-define=SUPABASE_URL=… --dart-define=SUPABASE_ANON_KEY=…`.
/// Empty until Phase 4 wires the real env / data layer — initialization is
/// guarded so `flutter run` works without them.
const _supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const _supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (_supabaseUrl.isNotEmpty && _supabaseAnonKey.isNotEmpty) {
    try {
      await Supabase.initialize(url: _supabaseUrl, anonKey: _supabaseAnonKey);
    } catch (e) {
      debugPrint('Supabase init failed (continuing as guest): $e');
    }
  } else {
    debugPrint('Supabase credentials absent — running without a backend '
        '(Phase 4 wires this).');
  }

  runApp(const ProviderScope(child: HalveApp()));
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
