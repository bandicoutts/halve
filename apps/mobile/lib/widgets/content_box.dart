import 'package:flutter/material.dart';

import '../theme/breakpoints.dart';

/// Centers [child] within [Breakpoints.contentWidth] on tablet screens.
/// On phone it passes [child] through unchanged.
///
/// Use for non-scroll content (e.g. a Column child). For [ScrollView]s apply
/// [BuildContext.hPagePad] to the scroll view's padding directly.
class HvContentBox extends StatelessWidget {
  const HvContentBox({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    if (!context.isTablet) return child;
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: Breakpoints.contentWidthPortrait),
        child: child,
      ),
    );
  }
}
