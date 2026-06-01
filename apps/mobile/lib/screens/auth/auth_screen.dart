import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../widgets/widgets.dart';
import '../phase_placeholder.dart';

/// Auth — magic-link sign-in (Phase 14). Guest play is the default; this is
/// reached only from Settings → Account.
class AuthScreen extends StatelessWidget {
  const AuthScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeScaffold(
      body: Column(
        children: [
          HalveTopBar(onBack: () => context.pop()),
          const Expanded(
            child: PhasePlaceholder(
              title: 'Sign in to keep your streak safe',
              phaseNote: 'Magic-link auth — Phase 14',
            ),
          ),
        ],
      ),
    );
  }
}
