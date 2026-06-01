import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../router/app_router.dart';
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';
import '../phase_placeholder.dart';

/// Home / daily entry (Phase 6 fills the real streak band + CTA). Phase 3 wires
/// the entry points: Play today, Practice, and the Settings gear.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return SafeScaffold(
      body: Column(
        children: [
          HalveTopBar(
            leading: Padding(
              padding: const EdgeInsets.only(left: AppSpacing.s2),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const HalveMark(size: 24),
                  const SizedBox(width: AppSpacing.s2),
                  Text('Halve',
                      style: Theme.of(context)
                          .textTheme
                          .titleLarge
                          ?.copyWith(color: c.fg1, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            trailing: HalveIconButton(
              semanticLabel: 'Settings',
              onPressed: () => context.push(Routes.settings),
              child: const Icon(Icons.settings_outlined),
            ),
          ),
          Expanded(
            child: PhasePlaceholder(
              eyebrow: 'Today',
              title: "Today's puzzle",
              phaseNote: 'Home — Phase 6',
              actions: [
                HalveButton(
                  label: 'Play today',
                  full: true,
                  onPressed: () => context.push(Routes.play),
                ),
                HalveButton(
                  label: 'Practice',
                  variant: HalveButtonVariant.secondary,
                  full: true,
                  onPressed: () => context.push(Routes.practice),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
