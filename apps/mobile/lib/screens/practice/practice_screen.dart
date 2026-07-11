import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/models.dart';
import '../../router/app_router.dart';
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';
import 'practice_provider.dart';

/// Difficulty picker for Practice mode. Lets the player choose Easy / Medium /
/// Hard, then launches the practice play board via [Routes.practicePlay].
/// Matches the `PracticeScreen` wireframe in `app/screens/practice.jsx`.
class PracticeScreen extends ConsumerWidget {
  const PracticeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.halveColors;

    return SafeScaffold(
      safeBottom: true,
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          context.hPagePad,
          14,
          context.hPagePad,
          AppSpacing.s7,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'PRACTICE · UNLIMITED',
              style: AppTypography.monoLabel.copyWith(color: c.fg3),
            ),
            const SizedBox(height: 8),
            Text(
              'Off the record.',
              style: AppTypography.editorialH1.copyWith(color: c.fg1),
            ),
            const SizedBox(height: 8),
            Text(
              'As many puzzles as you like. The streak is never at stake here.',
              style: AppTypography.small.copyWith(color: c.fg3, height: 1.55),
            ),
            const SizedBox(height: 24),
            Container(
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: c.hairline)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  for (final diff in Difficulty.values) ...[
                    _DifficultyRow(
                      difficulty: diff,
                      onTap: () {
                        ref.read(selectedDifficultyProvider.notifier).state =
                            diff;
                        context.push(
                          Routes.practicePlay(difficulty: diff.wire),
                        );
                      },
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DifficultyRow extends StatelessWidget {
  const _DifficultyRow({required this.difficulty, required this.onTap});

  final Difficulty difficulty;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return TapFade(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 2),
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: c.hairline)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Expanded(
                  child: Text(
                    difficulty.label,
                    style: AppTypography.editorialH2.copyWith(
                      fontSize: 27,
                      color: c.fg1,
                    ),
                  ),
                ),
                Text(
                  'PLAY →',
                  style: AppTypography.monoLabel.copyWith(color: c.accent),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              _meta(difficulty),
              style: AppTypography.monoMicro.copyWith(color: c.fg3),
            ),
            const SizedBox(height: 6),
            Text(
              _desc(difficulty),
              style: AppTypography.small.copyWith(
                color: c.fg3,
                height: 1.5,
                fontSize: 13.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _meta(Difficulty d) => switch (d) {
  Difficulty.easy => '14 GIVENS · 4 LINKS',
  Difficulty.medium => '11 GIVENS · 5 LINKS',
  Difficulty.hard => '8 GIVENS · 7 LINKS',
};

String _desc(Difficulty d) => switch (d) {
  Difficulty.easy =>
    'A generous start - most of the logic is laid out for you.',
  Difficulty.medium => "The daily's weight. Fewer footholds, steady deduction.",
  Difficulty.hard => 'Sparse and slow-burning. Every placement is earned.',
};
