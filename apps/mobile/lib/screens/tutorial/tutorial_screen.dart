import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../router/app_router.dart';
import 'tutorial_flow.dart';

/// The standalone "How to play" tutorial, reachable from the Home + Play
/// footers. Same guided flow as first-run, but it simply returns the player to
/// where they came from (it does not gate or re-launch the daily). Skipping or
/// finishing both pop back.
class TutorialScreen extends StatefulWidget {
  const TutorialScreen({super.key});

  @override
  State<TutorialScreen> createState() => _TutorialScreenState();
}

enum _Phase { flow, win }

class _TutorialScreenState extends State<TutorialScreen> {
  _Phase _phase = _Phase.flow;

  void _exit() => context.canPop() ? context.pop() : context.go(Routes.home);

  @override
  Widget build(BuildContext context) {
    return switch (_phase) {
      _Phase.flow => TutorialFlow(
          onSkip: _exit,
          onComplete: () => setState(() => _phase = _Phase.win),
        ),
      _Phase.win => TutorialWin(
          continueLabel: 'Done',
          onContinue: _exit,
        ),
    };
  }
}
