import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Entry point. The real app shell (Supabase init, MaterialApp.router,
/// theming, bottom-tab navigation) is built in Phase 3. For Phase 1 this is a
/// minimal placeholder that boots a ProviderScope and renders a holding screen
/// so `flutter run` / `flutter test` work against a real widget tree.
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
      theme: ThemeData(useMaterial3: true),
      home: const _ScaffoldPlaceholder(),
    );
  }
}

class _ScaffoldPlaceholder extends StatelessWidget {
  const _ScaffoldPlaceholder();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('Halve'),
      ),
    );
  }
}
