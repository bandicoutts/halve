import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../widgets/widgets.dart';
import '../phase_placeholder.dart';

/// Tutorial — the 4×4 teach board + rule walkthrough (Phase 9).
class TutorialScreen extends StatelessWidget {
  const TutorialScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeScaffold(
      safeBottom: true,
      body: Column(
        children: [
          HalveTopBar(onBack: () => context.pop()),
          const Expanded(
            child: PhasePlaceholder(
              title: 'How to play',
              phaseNote: 'Tutorial flow — Phase 9',
            ),
          ),
        ],
      ),
    );
  }
}
