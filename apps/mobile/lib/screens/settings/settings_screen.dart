import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../router/app_router.dart';
import '../../widgets/widgets.dart';
import '../phase_placeholder.dart';

/// Settings (Phase 13). Phase 3 wires the Account → Sign in entry point.
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeScaffold(
      body: Column(
        children: [
          HalveTopBar(title: 'Settings', onBack: () => context.pop()),
          Expanded(
            child: PhasePlaceholder(
              eyebrow: 'Account',
              title: 'Settings',
              phaseNote: 'Theme · account · about — Phase 13',
              actions: [
                HalveButton(
                  label: 'Sign in',
                  variant: HalveButtonVariant.secondary,
                  full: true,
                  onPressed: () => context.push(Routes.auth),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
