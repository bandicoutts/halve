import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../theme/theme.dart';
import '../../widgets/widgets.dart';
import '../phase_placeholder.dart';

/// The play board (Phase 7) — a full-screen route that lives OUTSIDE the tab
/// shell, so the bottom nav is simply absent here (native rule: the board owns
/// the screen). Header is just back + difficulty. Serves the daily puzzle, an
/// archive day ([date]), or a practice puzzle ([isPractice]).
class PlayScreen extends StatelessWidget {
  const PlayScreen({super.key, this.date, this.difficulty, this.isPractice = false});

  /// Archive day in `yyyy-MM-dd` (null = today's daily).
  final String? date;

  /// Practice difficulty (easy/medium/hard), when [isPractice].
  final String? difficulty;
  final bool isPractice;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final label = isPractice
        ? 'Practice · ${difficulty ?? 'medium'}'
        : (date == null ? 'Daily' : date!);

    return SafeScaffold(
      safeBottom: true,
      body: Column(
        children: [
          HalveTopBar(
            onBack: () => context.pop(),
            trailing: Padding(
              padding: const EdgeInsets.only(right: AppSpacing.s4),
              child: Text(
                label.toUpperCase(),
                style: Theme.of(context).textTheme.labelLarge?.copyWith(color: c.fg3),
              ),
            ),
          ),
          const Expanded(
            child: PhasePlaceholder(
              title: 'Play board',
              phaseNote: 'Board + game loop — Phase 7',
            ),
          ),
        ],
      ),
    );
  }
}
