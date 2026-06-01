import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/notification_service.dart';
import '../../data/onboarding.dart';
import '../../router/app_router.dart';
import '../tutorial/tutorial_flow.dart';

/// The first-run flow shown once per device (the cold-start gate routes here
/// when [onboardedKey] is unset — see `main.dart`). Teaches the rules via the
/// guided tutorial, lands on the "you've got it" beat, then launches the
/// player's first real daily. Skipping at any point drops to Home. Either way
/// the device is marked onboarded so this never shows again.
class FirstRunScreen extends ConsumerStatefulWidget {
  const FirstRunScreen({super.key});

  @override
  ConsumerState<FirstRunScreen> createState() => _FirstRunScreenState();
}

enum _Phase { tutorial, win }

class _FirstRunScreenState extends ConsumerState<FirstRunScreen> {
  _Phase _phase = _Phase.tutorial;

  Future<void> _markOnboarded() =>
      ref.read(onboardingStoreProvider).setOnboarded();

  Future<void> _skip() async {
    await _markOnboarded();
    if (mounted) context.go(Routes.home);
  }

  Future<void> _playFirstPuzzle() async {
    // Request OS notification permission when the user accepts (taps Continue).
    // iOS: provisional authorization (quiet, no aggressive banner dialog).
    // Android 13+: POST_NOTIFICATIONS dialog shown by the OS.
    await NotificationService.instance.requestPermission();
    await _markOnboarded();
    if (mounted) context.go(Routes.play);
  }

  @override
  Widget build(BuildContext context) {
    return switch (_phase) {
      _Phase.tutorial => TutorialFlow(
          onSkip: _skip,
          onComplete: () => setState(() => _phase = _Phase.win),
        ),
      _Phase.win => TutorialWin(
          continueLabel: "Play today's puzzle",
          onContinue: _playFirstPuzzle,
        ),
    };
  }
}
