import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../router/app_router.dart';
import '../../widgets/widgets.dart';
import '../phase_placeholder.dart';

/// Archive — month calendar of past puzzles (Phase 10). Phase 3 wires the
/// today-cell → Play and a sample past day → Play(date).
class ArchiveScreen extends StatelessWidget {
  const ArchiveScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeScaffold(
      body: Column(
        children: [
          const HalveTopBar(title: 'Archive'),
          Expanded(
            child: PhasePlaceholder(
              eyebrow: 'Archive',
              title: 'Past puzzles',
              phaseNote: 'Archive — Phase 10',
              actions: [
                HalveButton(
                  label: 'Play today',
                  full: true,
                  onPressed: () => context.push(Routes.play),
                ),
                HalveButton(
                  label: 'Open 31 May',
                  variant: HalveButtonVariant.secondary,
                  full: true,
                  onPressed: () => context.push(Routes.playDate('2026-05-31')),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
