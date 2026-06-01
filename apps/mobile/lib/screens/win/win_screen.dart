import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../router/app_router.dart';
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';
import '../play/play_provider.dart';

/// Win screen — Phase 8 builds the keepsake card, share sheet, streak nudge,
/// and "next puzzle in" countdown. This is a minimal hand-off placeholder: it
/// shows the solve time and difficulty and routes back home / to stats, so the
/// full core loop is walkable end-to-end. Accepts the [PlayResult] passed via
/// `context.push(Routes.win, extra: …)`.
class WinScreen extends ConsumerWidget {
  const WinScreen({super.key, this.result});

  final PlayResult? result;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.halveColors;
    final r = result;

    // Defensive: a deep link / refresh with no result → go home.
    if (r == null) {
      return SafeScaffold(
        safeBottom: true,
        body: Center(
          child: HalveButton(
            label: 'Back to today',
            onPressed: () => context.go(Routes.home),
          ),
        ),
      );
    }

    return SafeScaffold(
      safeBottom: true,
      body: Column(
        children: [
          HalveTopBar(
            onBack: () => context.go(Routes.home),
            trailing: Padding(
              padding: const EdgeInsets.only(right: AppSpacing.s5),
              child: Text(
                'COMPLETE',
                style: AppTypography.label.copyWith(color: c.fg3),
              ),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s5),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const HalveMark(size: 46),
                  const SizedBox(height: AppSpacing.s4),
                  Text(
                    'Solved in',
                    style: AppTypography.small.copyWith(color: c.fg3),
                  ),
                  const SizedBox(height: AppSpacing.s1),
                  Text(
                    r.formattedTime,
                    style: AppTypography.tabular(AppTypography.display)
                        .copyWith(color: c.fg1),
                  ),
                  const SizedBox(height: AppSpacing.s2),
                  Text(
                    r.difficulty.wire.toUpperCase(),
                    style: AppTypography.label.copyWith(color: c.fg3),
                  ),
                  const SizedBox(height: AppSpacing.s7),
                  HalveButton(
                    label: 'See your stats',
                    full: true,
                    onPressed: () => context.go(Routes.stats),
                  ),
                  const SizedBox(height: AppSpacing.s3),
                  HalveButton(
                    label: 'Back to today',
                    variant: HalveButtonVariant.secondary,
                    full: true,
                    onPressed: () => context.go(Routes.home),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
