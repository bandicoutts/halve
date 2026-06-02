import 'package:flutter/material.dart';

import '../theme/theme.dart';
import '../widgets/widgets.dart';

/// Shared placeholder body used by the Phase 3 shell. Each real screen replaces
/// this in its own phase (6–14); for now it shows the brand mark, the screen
/// title, the phase that will build it, and any navigation actions so the app
/// shell is fully walkable.
class PhasePlaceholder extends StatelessWidget {
  const PhasePlaceholder({
    super.key,
    required this.title,
    required this.phaseNote,
    this.eyebrow,
    this.actions = const [],
  });

  final String title;
  final String phaseNote;
  final String? eyebrow;

  /// Buttons stacked below the note (e.g. navigation entry points).
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.s5),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const HalveMark(size: 44),
            const SizedBox(height: AppSpacing.s5),
            if (eyebrow != null) ...[
              Text(eyebrow!.toUpperCase(),
                  style: Theme.of(context).textTheme.labelLarge),
              const SizedBox(height: AppSpacing.s2),
            ],
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineLarge,
            ),
            const SizedBox(height: AppSpacing.s3),
            Text(
              phaseNote,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: c.fg3),
            ),
            if (actions.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.s7),
              for (final a in actions) ...[
                a,
                const SizedBox(height: AppSpacing.s3),
              ],
            ],
          ],
        ),
      ),
    );
  }
}
