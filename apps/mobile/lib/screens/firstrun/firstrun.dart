import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../router/app_router.dart';
import '../../widgets/widgets.dart';
import '../phase_placeholder.dart';

/// First-run onboarding overlay (Phase 9) — shown on first launch before the
/// shell. Phase 3 wires a "Get started" exit into the app.
class FirstRunScreen extends StatelessWidget {
  const FirstRunScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeScaffold(
      safeBottom: true,
      body: PhasePlaceholder(
        title: 'Welcome to Halve',
        phaseNote: 'First-run flow — Phase 9',
        actions: [
          HalveButton(
            label: 'Get started',
            full: true,
            onPressed: () => context.go(Routes.home),
          ),
        ],
      ),
    );
  }
}
