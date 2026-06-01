import 'package:flutter/material.dart';

import '../../widgets/widgets.dart';
import '../phase_placeholder.dart';

/// Stats / profile — streak history + distributions (Phase 11).
class StatsScreen extends StatelessWidget {
  const StatsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const SafeScaffold(
      body: Column(
        children: [
          HalveTopBar(title: 'Stats'),
          Expanded(
            child: PhasePlaceholder(
              eyebrow: 'Stats',
              title: 'Your stats',
              phaseNote: 'Stats — Phase 11',
            ),
          ),
        ],
      ),
    );
  }
}
