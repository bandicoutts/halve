import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../router/app_router.dart';
import '../../widgets/widgets.dart';
import '../phase_placeholder.dart';

/// Practice — difficulty picker (Phase 12). Phase 3 wires Play → the practice
/// board with the chosen difficulty.
class PracticeScreen extends StatelessWidget {
  const PracticeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeScaffold(
      body: Column(
        children: [
          HalveTopBar(title: 'Practice', onBack: () => context.pop()),
          Expanded(
            child: PhasePlaceholder(
              eyebrow: 'Difficulty',
              title: 'Practice',
              phaseNote: 'Difficulty picker — Phase 12',
              actions: [
                HalveButton(
                  label: 'Play',
                  full: true,
                  onPressed: () =>
                      context.push(Routes.practicePlay(difficulty: 'medium')),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
