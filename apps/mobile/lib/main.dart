import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'theme/theme.dart';
import 'widgets/widgets.dart';

/// Entry point. The real app shell (Supabase init, MaterialApp.router,
/// bottom-tab navigation) is built in Phase 3. Phase 2 wires the Halve design
/// system (light/dark themes) and renders a small holding screen that exercises
/// the new primitives so `flutter run` / `flutter test` work against a real,
/// themed widget tree.
void main() {
  runApp(const ProviderScope(child: HalveApp()));
}

class HalveApp extends StatelessWidget {
  const HalveApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Halve',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.system,
      home: const _HoldingScreen(),
    );
  }
}

class _HoldingScreen extends StatelessWidget {
  const _HoldingScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const HalveMark(size: 48),
            const SizedBox(height: AppSpacing.s4),
            Text('Halve', style: Theme.of(context).textTheme.headlineLarge),
            const SizedBox(height: AppSpacing.s5),
            const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SymbolDisc(size: 40),
                SizedBox(width: AppSpacing.s4),
                SymbolRing(size: 40),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
